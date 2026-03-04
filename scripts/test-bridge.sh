#!/usr/bin/env bash
# =============================================================================
# Engine Bridge Test Script
# =============================================================================
# Tests all 15 functions in engine-bridge.py FUNCTION_MAP with realistic
# sample data for a Bitcoin-heavy family office.
#
# Portfolio assumptions:
#   - Total portfolio: ~$63M
#   - BTC allocation: 85% (~$53.55M in BTC)
#   - Monthly burn: $150K
#   - Liquid reserves: $1.2M
#   - BTC price: $90,000
#   - BTC holdings: ~595 BTC ($53.55M / $90K)
#
# Known issues:
#   - calculateTemperatureAdjustedDCA: The bridge maps args as
#     "temperature,baseAmount" (two primitives), but the actual TS function
#     signature is (input: DCAInput, temperatureScore: number). The bridge
#     will pass the temperature number as the first arg where a DCAInput
#     object is expected. This will likely fail or produce wrong results.
#     To fix, the bridge should map args as "input,temperatureScore" with
#     input being an object pass-through.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BRIDGE="python3 ${SCRIPT_DIR}/engine-bridge.py"

PASSED=0
FAILED=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# Helper: run a single test
# ---------------------------------------------------------------------------
run_test() {
    local func_name="$1"
    local json_args="$2"
    local note="${3:-}"

    TOTAL=$((TOTAL + 1))

    # Run the bridge
    local output
    local exit_code=0
    output=$($BRIDGE "$func_name" "$json_args" 2>&1) || exit_code=$?

    # Check exit code
    if [ $exit_code -ne 0 ]; then
        FAILED=$((FAILED + 1))
        printf "${RED}FAIL${NC} [%02d] %-40s exit=%d %s\n" "$TOTAL" "$func_name" "$exit_code" "$note"
        echo "       Output: $(echo "$output" | head -3)"
        return
    fi

    # Check output is non-empty
    if [ -z "$output" ]; then
        FAILED=$((FAILED + 1))
        printf "${RED}FAIL${NC} [%02d] %-40s empty output %s\n" "$TOTAL" "$func_name" "$note"
        return
    fi

    # Check output is valid JSON
    if ! echo "$output" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
        FAILED=$((FAILED + 1))
        printf "${RED}FAIL${NC} [%02d] %-40s invalid JSON %s\n" "$TOTAL" "$func_name" "$note"
        echo "       Output: $(echo "$output" | head -3)"
        return
    fi

    # Check output does not contain an error field at top level
    local has_error
    has_error=$(echo "$output" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if isinstance(d,dict) and 'error' in d else 'no')" 2>/dev/null || echo "no")
    if [ "$has_error" = "yes" ]; then
        FAILED=$((FAILED + 1))
        printf "${RED}FAIL${NC} [%02d] %-40s returned error %s\n" "$TOTAL" "$func_name" "$note"
        echo "       Output: $(echo "$output" | head -3)"
        return
    fi

    # Extract a brief summary from the output
    local summary
    summary=$(echo "$output" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if isinstance(d, list):
    print(f'{len(d)} items')
elif isinstance(d, dict):
    keys = list(d.keys())[:4]
    parts = []
    for k in keys:
        v = d[k]
        if isinstance(v, (int, float)):
            if abs(v) >= 1000000:
                parts.append(f'{k}=\${v/1000000:.1f}M')
            elif abs(v) >= 1000:
                parts.append(f'{k}=\${v/1000:.0f}k')
            else:
                parts.append(f'{k}={v}')
        elif isinstance(v, bool):
            parts.append(f'{k}={v}')
        elif isinstance(v, str) and len(v) < 50:
            parts.append(f'{k}={v}')
        elif isinstance(v, list):
            parts.append(f'{k}=[{len(v)}]')
        else:
            parts.append(f'{k}=...')
    print(', '.join(parts))
else:
    print(str(d)[:80])
" 2>/dev/null || echo "ok")

    PASSED=$((PASSED + 1))
    printf "${GREEN}PASS${NC} [%02d] %-40s %s\n" "$TOTAL" "$func_name" "$summary"
}

# =============================================================================
# Test data — Bitcoin-heavy family office
# =============================================================================

# PortfolioInput (used by ruinTest, crashSurvival, historicalCrashes)
PORTFOLIO='{
    "totalValueUsd": 63000000,
    "btcPercentage": 85,
    "monthlyBurnUsd": 150000,
    "liquidReserveUsd": 1200000,
    "btcPriceUsd": 90000
}'

HEDGE_POSITIONS='[{"strikeUsd": 63000, "quantityBtc": 50}]'

echo "============================================================================="
echo "  Engine Bridge Test Suite"
echo "  Portfolio: \$63M total, 85% BTC, \$150K/mo burn, \$1.2M liquid, BTC@\$90K"
echo "============================================================================="
echo ""

# ---------------------------------------------------------------------------
# 1. calculateRunwayMonths
#    Signature: (availableLiquidity: number, monthlyBurn: number)
#    Bridge args: "availableLiquidity,monthlyBurn" — multi-arg extraction
# ---------------------------------------------------------------------------
run_test "calculateRunwayMonths" '{
    "availableLiquidity": 1200000,
    "monthlyBurn": 150000
}'

# ---------------------------------------------------------------------------
# 2. calculateCrashSurvival
#    Signature: (portfolio: PortfolioInput, hedgePositions: HedgePosition[], config?)
#    Bridge args: "portfolio,hedgePositions" — multi-arg extraction
# ---------------------------------------------------------------------------
run_test "calculateCrashSurvival" "{
    \"portfolio\": $(echo $PORTFOLIO),
    \"hedgePositions\": $HEDGE_POSITIONS
}"

# ---------------------------------------------------------------------------
# 3. ruinTest
#    Signature: (portfolio: PortfolioInput, hedgePositions?: HedgePosition[])
#    Bridge args: "portfolio" — single object pass-through
#    Note: bridge passes the whole JSON as the portfolio arg. The JSON IS
#    the PortfolioInput since "portfolio" triggers single-object mode.
# ---------------------------------------------------------------------------
run_test "ruinTest" "$PORTFOLIO"

# ---------------------------------------------------------------------------
# 4. calculateTemperature
#    Signature: (mvrv: number, rhodl: number)
#    Bridge args: "mvrv,rhodl" — multi-arg extraction
# ---------------------------------------------------------------------------
run_test "calculateTemperature" '{
    "mvrv": 2.5,
    "rhodl": 50000
}'

# ---------------------------------------------------------------------------
# 5. calculatePositionSizing
#    Signature: (input: PositionSizingInput)
#    Bridge args: "input" — single object pass-through
# ---------------------------------------------------------------------------
run_test "calculatePositionSizing" '{
    "totalValueUsd": 63000000,
    "currentBtcPct": 85,
    "targetBtcPct": 80,
    "monthlyBurnUsd": 150000,
    "liquidReserveUsd": 1200000,
    "btcPriceUsd": 90000,
    "dcaMonths": 6
}'

# ---------------------------------------------------------------------------
# 6. generateActionPlan
#    Signature: (input: ActionPlanInput)
#    Bridge args: "input" — single object pass-through
# ---------------------------------------------------------------------------
run_test "generateActionPlan" '{
    "btcPercentage": 85,
    "ruinTestPassed": true,
    "runwayMonths": 8,
    "temperatureScore": 55,
    "liquidReserveUsd": 1200000,
    "monthlyBurnUsd": 150000,
    "totalValueUsd": 63000000
}'

# ---------------------------------------------------------------------------
# 7. calculateSleepTest
#    Signature: (input: SleepTestInput)
#    Bridge args: "input" — single object pass-through
# ---------------------------------------------------------------------------
run_test "calculateSleepTest" '{
    "totalPortfolioValue": 63000000,
    "btcPercentage": 85
}'

# ---------------------------------------------------------------------------
# 8. calculateCapacityGate
#    Signature: (input: CapacityGateInput)
#    Bridge args: "input" — single object pass-through
# ---------------------------------------------------------------------------
run_test "calculateCapacityGate" '{
    "age": 42,
    "annualIncome": 500000,
    "withdrawalHorizonYears": 15,
    "totalLiabilitiesAnnual": 200000,
    "totalPortfolioValue": 63000000,
    "convictionRung": 6
}'

# ---------------------------------------------------------------------------
# 9. calculateAllocationDrift
#    Signature: (input: AllocationDriftInput)
#    Bridge args: "input" — single object pass-through
#    BTC holdings: 85% of $63M / $90K = 595 BTC
#    Other assets: 15% of $63M = $9.45M
#    Initial BTC price was $85K (price has drifted up to $90K)
# ---------------------------------------------------------------------------
run_test "calculateAllocationDrift" '{
    "initialBtcPct": 85,
    "initialBtcPrice": 85000,
    "currentBtcPrice": 90000,
    "otherAssetsValue": 9450000,
    "btcHoldings": 595
}'

# ---------------------------------------------------------------------------
# 10. calculateSellingRules
#     Signature: (input: SellingRulesInput)
#     Bridge args: "input" — single object pass-through
# ---------------------------------------------------------------------------
run_test "calculateSellingRules" '{
    "temperatureScore": 55,
    "btcPercentage": 85,
    "totalBtcValueUsd": 53550000,
    "btcPriceUsd": 90000
}'

# ---------------------------------------------------------------------------
# 11. calculateDownsideInsurance
#     Signature: (input: InsuranceInput)
#     Bridge args: "input" — single object pass-through
# ---------------------------------------------------------------------------
run_test "calculateDownsideInsurance" '{
    "totalBtcValueUsd": 53550000,
    "btcPriceUsd": 90000,
    "hedgeBudgetPct": 2,
    "putStrikePct": 70,
    "putCostPct": 3,
    "expiryMonths": 6
}'

# ---------------------------------------------------------------------------
# 12. calculateDCA
#     Signature: (input: DCAInput)
#     Bridge args: "input" — single object pass-through
# ---------------------------------------------------------------------------
run_test "calculateDCA" '{
    "monthlyAmount": 50000,
    "months": 12,
    "currentBtcPrice": 90000
}'

# ---------------------------------------------------------------------------
# 13. calculateTemperatureAdjustedDCA
#     Signature: (input: DCAInput, temperatureScore: number)
#     Bridge args: "temperature,baseAmount" — multi-arg extraction
#
#     KNOWN ISSUE: The bridge extracts "temperature" and "baseAmount" as two
#     primitive values and calls calculateTemperatureAdjustedDCA(temp, baseAmount).
#     But the actual TS function expects (DCAInput, number). The bridge should
#     map args as "input,temperatureScore" to pass the DCAInput object correctly.
#     This test documents the mismatch — it will likely fail.
# ---------------------------------------------------------------------------
run_test "calculateTemperatureAdjustedDCA" '{
    "temperature": 55,
    "baseAmount": 50000
}' "(KNOWN ISSUE: bridge arg mismatch — expects DCAInput object + number)"

# ---------------------------------------------------------------------------
# 14. calculateCustodyRisk
#     Signature: (input: CustodyInput)
#     Bridge args: "input" — single object pass-through
# ---------------------------------------------------------------------------
run_test "calculateCustodyRisk" '{
    "totalBtcValueUsd": 53550000,
    "exchangePct": 15,
    "btcPriceUsd": 90000
}'

# ---------------------------------------------------------------------------
# 15. simulateAllHistoricalCrashes
#     Signature: (portfolio: PortfolioInput)
#     Bridge args: "portfolio" — single object pass-through
# ---------------------------------------------------------------------------
run_test "simulateAllHistoricalCrashes" "$PORTFOLIO"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================================================="
printf "  Results: ${GREEN}%d passed${NC}, ${RED}%d failed${NC}, %d total\n" "$PASSED" "$FAILED" "$TOTAL"
echo "============================================================================="

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
