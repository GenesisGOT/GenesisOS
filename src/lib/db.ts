/**
 * db.ts — Unified database entry point for LifeOS
 * 
 * Auto-detects the best available backend:
 *   1. Tauri (native invoke → Rust → SQLite) — when running as desktop app
 *   2. Flask HTTP (localhost:8080/api) — when running in dev browser
 * 
 * All app code should import from here:
 *   import { supabase, dedup } from '@/lib/db';
 * 
 * Created: 2026-03-27
 */

export { supabase, dedup, runtime, default } from './tauri-api';
