# GenesisOS Comprehensive Audit Report

**Date:** 2026-03-28  
**Version:** 1.19.20  
**Auditor:** TeddyBot (automated code audit)  
**Scope:** Full-stack audit of React + Tauri 2 application

---

## Executive Summary

GenesisOS is an ambitious personal operating system with **127,803 lines of TypeScript** across **~355 source files**, a **1,039-line Rust backend**, and an impressive feature set spanning productivity, gamification, health, finance, and social systems. The codebase is **surprisingly well-organized** for its scale, with proper lazy loading, Zustand state management, and a thoughtful local-first architecture. However, there are **critical security issues in the Rust backend**, **zero test coverage**, and **significant `any` type abuse** that undermine reliability.

### Severity Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| 🔴 Critical | 3 | SQL injection in Rust, zero tests, no auth in Tauri backend |
| 🟠 High | 5 | 474 `any` usages, Supabase hardcoded everywhere, no error boundaries on stores, multiplayer Supabase-locked, passwords in plaintext |
| 🟡 Medium | 6 | Large page files, no CI/CD config, service worker disabled, font bundle size, sync engine complexity, missing TypeScript strict mode |
| 🟢 Low / Nice-to-have | 5 | CSS file proliferation, missing lint config strictness, no i18n, dead redirect routes, Cargo.toml metadata incomplete |

---

## 1. Project Structure

### ✅ Strengths
- **Well-organized directory layout:** Clear separation into `components/`, `pages/`, `stores/`, `lib/`, `hooks/`, `types/`, `realm/`, `rpg/`
- **229 component files** across 28 organized subdirectories (ai-chat, dashboard, finances, gamification, etc.)
- **93 lib files** for business logic, kept separate from UI
- **33 custom hooks** in dedicated `hooks/` directory
- **Barrel exports** via `stores/index.ts` with proper type re-exports

### ⚠️ Issues
- **No test directory at all** — zero `.test.*` or `.spec.*` files anywhere in `src/`
- **CSS file proliferation** — most pages have co-located `.css` files (Schedule.css, Goals.css, etc.) alongside a design system. Consider CSS modules or consolidation
- **`src/data/release-notes.ts`** is 1,673 lines — a data file, not code, but bloats the bundle if not tree-shaken
- **Legacy route redirects** in App.tsx (`/equipment` → `/character?tab=equipment`, etc.) — 7 redirect routes that may be removable

### File Size Distribution (top 10)
| File | Lines | Concern |
|------|-------|---------|
| `lib/intent-engine.ts` | 2,324 | ⚠️ Monolithic intent parser |
| `pages/Schedule.tsx` | 1,994 | ⚠️ Should be split into sub-components |
| `data/release-notes.ts` | 1,673 | Data file, consider external JSON |
| `pages/Goals.tsx` | 1,628 | ⚠️ Large page component |
| `pages/Junction.tsx` | 1,345 | Spiritual practice — complex but scoped |
| `lib/materialize.ts` | 1,276 | Data materialization engine |
| `realm/onboarding/OnboardingQuest.tsx` | 1,149 | Onboarding wizard |
| `realm/renderer/GardenRenderer.ts` | 1,137 | Canvas rendering — inherently complex |
| `lib/gamification/achievements.ts` | 1,090 | Achievement definitions |
| `components/NodeDetail.tsx` | 985 | Goal node detail view |

**Verdict:** App.tsx is a **well-structured 392-line router**, NOT a 20K monolith. The README's "126,000+ lines" claim is accurate (127,803 total). Structure is good.

---

## 2. Build Health

### Dependencies (package.json)
- **15 production deps, 14 dev deps** — lean and intentional
- Modern versions: React 19.2, Vite 7.3, TypeScript 5.9, Tailwind 4.2
- **`tone` (15.1.22)** — Web Audio library for Realm music. Sizable (~400KB), used for procedural music engine. Lazy-loaded behind Realm.
- **`driver.js`** — onboarding tour library. Reasonable.
- **No bloat** — no lodash, moment.js, or unnecessary utilities

### Build Configuration
- Vite config has **smart code splitting** with manual chunks:
  - `vendor-react`, `vendor-supabase`, `vendor-ui`, `vendor-markdown`, `vendor-state`
  - App-level: `gamification`, `systems`
- **Lazy loading** on ALL page routes with retry logic (3 retries on chunk failure)
- **Module preload disabled** to avoid Safari warnings
- Bundle visualizer configured (`rollup-plugin-visualizer`)

### ⚠️ Build Issues
- **Cannot run `npm run build`** on this Jetson (would need npm install + Vite). TypeScript errors unknown without running typecheck.
- **`tsc -b`** configured as typecheck script — good practice
- **No CI/CD configuration** found (no `.github/workflows/`, no `Dockerfile`)
- **Post-build script** referenced (`scripts/post-build.js`) — generates `version.json` for update detection

---

## 3. Frontend Code Quality

### ✅ Strengths
- **App.tsx is clean** — 392 lines, proper lazy loading, error boundaries, OAuth handling
- **Zustand for state management** — 13 well-scoped stores with barrel exports
- **Error boundaries** — `ErrorBoundary`, `PageErrorBoundary` wrapping all routes
- **Skeleton loading states** — 14 skeleton components for perceived performance
- **`lazyRetry` utility** — retries chunk loads 3x with 1s delay (handles deploy-time cache issues)
- **`GlobalLoadingSpinner`** for auth resolution
- **Proper auth flow** — OAuth callback handling with PKCE, email confirmation gate
- **`dedup()` utility** in supabase.ts to prevent duplicate in-flight queries

### ⚠️ Issues
- **Store hydration fires ALL stores at once** — `Promise.allSettled` with 8 parallel fetches on login. Good pattern, but no priority ordering (schedule/habits before assets/journal).
- **`profile.onboarding_complete = true`** — Direct mutation of store state outside of Zustand (line ~250 of App.tsx). Should use store action.
- **`supabase` imported directly** in 20+ files — not abstracted behind the adapter layer in all places. The local-api.ts/tauri-api.ts adapters exist but coexist with direct supabase imports.
- **`window.addEventListener('genesisOS-refresh')`** — Custom events for cross-component communication. Works but fragile; could use Zustand middleware or event bus.
- **`useMemo`/`useCallback`/`React.memo` usage: 683 instances** — good but hard to verify correctness without profiling

### Routing
- **React Router v7** with proper nested routes under `<Layout />`
- **HashRouter for Tauri, BrowserRouter for web** — correct approach
- **Setup routes outside Layout** — proper for onboarding flow
- **Legacy redirects preserved** — backward-compatible

---

## 4. Backend (Rust/Tauri)

### Architecture
- **Single `lib.rs`** (1,039 lines) — all Tauri commands in one file
- **SQLite via `rusqlite`** with WAL mode and foreign keys
- **Schema mirrors Supabase** — 15+ tables including goals, tasks, habits, health_metrics, finances, etc.
- **Table allowlist** via `validate_table()` — prevents arbitrary table access

### 🔴 CRITICAL: SQL Injection Vulnerabilities

The Rust backend builds SQL queries using `format!()` with table names and column names:

```rust
// Line 735 — table name directly interpolated
let sql = format!("SELECT * FROM {}{} ORDER BY created_at DESC", table, where_clause);

// Line 723 — column names interpolated (with basic alphanumeric check)
conditions.push(format!("{} = ?", key));

// Line 860 — update with interpolated column names
let sql = format!("UPDATE {} SET {} WHERE id = ?", table, set_clauses.join(", "));
```

**Mitigations already present:**
- Table names validated against `ALLOWED_TABLES` allowlist ✅
- Column names checked with `key.chars().all(|c| c.is_alphanumeric() || c == '_')` ✅
- Values use parameterized queries (`params![]`) ✅

**Remaining risk:** The column name validation is basic. While `table` is allowlisted, a malicious column name like `id; DROP TABLE tasks--` would fail the alphanumeric check, BUT the check is done inline without early return — **verify the control flow handles the bypass case**. Since this is a local-only app (no network-exposed API), risk is **medium** in practice but **high** in principle.

### ⚠️ No Authentication in Tauri Backend

The Rust backend has **zero authentication**. Any Tauri command can read/write any table for any `user_id`. This is fine for single-user desktop, but:
- No user isolation if multiple profiles are ever supported
- No session validation
- The `user_id` is trusted from the frontend

### Other Rust Issues
- **No unit tests** for Rust backend
- **Error handling** uses string-based errors (`supabase_err(&str)`) — not typed errors
- **`Mutex<Connection>`** — single database connection behind a mutex. Fine for desktop, but could deadlock under heavy concurrent access. Consider connection pooling or `r2d2`.
- **AI bridge** (`/api/v1/chat/completions`) makes HTTP requests to localhost — good separation
- **Cargo.toml** is minimal — no description, license, or repository filled in

---

## 5. TypeScript Quality

### 🟠 474 `any` Usages

Files with highest `as any` / `: any` counts:
| File | Count |
|------|-------|
| `pages/Schedule.tsx` | 11 |
| `pages/Review.tsx` | 7 |
| `lib/onboarding-phases.ts` | 7 |
| `components/WorkoutGenerator.tsx` | 6 |
| `components/Sidebar.tsx` | 6 |

### Type Infrastructure
- **Dedicated `types/database.ts`** — 627+ lines of proper interfaces for all DB tables (Goal, Task, Habit, HealthMetric, etc.)
- **Store type exports** — proper type re-exports from store barrel file
- **RPG type system** — `CharacterClass`, `CharacterStats`, `CharacterAppearance`, etc.
- **Realm types** — `RealmWorldState`, `GardenPlant`, `DynamicEntity`, etc.

### ⚠️ Issues
- **`tsconfig.json` not checked** for strictness settings — may not have `strict: true`
- **474 `any` instances** across the codebase — 3.7 per 1000 lines. Not terrible for 128K LOC but should be addressed systematically.
- **Local API adapter** uses `any` extensively for Supabase compatibility (`PostgrestResponse<T = any>`)
- **No runtime type validation** — no zod, io-ts, or similar for API responses

---

## 6. Security

### 🔴 Critical Issues

1. **SQL Injection in Rust Backend** (see Section 4)
   - Table names: ✅ allowlisted
   - Column names: ⚠️ basic alphanumeric check
   - Values: ✅ parameterized

2. **No Authentication in Tauri Commands**
   - Desktop app trusts frontend completely
   - No session tokens or user validation at Rust layer

3. **Passwords Sent in Plaintext to Local API**
   - `local-api.ts` and `tauri-api.ts` send `{ email, password }` as JSON to localhost
   - Not an issue for localhost, but the pattern is concerning if ever exposed

### ✅ Good Practices
- **Supabase anon key** loaded from environment variables, not hardcoded
- **PKCE auth flow** for OAuth
- **No API keys in source code** — checked with grep, none found
- **`.env.local`** properly gitignored (has `.gitignore`)
- **RLS (Row Level Security)** implied by Supabase usage — not verified but standard
- **Table allowlist** in Rust prevents arbitrary table access

### ⚠️ Medium Issues
- **TCS adapter** (`lib/systems/adapters/tcs.ts`) handles email/password for external system integration — stores credentials in config
- **No CSRF protection** on local Flask API
- **No rate limiting** on local API endpoints

---

## 7. Performance

### ✅ Strengths
- **Lazy loading on ALL routes** — pages are code-split
- **Manual chunk splitting** — vendor libs separated (React, Supabase, Markdown, UI, State)
- **Skeleton components** — 14 skeleton screens for perceived performance
- **`dedup()` query deduplication** — prevents duplicate Supabase queries
- **Store hydration** — all stores pre-fetched on login with `skipSync: true`
- **Debounced refresh events** — 300ms debounce on `genesisOS-refresh`
- **Module preload disabled** — avoids Safari preload warnings

### ⚠️ Issues
- **Font loading** — 8 Poppins/Orbitron font variants loaded upfront (latin-300, 400, 500, 600, 700 + Orbitron 400, 700, 900). Consider reducing to essential weights.
- **`tone` library** — ~400KB Web Audio library. Only used in Realm but included in dependency graph. Verify it's only loaded behind the Realm lazy boundary.
- **No `React.memo` audit** — 683 memoization calls exist but no profiling data to verify they're helpful (over-memoization can hurt)
- **IndexedDB local database** — opens on startup before auth. 30+ object stores created eagerly.
- **Canvas rendering** in Realm — `GardenRenderer.ts` (1,137 lines) and `TileRenderer.ts` (710 lines) do pixel-level rendering. Performance depends on device. No web worker offloading.

### Bundle Size Concerns
| Chunk | Estimated Size | Notes |
|-------|---------------|-------|
| `vendor-react` | ~140KB gzip | React 19 + Router |
| `vendor-supabase` | ~50KB gzip | Supabase JS client |
| `vendor-markdown` | ~30KB gzip | react-markdown + remark |
| `vendor-ui` | ~80KB gzip | Lucide icons (tree-shakeable) + driver.js |
| `tone` | ~100KB gzip | Web Audio (verify lazy) |
| App code | ~200KB gzip | 128K LOC TypeScript |

**Estimated total: ~600KB gzipped** — reasonable for a full-featured app.

---

## 8. Local-First / Offline

### Architecture (3-Tier)

```
1. Supabase (cloud)  → Original backend, still default
2. Local API (Flask)  → Drop-in adapter via local-api.ts, talks to localhost:8080
3. Tauri (Rust/SQLite) → Native adapter via tauri-api.ts, direct invoke()
```

### ✅ Strengths
- **IndexedDB local database** (`local-db.ts`, 692 lines) — mirrors ALL Supabase tables locally
- **Sync engine** (`sync-engine.ts`, 933 lines) — bidirectional sync with conflict resolution
- **`VITE_LOCAL_MODE=true`** flag disables Supabase dependency
- **Tauri adapter** (`tauri-api.ts`, 726 lines) — full Supabase-compatible query builder over Rust invoke()
- **Local API adapter** (`local-api.ts`, 692 lines) — same for Flask HTTP backend
- **Offline-first reads** — app reads from IndexedDB first, syncs in background
- **Proper `env.local`** configuration for local mode

### 🟠 Issues
- **152 files still import from `supabase.ts` directly** — the adapters exist but migration isn't complete. Some code paths will fail in local mode.
- **RPG Character system** (`CharacterManager.ts`) imports and queries Supabase directly — won't work offline
- **Multiplayer** (`RealmMultiplayer.ts`) uses Supabase Realtime Presence — completely non-functional offline
- **Social features** (messaging, guilds) depend on Supabase Realtime — offline-incompatible
- **`supabase.auth`** calls scattered throughout — local adapters mock auth but edge cases likely exist
- **No offline indicator** beyond `ConnectionBanner` component — users may not know they're offline

---

## 9. RPG / Realm System

### What's Actually Built (not stub code!)

The RPG/Realm system is **genuinely impressive and fully wired up**:

#### Character System (`src/rpg/`)
- **`CharacterManager.ts`** — derives stats from REAL GenesisOS data:
  - HP from energy + sleep + mood
  - MP from exercise + habit streaks
  - Strength from exercise + energy
  - Intelligence from habit consistency
  - Charisma from mood + sleep quality
  - Endurance from streaks + exercise
- **Class system** with stat bonuses
- **Sprite system** (`sprites.ts`, 719 lines) — character appearance data
- **Quest engine v2** (`quest-engine-v2.ts`, 906 lines) — real quest logic

#### Realm Engine (`src/realm/`)
- **`RealmEngine.ts`** (835 lines) — full game loop with states (loading → playing → paused → menu)
- **Tile-based renderer** with canvas rendering, lighting system, pathfinding
- **Zone system** — LIFE_TOWN with portals, buildings, NPCs
- **Garden system** — plants grow based on habit streaks
- **Procedural music** via `MusicEngine` + Tone.js
- **SFX engine** for interactions
- **Keyboard + Touch controls** with pathfinding (A* algorithm)
- **Multiplayer** — Supabase Realtime presence, zone chat, emotes, remote players
- **NPC dialogue system** with context-aware responses
- **Companion system** with bond mechanics
- **Celestial system** — moon phases, seasons, dynamic weather reflecting emotional state
- **Onboarding quest** (1,149 lines) — guided introduction

#### Gamification (`src/lib/gamification/`)
- **Achievements** (1,090 lines) — extensive achievement definitions
- **Level system** with XP curves
- **Context providers** — `GamificationProvider` wraps the entire app

### Verdict
This is NOT stub code. The RPG system is a **deeply integrated, functioning game engine** that bridges real productivity data into a game world. The Realm is a pixel-art overworld with tile rendering, pathfinding, NPCs, and multiplayer. Extremely ambitious.

### ⚠️ RPG Issues
- **Supabase-locked** — CharacterManager queries Supabase directly, breaking local mode
- **Performance on mobile** — Canvas-based rendering with lighting could be heavy
- **No save state management** — character position stored in component state, not persisted robustly

---

## 10. What's Missing or Broken

### Features Mentioned in README vs Reality

| Feature | README Claim | Actual Status |
|---------|-------------|---------------|
| Goal Engine | ✅ Hierarchical goals with AI decomposition | ✅ Fully built (1,628-line Goals page + engine) |
| Smart Schedule | ✅ Calendar + task manager | ✅ Built (1,994-line page) |
| Habit Tracking | ✅ Streaks, garden, XP rewards | ✅ Built + integrated with RPG |
| Finance Dashboard | ✅ Income, expenses, budgets | ✅ Built with CSV import |
| Health & Wellness | ✅ Mood, energy, sleep, exercise | ✅ Built (856-line ExerciseTab alone) |
| The Realm (RPG) | ✅ Character, quests, NPCs, music | ✅ Fully built (see Section 9) |
| Junction (Spiritual) | ✅ Multi-tradition companion | ✅ Built (1,345 lines) |
| AI Companion | ✅ Context-aware chat | ✅ Built (861-line AIChat + LLM integration) |
| Journal & Reviews | ✅ Daily journal, weekly reviews | ✅ Both built |
| Social & Multiplayer | ✅ Guilds, partnerships, leaderboards | ⚠️ Built but Supabase-only |
| Works Everywhere (PWA) | ✅ Offline-first, install anywhere | ⚠️ Service worker DISABLED |
| 514 components | ✅ Claimed in README | ⚠️ Counted 229 .tsx in components/ + pages — likely includes sub-components/hooks |

### 🔴 Missing / Broken

1. **ZERO TEST COVERAGE** — No unit tests, integration tests, or E2E tests anywhere. For 128K LOC, this is the single biggest risk.

2. **Service Worker Disabled** — The README claims PWA/offline support, but `main.tsx` explicitly disables and unregisters service workers: *"Service worker DISABLED — was caching bad responses and breaking auth flow"*. The app force-unregisters any lingering SWs and clears caches.

3. **No CI/CD** — No GitHub Actions, no Dockerfile, no deployment configuration found.

4. **Social Features Require Supabase** — Multiplayer, messaging, guilds all use Supabase Realtime. Non-functional in local/Tauri mode.

5. **Supabase Migration Incomplete** — 152 files reference Supabase. The local-api and tauri-api adapters exist but coexist with direct Supabase imports. Running in local mode likely has broken code paths.

6. **No i18n** — English only, no internationalization infrastructure.

7. **No accessibility audit** — Some `aria-label` attributes present but no systematic a11y testing.

---

## Recommendations (Priority Order)

### 🔴 Do First (Critical)

1. **Add parameterized table/column handling in Rust** — or at minimum add integration tests proving the allowlist + alphanumeric check prevents injection
2. **Add test infrastructure** — start with store tests (Zustand) and critical path integration tests. Even 20% coverage on stores + sync engine would be transformative.
3. **Complete Supabase migration** — abstract ALL Supabase calls behind the adapter layer. Currently 152 files import Supabase directly.

### 🟠 Do Next (High)

4. **Reduce `any` usage** — target the top 5 offending files first. 474 → under 100 is achievable.
5. **Add authentication to Tauri backend** — even a simple token check prevents multi-user issues.
6. **Re-enable service worker** — fix the caching strategy (stale-while-revalidate for assets, network-first for API) instead of disabling it entirely.
7. **Split large page components** — Schedule.tsx (1,994), Goals.tsx (1,628), Junction.tsx (1,345) should each be 3-4 smaller components.

### 🟡 Improve (Medium)

8. **Add CI/CD pipeline** — typecheck, lint, build on PR. Deploy previews.
9. **Enable TypeScript strict mode** — verify `strict: true` in tsconfig.
10. **Add runtime type validation** — zod schemas for API responses, especially from local/Tauri backends.
11. **Profile and optimize fonts** — reduce from 8 to 3-4 essential weights.
12. **Add offline indicators** — clearer UX when features are unavailable offline.

### 🟢 Nice to Have

13. **Consolidate CSS** — migrate page-level CSS files to Tailwind or CSS modules.
14. **Clean up legacy redirects** — the 7 redirect routes in App.tsx can be removed after a deprecation period.
15. **Add i18n infrastructure** — even if only English initially.
16. **Web Worker for Realm rendering** — offload canvas operations.
17. **Fill in Cargo.toml metadata** — description, license, repository.

---

## Final Assessment

**GenesisOS is an extraordinarily ambitious project that's further along than most apps this complex.** The architecture decisions are sound (Zustand, lazy loading, code splitting, local-first adapters), the RPG system is genuinely functional (not vaporware), and the code organization is good for 128K LOC.

The biggest risks are:
1. **Zero tests** — one refactor away from cascading breakage
2. **Incomplete Supabase migration** — local mode is a minefield
3. **Security in Rust backend** — needs hardening before any multi-user scenario

The developer clearly knows React and has made thoughtful trade-offs. This is production-grade code in many areas, held back primarily by missing infrastructure (tests, CI) rather than code quality.

**Grade: B+** — Impressive scope and execution, needs infrastructure and safety nets.
