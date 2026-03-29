# LifeOS Local Mode

> Run LifeOS entirely offline with a local Flask API instead of Supabase.

## Overview

LifeOS was built on Supabase (PostgreSQL + Auth + Realtime). This adapter layer replaces Supabase with a local Flask API, enabling fully offline operation.

**152 files** reference Supabase across the codebase. The migration uses a drop-in adapter that mimics Supabase's chainable query interface.

## Architecture

```
Before:  React App → Supabase JS Client → Supabase Cloud (PostgreSQL)
After:   React App → Local API Adapter  → Flask API (localhost:8080) → SQLite/PostgreSQL
```

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/local-api.ts` | Drop-in replacement for `src/lib/supabase.ts` |
| `scripts/localize.sh` | Find-and-replace script (reversible with `.bak` files) |
| `.env.local` | Environment config for local mode |
| `LOCAL_MODE.md` | This documentation |

## How the Adapter Works

### Query Builder (chainable, Supabase-compatible)

The adapter mimics Supabase's PostgREST query builder. All chains are **lazy** — they only fire when `await`ed:

```typescript
// These work identically to Supabase:
const { data, error } = await supabase.from('tasks').select('*').eq('status', 'active');
const { data, error } = await supabase.from('tasks').insert({ title: 'New' }).select().single();
const { data, error } = await supabase.from('tasks').update({ done: true }).eq('id', '123');
const { data, error } = await supabase.from('tasks').delete().eq('id', '123');
const { data, error } = await supabase.from('tasks').upsert(data, { onConflict: 'id' });
const { data, error } = await supabase.rpc('get_table_columns', { table_names: ['tasks'] });
```

### Supported filter methods

`.eq()` `.neq()` `.gt()` `.gte()` `.lt()` `.lte()` `.like()` `.ilike()` `.is()` `.in()` `.contains()` `.or()` `.filter()`

### Supported modifiers

`.order()` `.limit()` `.range()` `.single()` `.maybeSingle()` `.select('columns')`

### Auth (simplified local auth)

```typescript
await supabase.auth.signUp({ email, password });
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();
await supabase.auth.getUser();
await supabase.auth.getSession();
supabase.auth.onAuthStateChange((event, session) => { ... });
```

OAuth providers are **not supported** in local mode — returns a helpful error.

### Response format

All responses match Supabase's shape:
```typescript
{ data: T | null, error: { message, details, hint, code } | null, status: number }
```

## Migration Steps

### Step 1: Set up environment
```bash
cp .env.local .env  # or merge into existing .env
```

### Step 2: Dry run the migration script
```bash
bash scripts/localize.sh
# Shows what would change without modifying files
```

### Step 3: Apply the migration
```bash
bash scripts/localize.sh --apply
# Creates .bak backups and replaces imports
```

### Step 4: Manual fixes required

These files need manual attention:

#### `src/lib/systems/adapters/tcs.ts`
Has its own `createClient()` for a separate Supabase instance (TCS business data). Options:
- Create a second Flask API endpoint for TCS
- Merge TCS tables into the main local API
- Keep TCS on Supabase while main app runs locally

#### `src/stores/useUserStore.ts`
Contains Supabase-specific auth key parsing (`sb-${ref}-auth-token`). The local adapter uses `local_auth_session` in localStorage instead. The auth state listener pattern is preserved.

#### `src/lib/feature-gates.ts` and `src/lib/local-db.ts`
Reference `VITE_SUPABASE_URL` to extract a project ref. The `.env.local` provides a dummy value to prevent crashes.

### Step 5: Revert if needed
```bash
bash scripts/localize.sh --revert
# Restores all .bak files to their originals
```

## Flask API Requirements

The local Flask API at `localhost:8080` must implement these endpoints:

### Data endpoints (per table)
```
GET    /api/{table}?select=...&column=op.value&order=...&limit=...
POST   /api/{table}                  → Insert row(s)
PATCH  /api/{table}?column=eq.value  → Update matching rows
PUT    /api/{table}?on_conflict=col  → Upsert
DELETE /api/{table}?column=eq.value  → Delete matching rows
```

### Query parameter format (PostgREST-style)
```
?select=id,title,status          → Column selection
?status=eq.active                → Filter: column = value
?created_at=gte.2024-01-01      → Filter: column >= value
?id=in.(1,2,3)                  → Filter: column IN (values)
?order=created_at.desc          → Ordering
?limit=10&offset=20             → Pagination
?single=true                    → Return single object (not array)
```

### RPC endpoints
```
POST /api/rpc/{function_name}    → body: { param1: val1, ... }
```

### Auth endpoints
```
POST /api/auth/signup             → { email, password }
POST /api/auth/login              → { email, password }
POST /api/auth/logout             → (with Authorization header)
POST /api/auth/refresh            → { refresh_token }
GET  /api/auth/user               → (with Authorization header)
POST /api/auth/reset-password     → { email }
```

### Tables used by LifeOS

Based on codebase analysis, the Flask API needs these tables:

| Table | Used by |
|-------|---------|
| `tasks` | Goals, Tasks, Schedule |
| `habits` | Habits tracking |
| `habit_logs` | Habit completion logs |
| `goals` | Goal tracking |
| `health_metrics` | Health/wellness data |
| `schedule_events` | Calendar/schedule |
| `event_completions` | Event completion tracking |
| `journal_entries` | Journal |
| `income` | Finance - income |
| `expenses` | Finance - expenses |
| `transactions` | Finance - transactions |
| `unified_events` | Cross-feature event log |
| `user_profiles` | User preferences/settings |
| `ai_insights` | AI-generated insights |
| `rpg_characters` | RPG/gamification |
| `ui_preferences` | UI state persistence |

## What's NOT Migrated

1. **Realtime subscriptions** — Supabase's realtime websocket channels. The local API uses polling instead.
2. **Row-Level Security (RLS)** — The Flask API should implement its own auth middleware.
3. **Storage (file uploads)** — If used, needs a separate local file storage solution.
4. **Edge Functions** — Any Supabase Edge Functions need Flask route equivalents.

## Development Notes

- The adapter auto-attaches `Authorization: Bearer <token>` from localStorage
- The `dedup()` helper is preserved for request deduplication
- The `.env.local` includes dummy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to prevent the original `supabase.ts` from throwing during migration
- All query chains implement `PromiseLike` (thenable) so they work with `await`
