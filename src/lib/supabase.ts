import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Warn but don't throw — local-api mode may import this module but never use it
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (!import.meta.env.VITE_USE_LOCAL_API && !import.meta.env.VITE_API_BASE_URL) {
    console.error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — Supabase client will not work');
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Keep session alive — refresh before expiry
    flowType: 'pkce',
  },
});

// ═══════════════════════════════════════════════════════════
// Request Deduplication
// If the same query is already in-flight, return the existing promise
// ═══════════════════════════════════════════════════════════

const _inflight = new Map<string, { promise: Promise<unknown>; timestamp: number }>();
const DEDUP_TTL = 2000; // 2s — same query within 2s returns cached promise

/**
 * Deduplicated fetch — prevents identical Supabase queries from firing simultaneously.
 * Usage: const data = await dedup('tasks-list', () => supabase.from('tasks').select('*'));
 */
export function dedup<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
  const existing = _inflight.get(key);
  if (existing && Date.now() - existing.timestamp < DEDUP_TTL) {
    return existing.promise as Promise<T>;
  }

  const promise = queryFn().finally(() => {
    // Clean up after resolution + TTL
    setTimeout(() => _inflight.delete(key), DEDUP_TTL);
  });

  _inflight.set(key, { promise, timestamp: Date.now() });
  return promise;
}
