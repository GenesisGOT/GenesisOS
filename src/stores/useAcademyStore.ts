/**
 * Academy Store — Zustand
 *
 * Manages study progress, music playback, and session tracking.
 */

import { create } from 'zustand';
import { MUSIC_TRACKS, PHASES, type Track, type MusicCategory } from '../data/academy-manifest';

// ── Types ──

interface StudySession {
  startTime: number;
  lessonId: string | null;
}

interface AcademyState {
  // Progress
  completedLessons: string[];
  currentLesson: string | null;
  studyStreak: number;
  lastStudyDate: string | null;
  totalStudyTime: number; // minutes
  
  // Music
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  playlist: Track[];
  volume: number;
  shuffle: boolean;
  repeat: boolean;
  categoryFilter: MusicCategory | 'All';
  trackProgress: number; // 0-1
  
  // Active study session
  activeSession: StudySession | null;
  
  // Cheatsheet
  activeCheatsheet: string | null;
}

interface AcademyActions {
  // Progress
  markLessonComplete: (lessonId: string) => void;
  markLessonIncomplete: (lessonId: string) => void;
  setCurrentLesson: (lessonId: string | null) => void;
  
  // Study sessions
  startStudySession: (lessonId: string | null) => void;
  endStudySession: () => void;
  
  // Music
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCategoryFilter: (category: MusicCategory | 'All') => void;
  setTrackProgress: (progress: number) => void;
  
  // Cheatsheet
  setActiveCheatsheet: (id: string | null) => void;
  
  // Hydrate from localStorage
  hydrate: () => void;
}

// ── Storage keys ──
const STORAGE_KEYS = {
  completedLessons: 'academy-completed-lessons',
  studyStreak: 'academy-study-streak',
  lastStudyDate: 'academy-last-study-date',
  totalStudyTime: 'academy-total-study-time',
  volume: 'academy-volume',
  shuffle: 'academy-shuffle',
  lastTrackIndex: 'academy-last-track',
  lastTrackProgress: 'academy-last-track-progress',
} as const;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded etc */ }
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcStreak(lastDate: string | null, currentStreak: number): number {
  if (!lastDate) return 1;
  const today = getTodayStr();
  if (lastDate === today) return currentStreak;
  
  const last = new Date(lastDate);
  const now = new Date(today);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return currentStreak + 1;
  if (diffDays === 0) return currentStreak;
  return 1; // streak broken
}

export const useAcademyStore = create<AcademyState & AcademyActions>((set, get) => ({
  // Initial state
  completedLessons: [],
  currentLesson: null,
  studyStreak: 0,
  lastStudyDate: null,
  totalStudyTime: 0,
  currentTrack: null,
  currentTrackIndex: -1,
  isPlaying: false,
  playlist: MUSIC_TRACKS,
  volume: 0.7,
  shuffle: false,
  repeat: false,
  categoryFilter: 'All',
  trackProgress: 0,
  activeSession: null,
  activeCheatsheet: null,

  hydrate: () => {
    const completedLessons = loadJSON<string[]>(STORAGE_KEYS.completedLessons, []);
    const studyStreak = loadJSON<number>(STORAGE_KEYS.studyStreak, 0);
    const lastStudyDate = loadJSON<string | null>(STORAGE_KEYS.lastStudyDate, null);
    const totalStudyTime = loadJSON<number>(STORAGE_KEYS.totalStudyTime, 0);
    const volume = loadJSON<number>(STORAGE_KEYS.volume, 0.7);
    const shuffle = loadJSON<boolean>(STORAGE_KEYS.shuffle, false);
    
    set({
      completedLessons,
      studyStreak: calcStreak(lastStudyDate, studyStreak),
      lastStudyDate,
      totalStudyTime,
      volume,
      shuffle,
    });
  },

  markLessonComplete: (lessonId: string) => {
    const { completedLessons, lastStudyDate, studyStreak } = get();
    if (completedLessons.includes(lessonId)) return;
    
    const updated = [...completedLessons, lessonId];
    const today = getTodayStr();
    const newStreak = calcStreak(lastStudyDate, studyStreak);
    
    saveJSON(STORAGE_KEYS.completedLessons, updated);
    saveJSON(STORAGE_KEYS.studyStreak, newStreak);
    saveJSON(STORAGE_KEYS.lastStudyDate, today);
    
    set({
      completedLessons: updated,
      studyStreak: newStreak,
      lastStudyDate: today,
    });
  },

  markLessonIncomplete: (lessonId: string) => {
    const { completedLessons } = get();
    const updated = completedLessons.filter(id => id !== lessonId);
    saveJSON(STORAGE_KEYS.completedLessons, updated);
    set({ completedLessons: updated });
  },

  setCurrentLesson: (lessonId: string | null) => {
    set({ currentLesson: lessonId });
  },

  startStudySession: (lessonId: string | null) => {
    set({
      activeSession: { startTime: Date.now(), lessonId },
    });
  },

  endStudySession: () => {
    const { activeSession, totalStudyTime } = get();
    if (!activeSession) return;
    
    const elapsed = Math.round((Date.now() - activeSession.startTime) / 60000);
    const newTotal = totalStudyTime + Math.max(elapsed, 1);
    
    saveJSON(STORAGE_KEYS.totalStudyTime, newTotal);
    set({ activeSession: null, totalStudyTime: newTotal });
  },

  playTrack: (track: Track) => {
    const { playlist } = get();
    const index = playlist.findIndex(t => t.path === track.path);
    saveJSON(STORAGE_KEYS.lastTrackIndex, index);
    set({ currentTrack: track, currentTrackIndex: index, isPlaying: true, trackProgress: 0 });
  },

  togglePlay: () => {
    set(s => ({ isPlaying: !s.isPlaying }));
  },

  nextTrack: () => {
    const { playlist, currentTrackIndex, shuffle, repeat } = get();
    if (playlist.length === 0) return;
    
    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * playlist.length);
    } else if (currentTrackIndex >= playlist.length - 1) {
      nextIdx = repeat ? 0 : currentTrackIndex;
      if (!repeat) { set({ isPlaying: false }); return; }
    } else {
      nextIdx = currentTrackIndex + 1;
    }
    
    saveJSON(STORAGE_KEYS.lastTrackIndex, nextIdx);
    set({ currentTrack: playlist[nextIdx], currentTrackIndex: nextIdx, trackProgress: 0 });
  },

  prevTrack: () => {
    const { playlist, currentTrackIndex, shuffle } = get();
    if (playlist.length === 0) return;
    
    let prevIdx: number;
    if (shuffle) {
      prevIdx = Math.floor(Math.random() * playlist.length);
    } else {
      prevIdx = currentTrackIndex <= 0 ? playlist.length - 1 : currentTrackIndex - 1;
    }
    
    saveJSON(STORAGE_KEYS.lastTrackIndex, prevIdx);
    set({ currentTrack: playlist[prevIdx], currentTrackIndex: prevIdx, trackProgress: 0 });
  },

  setVolume: (volume: number) => {
    saveJSON(STORAGE_KEYS.volume, volume);
    set({ volume });
  },

  toggleShuffle: () => {
    const newVal = !get().shuffle;
    saveJSON(STORAGE_KEYS.shuffle, newVal);
    set({ shuffle: newVal });
  },

  toggleRepeat: () => {
    set(s => ({ repeat: !s.repeat }));
  },

  setCategoryFilter: (category: MusicCategory | 'All') => {
    const filtered = category === 'All' ? MUSIC_TRACKS : MUSIC_TRACKS.filter(t => t.category === category);
    set({ categoryFilter: category, playlist: filtered });
  },

  setTrackProgress: (progress: number) => {
    set({ trackProgress: progress });
  },

  setActiveCheatsheet: (id: string | null) => {
    set({ activeCheatsheet: id });
  },
}));

// ── Selectors ──

export function getPhaseProgress(phaseId: string, completedLessons: string[]): { done: number; total: number; percent: number } {
  const phase = PHASES.find(p => p.id === phaseId);
  if (!phase) return { done: 0, total: 0, percent: 0 };
  
  const phaseLessons = phase.topics.flatMap(t => t.lessons.map(l => l.id));
  const done = phaseLessons.filter(id => completedLessons.includes(id)).length;
  const total = phaseLessons.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}
