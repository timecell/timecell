# Temperature-Based Selling Tiers
layer: pack
type: multi-phase
status: active

## Overview
Systematic selling ladder triggered by Bitcoin temperature zones. Removes emotion from profit-taking by pre-defining sell amounts at each temperature level.

## Trigger
- metric: metrics/packs/bitcoin-fo/temperature.md
- condition: temperature enters HOT (60+) or OVERHEATED (80+) zone
- frequency: checked daily in /start

## Rules (Default Ladder)

### Phase 1: Initial Trim (Temperature 60-70)
- Sell: 5% of core BTC position
- Purpose: Lock in first profits, fund lifestyle
- Destination: Safety Floor bucket (cash/stables)

### Phase 2: Strategic Reduction (Temperature 70-80)
- Sell: 10% of remaining core BTC position
- Purpose: Build significant cash position for crash deployment
- Destination: Split between Safety Floor and Growth Engine

### Phase 3: Aggressive Selling (Temperature 80-90)
- Sell: 15% of remaining core BTC position
- Purpose: Major risk reduction near cycle top
- Destination: Safety Floor and Hard Assets

### Phase 4: Maximum Selling (Temperature 90+)
- Sell: 20% of remaining core BTC position
- Purpose: Cycle top behavior — maximize fiat for redeployment
- Destination: Safety Floor (ready for crash deployment)

## Engine Function
calculateSellingRules(input: SellingRulesInput) → SellingRulesResult

## Guardrail Dependencies
- guardrails/packs/bitcoin-fo/no-leverage.md must PASS
- guardrails/core/min-runway.md must not be CRITICAL

## Never Sell Below
Core floor: Never sell below 50% of original BTC position (configurable).
Reasoning: "This is a conviction position. The selling ladder takes profits at highs but preserves the core forever stack."

## Decision Journal
When this strategy fires, log:
- date, temperature, action taken, amount, price, reasoning
