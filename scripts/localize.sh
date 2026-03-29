#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
# localize.sh — Switch LifeOS from Supabase to Local API adapter
#
# What it does:
#   1. Backs up every file that will be modified (.bak)
#   2. Replaces `import { supabase } from '...supabase'` → local-api
#   3. Replaces `import { supabase, dedup } from '...supabase'` → local-api
#   4. Replaces `import type { SupabaseClient }` → local adapter type
#   5. Logs every change to scripts/localize.log
#
# Usage:
#   cd /mnt/data/tmp/lifeos
#   bash scripts/localize.sh          # dry-run (default)
#   bash scripts/localize.sh --apply  # actually modify files
#
# To revert:
#   bash scripts/localize.sh --revert
#
# Created: 2026-03-27
# ══════════════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$PROJECT_ROOT/src"
LOG_FILE="$PROJECT_ROOT/scripts/localize.log"
MODE="${1:-}"  # --apply | --revert | (empty = dry-run)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════"
echo " LifeOS → Local API Migration Script"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Project root: $PROJECT_ROOT"
echo "Mode: ${MODE:-dry-run}"
echo ""

# ─── Revert mode ──────────────────────────────────────────────────────
if [[ "$MODE" == "--revert" ]]; then
    echo -e "${YELLOW}Reverting all .bak files...${NC}"
    count=0
    find "$SRC_DIR" -name "*.bak" | while read bakfile; do
        original="${bakfile%.bak}"
        cp "$bakfile" "$original"
        rm "$bakfile"
        echo "  Restored: ${original#$PROJECT_ROOT/}"
        count=$((count + 1))
    done
    echo -e "${GREEN}Revert complete.${NC}"
    exit 0
fi

# ─── Find all files that import from supabase ────────────────────────
# Skip the supabase.ts file itself and the local-api.ts we created
mapfile -t FILES < <(
    grep -rl "from.*['\"].*supabase['\"]" "$SRC_DIR" \
        --include="*.ts" --include="*.tsx" \
    | grep -v 'supabase\.ts$' \
    | grep -v 'local-api\.ts$' \
    | grep -v 'tauri-api\.ts$' \
    | grep -v 'db\.ts$' \
    | grep -v 'ai-local\.ts$' \
    | grep -v 'node_modules' \
    | sort
)

echo "Found ${#FILES[@]} files with Supabase imports"
echo ""

# ─── Define replacement patterns ─────────────────────────────────────
# We need to handle several import patterns:

declare -A PATTERNS
# Pattern 1: import { supabase } from '../lib/supabase'  (various depths)
# Pattern 2: import { supabase, dedup } from '../lib/supabase'
# Pattern 3: import { supabase } from '../../lib/supabase'
# Pattern 4: import type { SupabaseClient } from '@supabase/supabase-js'
# Pattern 5: import { createClient } from '@supabase/supabase-js'
# Pattern 6: const { supabase } = await import('./supabase')  (dynamic)

> "$LOG_FILE"
echo "# Localize.sh migration log — $(date -Iseconds)" >> "$LOG_FILE"
echo "# Mode: ${MODE:-dry-run}" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

changed=0
skipped=0

for file in "${FILES[@]}"; do
    relpath="${file#$PROJECT_ROOT/}"
    
    # Check what kind of imports this file has
    has_supabase_import=false
    has_type_import=false
    has_createclient=false
    has_dynamic_import=false

    grep -q "import.*{.*supabase.*}.*from.*['\"].*supabase['\"]" "$file" && has_supabase_import=true
    grep -q "import type.*{.*SupabaseClient.*}" "$file" && has_type_import=true
    grep -q "import.*{.*createClient.*}.*from.*'@supabase/supabase-js'" "$file" && has_createclient=true
    grep -q "await import.*supabase" "$file" && has_dynamic_import=true

    if ! $has_supabase_import && ! $has_type_import && ! $has_createclient && ! $has_dynamic_import; then
        echo "  SKIP (no matching pattern): $relpath" | tee -a "$LOG_FILE"
        skipped=$((skipped + 1))
        continue
    fi

    echo -e "${GREEN}  MATCH: $relpath${NC}"
    
    if [[ "$MODE" == "--apply" ]]; then
        # Back up original
        cp "$file" "${file}.bak"
        
        if $has_supabase_import; then
            # Calculate relative path from this file to src/lib/local-api
            file_dir="$(dirname "$file")"
            rel_to_lib="$(python3 -c "import os.path; print(os.path.relpath('$SRC_DIR/lib', '$file_dir'))")"
            new_import="$rel_to_lib/db"
            
            # Replace: import { supabase } from '../lib/supabase'
            # With:    import { supabase } from '../lib/db'
            sed -i -E "s|from ['\"](\.\./)*lib/supabase['\"]|from '${new_import}'|g" "$file"
            # Also handle: from './supabase' (within lib/ itself)
            sed -i -E "s|from ['\"]\.\/supabase['\"]|from './db'|g" "$file"
            # Also handle existing local-api imports → point to db
            sed -i -E "s|from ['\"](\.\./)*lib/local-api['\"]|from '${new_import}'|g" "$file"
            sed -i -E "s|from ['\"]\.\/local-api['\"]|from './db'|g" "$file"
            echo "    → Replaced supabase/local-api import with db" | tee -a "$LOG_FILE"
        fi
        
        if $has_type_import; then
            # Replace: import type { SupabaseClient } from '@supabase/supabase-js'
            # With a local type alias (the local-api doesn't use SupabaseClient type)
            # We'll add a simple type alias at the top
            sed -i "s|import type { SupabaseClient } from '@supabase/supabase-js'|// LOCAL MODE: SupabaseClient type replaced with local adapter\ntype SupabaseClient = any;|g" "$file"
            echo "    → Replaced SupabaseClient type import" | tee -a "$LOG_FILE"
        fi
        
        if $has_createclient; then
            # This is likely a secondary Supabase instance (like TCS adapter)
            # Log but don't auto-replace — needs manual review
            echo "    ⚠ WARNING: createClient import found — needs manual migration" | tee -a "$LOG_FILE"
        fi
        
        if $has_dynamic_import; then
            # Replace: const { supabase } = await import('./supabase')
            # With:    const { supabase } = await import('./local-api')
            sed -i "s|await import('\./supabase')|await import('./db')|g" "$file"
            sed -i "s|await import(\"./supabase\")|await import('./db')|g" "$file"
            sed -i "s|await import('\./local-api')|await import('./db')|g" "$file"
            sed -i "s|await import(\"./local-api\")|await import('./db')|g" "$file"
            echo "    → Replaced dynamic import" | tee -a "$LOG_FILE"
        fi
        
        changed=$((changed + 1))
    else
        # Dry run — just report
        $has_supabase_import && echo "    → Would replace supabase import" | tee -a "$LOG_FILE"
        $has_type_import && echo "    → Would replace SupabaseClient type" | tee -a "$LOG_FILE"
        $has_createclient && echo "    ⚠ createClient found — needs manual migration" | tee -a "$LOG_FILE"
        $has_dynamic_import && echo "    → Would replace dynamic import" | tee -a "$LOG_FILE"
        changed=$((changed + 1))
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════"
if [[ "$MODE" == "--apply" ]]; then
    echo -e "${GREEN}Migration complete!${NC}"
    echo "  Files modified: $changed"
    echo "  Files skipped:  $skipped"
    echo "  Backups created: $changed (.bak files)"
    echo "  Log: $LOG_FILE"
    echo ""
    echo "To revert: bash scripts/localize.sh --revert"
else
    echo -e "${YELLOW}DRY RUN complete (no files modified)${NC}"
    echo "  Files that would change: $changed"
    echo "  Files skipped: $skipped"
    echo ""
    echo "To apply: bash scripts/localize.sh --apply"
fi
echo "═══════════════════════════════════════════════════════"

# ─── Special notes ────────────────────────────────────────────────────
echo ""
echo "MANUAL STEPS REQUIRED:"
echo "  1. src/lib/systems/adapters/tcs.ts — has its own createClient()"
echo "     This is a separate Supabase instance for TCS. Either:"
echo "     a) Create a second local API endpoint for TCS data"  
echo "     b) Merge TCS data into the main local API"
echo "  2. src/stores/useUserStore.ts — has Supabase auth key parsing"
echo "     The local adapter handles auth differently (localStorage)"
echo "  3. Review .env.local — ensure VITE_API_BASE_URL is set"
echo "  4. Test auth flow (login/signup) with the local API"
