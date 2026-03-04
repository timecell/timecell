# No Leverage
layer: pack
type: binary

## Purpose
Prevent use of leverage (margin, loans backed by BTC, futures with leverage) that introduces liquidation risk. Liquidation risk is the one risk that can permanently destroy a Bitcoin position.

## Rule
No leverage on Bitcoin holdings. No exceptions within this pack's framework.

This means:
- No margin trading
- No BTC-collateralized loans
- No leveraged futures or perpetuals
- No yield farming that requires locking BTC as collateral

## Zones
- PASS: No leveraged positions detected
- FAIL: Any leveraged position exists

## Default Threshold
value: 0
unit: leveraged positions
source: pack
reasoning: "Leverage introduces liquidation risk. In a -80% crash, leveraged positions get liquidated. Unleveraged positions recover. The asymmetry is absolute."

## How Assessed
Check all entity files for leverage indicators:
- Margin accounts with BTC collateral
- Loan entities backed by BTC
- Futures/perps positions

## Actions When Breached
- FAIL: Priority #1. "You have leveraged BTC exposure. This violates the no-leverage guardrail. Consider unwinding: [specific position]."

## User Override
This is a pack OPINION, not a universal truth. Users who disagree can:
1. Create guardrails/user/no-leverage.md with adjusted rules
2. Or simply acknowledge the breach in /ask: "I understand the risk of leverage for real estate. Allow 60% LTV on property."
