#!/usr/bin/env bash
# TimeCell v0.1 Structural Validation
# Validates file existence, cross-references, layer consistency, and pack completeness.
# Run from project root: ./scripts/test-skills.sh

set -uo pipefail

# Resolve project root (script lives in scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Counters
PASS=0
FAIL=0
FAILURES=()

inc_pass() { PASS=$((PASS + 1)); }
inc_fail() { FAIL=$((FAIL + 1)); FAILURES+=("$1"); }

echo "=== TimeCell v0.1 Structural Validation ==="
echo ""

# ─────────────────────────────────────────────
# 1. File Existence Checks
# ─────────────────────────────────────────────

EXPECTED_FILES=(
  # Core primitives
  entities/core/entity-schema.md
  entities/core/relationship-types.md
  metrics/core/runway-months.md
  metrics/core/concentration.md
  metrics/core/liquidity-ratio.md
  guardrails/core/min-runway.md
  guardrails/core/max-single-custodian.md
  guardrails/core/estate-completeness.md
  strategies/core/strategy-schema.md
  buckets/core/bucket-schema.md

  # Bitcoin-fo pack
  packs/bitcoin-fo/pack.md
  packs/bitcoin-fo/beliefs.md
  packs/bitcoin-fo/sections/start.md
  packs/bitcoin-fo/sections/weekly.md
  packs/bitcoin-fo/sections/monthly.md
  packs/bitcoin-fo/sections/check.md
  entities/packs/bitcoin-fo/cold-wallet.md
  entities/packs/bitcoin-fo/exchange-account.md
  entities/packs/bitcoin-fo/custodian.md
  metrics/packs/bitcoin-fo/temperature.md
  metrics/packs/bitcoin-fo/mvrv.md
  metrics/packs/bitcoin-fo/drawdown-pct.md
  guardrails/packs/bitcoin-fo/no-leverage.md
  guardrails/packs/bitcoin-fo/sovereign-custody-floor.md
  guardrails/packs/bitcoin-fo/max-btc-concentration.md
  strategies/packs/bitcoin-fo/selling-tiers.md
  strategies/packs/bitcoin-fo/crash-deployment.md
  strategies/packs/bitcoin-fo/dca-schedule.md
  buckets/packs/bitcoin-fo/safety-floor.md
  buckets/packs/bitcoin-fo/core-conviction.md
  buckets/packs/bitcoin-fo/growth-engine.md
  buckets/packs/bitcoin-fo/moonshots.md
  buckets/packs/bitcoin-fo/hard-assets.md
  buckets/packs/bitcoin-fo/lifestyle-fund.md

  # Skills
  skills/core/setup.md
  skills/core/start.md
  skills/core/weekly.md
  skills/core/monthly.md
  skills/core/check.md
  skills/core/ask.md

  # Workflows
  workflows/coverage-engine.md
  workflows/profile-sync.md
  workflows/session-persistence.md

  # Memory
  memory/profile.md
  memory/decisions.md
  memory/session-log.md

  # Infrastructure
  CLAUDE.md
  README.md
  .claude/settings.json
  scripts/engine-bridge.py
  scripts/setup.sh

  # Reference
  reference/provenance-spec.md
  reference/skill-template.md
  reference/pack-template.md

  # Integrations
  integrations/core/integration-schema.md
  integrations/core/manual-input.md
  integrations/packs/bitcoin-fo/bmpro.md
  integrations/packs/bitcoin-fo/coingecko.md
  integrations/packs/bitcoin-fo/deribit.md
  integrations/packs/bitcoin-fo/google-sheets.md
  integrations/packs/bitcoin-fo/fred.md
)

FILE_PASS=0
FILE_TOTAL=${#EXPECTED_FILES[@]}

for f in "${EXPECTED_FILES[@]}"; do
  if [[ -f "$f" ]]; then
    inc_pass
    FILE_PASS=$((FILE_PASS + 1))
  else
    inc_fail "FAIL: missing file: $f"
  fi
done

echo "File Existence:     ${FILE_PASS}/${FILE_TOTAL} $([ "$FILE_PASS" -eq "$FILE_TOTAL" ] && echo '✅' || echo '❌')"

# ─────────────────────────────────────────────
# 2. Cross-Reference Checks
# ─────────────────────────────────────────────

XREF_PASS=0
XREF_TOTAL=0

check_references() {
  local search_dir="$1"
  local pattern="$2"

  if [[ ! -d "$search_dir" ]]; then
    return
  fi

  while IFS= read -r -d '' file; do
    # Extract referenced paths matching the pattern (e.g., metrics/..., guardrails/..., workflows/...)
    refs=$(grep -oE "${pattern}[a-zA-Z0-9/_-]+\.md" "$file" 2>/dev/null || true)
    for ref in $refs; do
      XREF_TOTAL=$((XREF_TOTAL + 1))
      if [[ -f "$ref" ]]; then
        inc_pass
        XREF_PASS=$((XREF_PASS + 1))
      else
        inc_fail "FAIL: broken reference in ${file} → ${ref}"
      fi
    done
  done < <(find "$search_dir" -name '*.md' -print0 2>/dev/null)
}

# Guardrails → metrics references
check_references "guardrails" "metrics/"

# Strategies → guardrails references
check_references "strategies" "guardrails/"

# Skills → workflows references
check_references "skills" "workflows/"

if [[ "$XREF_TOTAL" -eq 0 ]]; then
  echo "Cross-References:   0/0 ✅  (no cross-references found to validate)"
else
  echo "Cross-References:   ${XREF_PASS}/${XREF_TOTAL} $([ "$XREF_PASS" -eq "$XREF_TOTAL" ] && echo '✅' || echo '❌')"
fi

# ─────────────────────────────────────────────
# 3. Layer Consistency
# ─────────────────────────────────────────────

LAYER_PASS=0
LAYER_TOTAL=0
PRIMITIVES=(entities metrics guardrails strategies buckets)
LAYERS=(core "packs/bitcoin-fo" user)

for prim in "${PRIMITIVES[@]}"; do
  all_layers_exist=true
  for layer in "${LAYERS[@]}"; do
    dir="${prim}/${layer}"
    if [[ ! -d "$dir" ]]; then
      all_layers_exist=false
      inc_fail "FAIL: missing layer directory: ${dir}"
    fi
  done
  LAYER_TOTAL=$((LAYER_TOTAL + 1))
  if $all_layers_exist; then
    inc_pass
    LAYER_PASS=$((LAYER_PASS + 1))
  fi
done

echo "Layer Consistency:  ${LAYER_PASS}/${LAYER_TOTAL} $([ "$LAYER_PASS" -eq "$LAYER_TOTAL" ] && echo '✅' || echo '❌')"

# ─────────────────────────────────────────────
# 4. Pack Completeness (bitcoin-fo)
# ─────────────────────────────────────────────

PACK_PASS=0
PACK_TOTAL=0

for prim in "${PRIMITIVES[@]}"; do
  PACK_TOTAL=$((PACK_TOTAL + 1))
  pack_dir="${prim}/packs/bitcoin-fo"
  md_count=$(find "$pack_dir" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$md_count" -ge 1 ]]; then
    inc_pass
    PACK_PASS=$((PACK_PASS + 1))
  else
    inc_fail "FAIL: pack bitcoin-fo has no files in ${prim}/packs/bitcoin-fo/"
  fi
done

echo "Pack Completeness:  ${PACK_PASS}/${PACK_TOTAL} $([ "$PACK_PASS" -eq "$PACK_TOTAL" ] && echo '✅' || echo '❌')"

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────

echo ""

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo "--- Failures ---"
  for msg in "${FAILURES[@]}"; do
    echo "$msg"
  done
  echo ""
  echo "RESULT: ${FAIL} CHECK(S) FAILED ❌"
  exit 1
else
  echo "RESULT: ALL CHECKS PASSED ✅"
  exit 0
fi
