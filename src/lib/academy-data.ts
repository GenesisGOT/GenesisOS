/**
 * Academy Data Access Layer
 * 
 * Fetches curriculum, music, references, and nature data from the local Flask API.
 * Falls back to Tauri filesystem access when available.
 * 
 * API endpoints (Flask backend at localhost:8080):
 *   GET /api/academy/overview    — full overview with all data
 *   GET /api/academy/curriculum  — curriculum phases & subjects
 *   GET /api/academy/music       — study + realm music tracks
 *   GET /api/academy/references  — reference book repos
 *   GET /api/academy/backgrounds — realm background images
 *   GET /api/academy/nature      — fauna/flora datasets
 *   GET /api/academy/lesson?path=... — read a lesson file
 *   GET /api/media/<type>/<file> — serve media files
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
 * Accepts either a MusicTrack object or a relative path string.
 * Routes through the Flask media endpoint.
 */
export function getMusicUrl(trackOrPath: MusicTrack | string): string {
  if (typeof trackOrPath === 'string') {
    // Legacy path mode: "study-music/filename.mp3" or full path
    const path = trackOrPath;
    if (path.includes('/study-music/') || path.startsWith('study-music/')) {
      const file = path.split('/').pop() ?? path;
      return `${API_BASE}/api/media/study-music/${encodeURIComponent(file)}`;
    }
    if (path.includes('/music/') || path.startsWith('realm-music/')) {
      const file = path.split('/').pop() ?? path;
      return `${API_BASE}/api/media/realm-music/${encodeURIComponent(file)}`;
    }
    // Default to study music
    const file = path.split('/').pop() ?? path;
    return `${API_BASE}/api/media/study-music/${encodeURIComponent(file)}`;
  }
  // MusicTrack object mode
  const mediaType = trackOrPath.type === 'realm-music' ? 'realm-music' : 'study-music';
  return `${API_BASE}/api/media/${mediaType}/${encodeURIComponent(trackOrPath.file)}`;
}

/**
 * Get a background image URL.
 */
export function getBackgroundUrl(bg: Background): string {
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
