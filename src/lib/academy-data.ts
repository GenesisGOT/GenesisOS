/**
 * Academy Data Access Layer
 *
 * In Tauri mode: uses invoke() to read files/media directly from disk via Rust.
 * In browser mode: fetches from Flask API endpoints.
 *
 * API endpoints (Flask backend):
 *   GET /api/academy/overview    — full overview with all data
 *   GET /api/academy/curriculum  — curriculum phases & subjects
 *   GET /api/academy/music       — study + realm music tracks
 *   GET /api/academy/references  — reference book repos
 *   GET /api/academy/backgrounds — realm background images
 *   GET /api/academy/nature      — fauna/flora datasets
 *   GET /api/academy/lesson?path=... — read a lesson file
 *   GET /api/media/<type>/<file> — serve media files
 */

import { ACADEMY_ROOT } from '../data/academy-manifest';

// ─── Tauri Detection ────────────────────────────────────────

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

let _invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
let _convertFileSrc: ((path: string, protocol?: string) => string) | null = null;

async function getTauriInvoke() {
  if (_invoke) return _invoke;
  if (!isTauri) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    _invoke = invoke;
    return _invoke;
  } catch {
    return null;
  }
}

async function getConvertFileSrc() {
  if (_convertFileSrc) return _convertFileSrc;
  if (!isTauri) return null;
  try {
    const { convertFileSrc } = await import('@tauri-apps/api/core');
    _convertFileSrc = convertFileSrc;
    return _convertFileSrc;
  } catch {
    return null;
  }
}

// ─── HTTP fallback base URL ─────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ─── Types ───────────────────────────────────────────────────

export interface AcademyLesson {
  name: string;
  file: string;
  path: string;
}

export interface AcademySubject {
  id: string;
  name: string;
  lessons: AcademyLesson[];
  lessonCount: number;
}

export interface AcademyPhase {
  id: string;
  name: string;
  phase: string;
  subjects: AcademySubject[];
  subjectCount: number;
}

export interface MusicTrack {
  name: string;
  file: string;
  path: string;
  size: number;
  type: 'study-music' | 'realm-music';
}

export interface Reference {
  id: string;
  name: string;
  path: string;
  hasReadme: boolean;
}

export interface Background {
  name: string;
  file: string;
  path: string;
  size: number;
}

export interface NatureDataset {
  name: string;
  file: string;
  path: string;
  rows: number;
  category: 'fauna' | 'flora';
}

export interface AcademyOverview {
  curriculum: AcademyPhase[];
  music: MusicTrack[];
  references: Reference[];
  backgrounds: Background[];
  nature: NatureDataset[];
  stats: {
    phases: number;
    musicTracks: number;
    references: number;
    backgrounds: number;
    natureDatasets: number;
  };
}

// ─── API Helpers ─────────────────────────────────────────────

async function academyFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}/api/academy/${endpoint}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    console.warn(`[academy] Failed to fetch ${endpoint}:`, err);
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────

/** Get full academy overview (one request for everything). */
export async function getAcademyOverview(): Promise<AcademyOverview | null> {
  if (isTauri) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        const stats = await invoke('get_academy_overview') as Record<string, number>;
        return {
          curriculum: [],
          music: [],
          references: [],
          backgrounds: [],
          nature: [],
          stats: {
            phases: stats.phases ?? 0,
            musicTracks: stats.studyMusicTracks ?? 0,
            references: 0,
            backgrounds: stats.backgrounds ?? 0,
            natureDatasets: stats.natureDatasets ?? 0,
          },
        };
      }
    } catch (err) {
      console.warn('[academy] Tauri overview failed:', err);
    }
  }
  return academyFetch<AcademyOverview>('overview');
}

/** Get just the curriculum structure. */
export async function getCurriculum(): Promise<AcademyPhase[]> {
  return (await academyFetch<AcademyPhase[]>('curriculum')) ?? [];
}

/** Get all available music tracks. */
export async function getMusic(): Promise<MusicTrack[]> {
  return (await academyFetch<MusicTrack[]>('music')) ?? [];
}

/** Get reference book/repo list. */
export async function getReferences(): Promise<Reference[]> {
  return (await academyFetch<Reference[]>('references')) ?? [];
}

/** Get realm backgrounds. */
export async function getBackgrounds(): Promise<Background[]> {
  return (await academyFetch<Background[]>('backgrounds')) ?? [];
}

/** Get fauna/flora datasets. */
export async function getNatureData(): Promise<NatureDataset[]> {
  return (await academyFetch<NatureDataset[]>('nature')) ?? [];
}

/** Read a lesson file's markdown content. */
export async function readAcademyFile(filePath: string): Promise<string> {
  // In Tauri mode: read file directly via Rust command
  if (isTauri) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        // filePath is relative to academy root (e.g. "01-foundations/python/00-why-python.md")
        const fullPath = `${ACADEMY_ROOT}/${filePath}`;
        const content = await invoke('read_file', { path: fullPath }) as string;
        return content;
      }
    } catch (err) {
      console.warn('[academy] Tauri read_file failed:', err);
      return `# Unable to load content\n\nCould not read: \`${filePath}\``;
    }
  }

  // HTTP fallback
  try {
    const res = await fetch(`${API_BASE}/api/academy/lesson?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data?.content ?? '# Unable to load content';
  } catch (err) {
    console.warn('[academy] Failed to read lesson:', err);
    return `# Unable to load content\n\nCould not read: \`${filePath}\``;
  }
}

/**
 * Get a playable URL for a music track.
 * In Tauri mode: uses convertFileSrc() for asset protocol URLs.
 * In browser mode: routes through the Flask media endpoint.
 */
export function getMusicUrl(trackOrPath: MusicTrack | string): string {
  const path = typeof trackOrPath === 'string' ? trackOrPath : trackOrPath.path;

  if (isTauri) {
    // Build absolute path from the relative track path
    const fullPath = resolveMediaPath(path);
    // Use convertFileSrc if available (loaded async), otherwise fall back to asset:// directly
    if (_convertFileSrc) {
      return _convertFileSrc(fullPath);
    }
    // Tauri 2 asset protocol: encode the absolute path
    return `asset://localhost/${encodeURIComponent(fullPath)}`;
  }

  // HTTP fallback
  if (typeof trackOrPath === 'string') {
    if (path.includes('/study-music/') || path.startsWith('study-music/')) {
      const file = path.split('/').pop() ?? path;
      return `${API_BASE}/api/media/study-music/${encodeURIComponent(file)}`;
    }
    if (path.includes('/music/') || path.startsWith('realm-music/')) {
      const file = path.split('/').pop() ?? path;
      return `${API_BASE}/api/media/realm-music/${encodeURIComponent(file)}`;
    }
    const file = path.split('/').pop() ?? path;
    return `${API_BASE}/api/media/study-music/${encodeURIComponent(file)}`;
  }

  const mediaType = trackOrPath.type === 'realm-music' ? 'realm-music' : 'study-music';
  return `${API_BASE}/api/media/${mediaType}/${encodeURIComponent(trackOrPath.file)}`;
}

/**
 * Resolve a relative track path to an absolute filesystem path.
 */
function resolveMediaPath(trackPath: string): string {
  // If already absolute, return as-is
  if (trackPath.startsWith('/')) return trackPath;

  // Paths in academy-manifest.ts are relative to academy root
  // e.g. "study-music/filename.mp3"
  if (trackPath.startsWith('study-music/')) {
    return `${ACADEMY_ROOT}/${trackPath}`;
  }
  if (trackPath.startsWith('realm-music/') || trackPath.includes('/music/')) {
    return `/mnt/data/prodigy/creative-engine/LifeOS/music/${trackPath.split('/').pop()}`;
  }

  // Default: treat as relative to academy root
  return `${ACADEMY_ROOT}/${trackPath}`;
}

/**
 * Get a background image URL.
 */
export function getBackgroundUrl(bg: Background): string {
  if (isTauri) {
    const fullPath = `/mnt/data/prodigy/creative-engine/LifeOS/Backgrounds/${bg.file}`;
    if (_convertFileSrc) {
      return _convertFileSrc(fullPath);
    }
    return `asset://localhost/${encodeURIComponent(fullPath)}`;
  }
  return `${API_BASE}/api/media/backgrounds/${encodeURIComponent(bg.file)}`;
}

/**
 * Estimate reading time from markdown content.
 * ~200 words/min for technical content, extra time for code blocks.
 */
export function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
  return Math.max(1, Math.round((words / 200) + (codeBlocks * 2)));
}

// ─── Eager-load convertFileSrc in Tauri mode ────────────────
if (isTauri) {
  getConvertFileSrc().catch(() => {});
}
