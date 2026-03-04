#!/usr/bin/env bash
# Post-Setup Validation — Checks that /setup produced expected artifacts
#
# Run after completing a /setup session to verify everything was created.
# Usage: ./scripts/test-post-setup.sh
#
# Checks:
# 1. Profile completeness — key fields filled in memory/profile.md
# 2. Entity files created — at least 1 entity in entities/user/
# 3. Session logged — entry in memory/session-log.md
# 4. Guardrail overrides — if user disagreed with pack defaults
# 5. Bucket modifications — if user adjusted targets

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  \033[0;32m✅\033[0m $1"; PASS=$((PASS + 1)); }
fail() { echo -e "  \033[0;31m❌\033[0m $1"; FAIL=$((FAIL + 1)); }
warn() { echo -e "  \033[0;33m⚠️\033[0m  $1"; WARN=$((WARN + 1)); }

echo ""
echo "=== Post-Setup Validation ==="
echo ""

# 1. Profile completeness
echo "1. Profile Completeness (memory/profile.md)"

PROFILE="memory/profile.md"
if [ ! -f "$PROFILE" ]; then
    fail "profile.md does not exist"
else
    # Check key fields are not empty/placeholder
    check_field() {
        local field="$1"
        local label="$2"
        if grep -q "^- ${field}:.\+[^ ]" "$PROFILE" 2>/dev/null || \
           grep -q "^  ${field}:.\+[^ ]" "$PROFILE" 2>/dev/null; then
            pass "$label is filled"
        elif grep -q "${field}:" "$PROFILE" 2>/dev/null; then
            fail "$label exists but is empty"
        else
            fail "$label not found in profile"
        fi
    }

    check_field "name" "Identity → name"
    check_field "total_value_usd" "Portfolio → total_value_usd"
    check_field "monthly_burn_usd" "Burn → monthly_burn_usd"
    check_field "liquid_reserve_usd" "Burn → liquid_reserve_usd"
    check_field "communication_density" "CIO → communication_density"
    check_field "challenge_level" "CIO → challenge_level"

    # Check for goals (free text section — exclude the header lines themselves)
    GOALS_CONTENT=$(sed -n '/^## Goals$/,/^## /p' "$PROFILE" | grep -v "^## " | grep -c "[a-zA-Z]" 2>/dev/null || true)
    GOALS_CONTENT=${GOALS_CONTENT:-0}
    if [ "$GOALS_CONTENT" -gt 0 ]; then
        pass "Goals section has content ($GOALS_CONTENT lines)"
    else
        fail "Goals section is empty"
    fi

    # Check for risk profile
    if grep -q "risk_context:.\+[a-zA-Z]" "$PROFILE" 2>/dev/null; then
        pass "Risk profile has content"
    else
        fail "Risk profile is empty"
    fi

    # Check Updated date is not placeholder
    if grep -q "Updated:.*not yet" "$PROFILE" 2>/dev/null; then
        fail "Updated date is still placeholder"
    elif grep -q "Updated:" "$PROFILE" 2>/dev/null; then
        pass "Updated date is set"
    else
        fail "No Updated field found"
    fi
fi

echo ""

# 2. Entity files
echo "2. Entity Files (entities/user/)"
ENTITY_COUNT=$(find entities/user -name "*.md" -not -name ".gitkeep" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ENTITY_COUNT" -gt 0 ]; then
    pass "$ENTITY_COUNT entity file(s) created"
    # List them
    find entities/user -name "*.md" -not -name ".gitkeep" 2>/dev/null | while read f; do
        echo "       → $(basename "$f")"
    done
else
    fail "No entity files created in entities/user/"
fi

echo ""

# 3. Session log
echo "3. Session Log (memory/session-log.md)"
SESSION_LOG="memory/session-log.md"
if [ ! -f "$SESSION_LOG" ]; then
    fail "session-log.md does not exist"
else
    LOG_ENTRIES=$(grep -c "^## " "$SESSION_LOG" 2>/dev/null || true)
    LOG_ENTRIES=${LOG_ENTRIES:-0}
    if [ "$LOG_ENTRIES" -gt 0 ]; then
        pass "Session log has $LOG_ENTRIES entry/entries"
    else
        warn "Session log exists but has no entries (CIO may not have saved yet)"
    fi
fi

echo ""

# 4. Guardrail overrides (optional — only if user disagreed)
echo "4. Guardrail Overrides (guardrails/user/)"
OVERRIDE_COUNT=$(find guardrails/user -name "*.md" -not -name ".gitkeep" 2>/dev/null | wc -l | tr -d ' ')
if [ "$OVERRIDE_COUNT" -gt 0 ]; then
    pass "$OVERRIDE_COUNT guardrail override(s) created"
    find guardrails/user -name "*.md" -not -name ".gitkeep" 2>/dev/null | while read f; do
        echo "       → $(basename "$f")"
    done
else
    warn "No guardrail overrides (ok if user agreed with all defaults)"
fi

echo ""

# 5. Bucket modifications (optional)
echo "5. Bucket Modifications (buckets/user/)"
BUCKET_COUNT=$(find buckets/user -name "*.md" -not -name ".gitkeep" 2>/dev/null | wc -l | tr -d ' ')
if [ "$BUCKET_COUNT" -gt 0 ]; then
    pass "$BUCKET_COUNT bucket modification(s) created"
    find buckets/user -name "*.md" -not -name ".gitkeep" 2>/dev/null | while read f; do
        echo "       → $(basename "$f")"
    done
else
    warn "No bucket modifications (ok if user accepted defaults)"
fi

echo ""

# 6. Decision journal (should have setup entries)
echo "6. Decision Journal (memory/decisions.md)"
DECISIONS="memory/decisions.md"
if [ ! -f "$DECISIONS" ]; then
    fail "decisions.md does not exist"
else
    DECISION_ENTRIES=$(grep -c "^## " "$DECISIONS" 2>/dev/null || true)
    DECISION_ENTRIES=${DECISION_ENTRIES:-0}
    if [ "$DECISION_ENTRIES" -gt 0 ]; then
        pass "Decision journal has $DECISION_ENTRIES entry/entries"
    else
        warn "Decision journal is empty (ok if no overrides were made)"
    fi
fi

echo ""

# Summary
echo "==========================================="
echo "  Post-Setup Validation Results"
echo "==========================================="
echo -e "  \033[0;32mPassed:  $PASS\033[0m"
echo -e "  \033[0;31mFailed:  $FAIL\033[0m"
echo -e "  \033[0;33mWarning: $WARN\033[0m"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo "  RESULT: SETUP LOOKS GOOD ✅"
    if [ "$WARN" -gt 0 ]; then
        echo "  ($WARN warnings — review above)"
    fi
else
    echo "  RESULT: SETUP INCOMPLETE ❌"
    echo "  $FAIL check(s) failed — review above"
fi

echo ""
exit $FAIL
