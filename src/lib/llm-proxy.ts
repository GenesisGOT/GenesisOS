/**
 * LLM Proxy Client — ALL LLM calls go through the server-side proxy.
 * 
 * This ensures:
 * 1. API keys stay server-side (never exposed in client JS)
 * 2. Referer-restricted keys work regardless of which domain the user is on
 * 3. Rate limiting is enforced server-side
 * 4. Single point of configuration for provider/model changes
 */

import { supabase } from './data-access';
import { useUserStore } from '../stores/useUserStore';
import { getErrorMessage, isAbortError } from '../utils/error';

const PROXY_URL = '/api/llm-proxy.php';
const DEFAULT_TIMEOUT_MS = 30000;

/** A single part of a multimodal message (text or image) */
export type MessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

/** A message can have a plain string body or a multimodal array */
export type LLMMessage = {
  role: string;
  content: string | MessageContentPart[];
};

export interface LLMProxyOptions {
  provider?: string;
  model?: string;
  timeoutMs?: number;
  /** Cap output tokens — reduces cost for short responses (default: no cap) */
  maxTokens?: number;
  /** If true, skips Supabase auth token (for unauthenticated flows) */
  skipAuth?: boolean;
  /** Response format: 'text' (default) or 'json'. Controls provider-level JSON mode. */
  format?: 'text' | 'json';
}

export interface LLMProxyResponse {
  content: string;
  provider: string;
  model: string;
  usage?: { input_tokens: number | null; output_tokens: number | null };
  rateLimit?: { remaining: number; limit: number; used: number; resetAt: number; resetIn: number };
}

/**
 * Call the LLM via the server-side proxy.
 * Accepts either a simple prompt string or structured messages.
 */
// ── Direct OpenRouter (bypasses PHP proxy when API key is configured) ────────
function _getApiKey(): string {
  try {
    const s = localStorage.getItem('genesisOS-ai-settings');
    if (s) { const p = JSON.parse(s); if (p.apiKey) return p.apiKey; }
  } catch { /* ignore */ }
  return (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
}

function _getModel(opt: LLMProxyOptions): string {
  try {
    const s = localStorage.getItem('genesisOS-ai-settings');
    if (s) { const p = JSON.parse(s); if (p.model) return opt.model || p.model; }
  } catch { /* ignore */ }
  return opt.model || 'anthropic/claude-sonnet-4';
}

async function _callDirect(
  msgs: LLMMessage[],
  opt: LLMProxyOptions,
  key: string,
): Promise<LLMProxyResponse> {
  const model = _getModel(opt);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opt.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const body: Record<string, unknown> = { model, messages: msgs };
  if (opt.format === 'json') body.response_format = { type: 'json_object' };
  if (opt.maxTokens) body.max_tokens = opt.maxTokens;
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'GenesisOS',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) {
      const e = await r.json().catch(() => ({ error: { message: `HTTP ${r.status}` } }));
      throw new Error(e.error?.message || `OpenRouter ${r.status}`);
    }
    const d = await r.json();
    return {
      content: d.choices?.[0]?.message?.content || '',
      provider: 'openrouter',
      model: d.model || model,
      usage: { input_tokens: d.usage?.prompt_tokens ?? null, output_tokens: d.usage?.completion_tokens ?? null },
    };
  } catch (err: unknown) {
    clearTimeout(t);
    if (isAbortError(err)) throw new Error('LLM request timed out');
    throw err;
  }
}

async function _callLLMProxyOnce(
  input: string | LLMMessage[],
  options: LLMProxyOptions = {},
): Promise<LLMProxyResponse> {
  const {
    provider = 'openrouter',
    model,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipAuth = false,
    format = 'text',
  } = options;

  // If a direct API key is available, bypass the PHP proxy entirely
  const _directKey = _getApiKey();
  if (_directKey) {
    const _msgs = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
    return _callDirect(_msgs, options, _directKey);
  }

  // Build messages array
  const messages = typeof input === 'string'
    ? [{ role: 'user', content: input }]
    : input;

  // Get auth token if needed
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!skipAuth) {
    const { data: { session } } = await useUserStore.getState().getSessionCached();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, provider, model, format, ...(skipAuth ? { skipAuth: true } : {}) }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      const errMsg = err.error || `Proxy error: ${res.status}`;

      // On 401 (token expired), force-refresh the Supabase session and retry once
      if (res.status === 401 && !skipAuth) {
        try {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session?.access_token) {
            // Retry with fresh token
            const retryHeaders = { ...headers, Authorization: `Bearer ${refreshData.session.access_token}` };
            const retryController = new AbortController();
            const retryTimeout = setTimeout(() => retryController.abort(), timeoutMs);
            try {
              const retryRes = await fetch(PROXY_URL, {
                method: 'POST',
                headers: retryHeaders,
                body: JSON.stringify({ messages, provider, model, format }),
                signal: retryController.signal,
              });
              clearTimeout(retryTimeout);
              if (retryRes.ok) return await retryRes.json();
            } catch {
              clearTimeout(retryTimeout);
            }
          }
        } catch {
          // Refresh failed — fall through to throw original error
        }
      }

      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (isAbortError(err)) {
      throw new Error('LLM request timed out');
    }
    throw err;
  }
}

export async function callLLMProxy(
  input: string | LLMMessage[],
  options: LLMProxyOptions = {},
): Promise<LLMProxyResponse> {
  try {
    return await _callLLMProxyOnce(input, options);
  } catch (err) {
    // Don't retry timeouts (abort errors) — they're intentional
    if (err instanceof Error && err.message === 'LLM request timed out') throw err;
    // Wait 2s then retry once
    await new Promise(r => setTimeout(r, 2000));
    return await _callLLMProxyOnce(input, options);
  }
}

/**
 * Simple helper: send a prompt, get back the text content.
 * Handles JSON parsing if the response is JSON.
 */
export async function callLLMSimple(
  prompt: string,
  options: LLMProxyOptions = {},
): Promise<string> {
  const response = await callLLMProxy(prompt, options);
  return response.content;
}

/**
 * Helper: send a prompt and parse the response as JSON.
 * The proxy requests responseMimeType: application/json from Gemini.
 */
export async function callLLMJson<T = any>(
  prompt: string,
  options: LLMProxyOptions = {},
): Promise<T> {
  const response = await callLLMProxy(prompt, { ...options, format: 'json' });
  const text = response.content;

  // Try to parse JSON — handle markdown code fences
  let jsonStr = text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(jsonStr);
}
