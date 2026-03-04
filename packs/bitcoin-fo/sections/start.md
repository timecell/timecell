# bitcoin-fo — /start Extension

## Additional Metrics
Compute and display:
1. Bitcoin Temperature: `python3 scripts/engine-bridge.py calculateTemperature '{"mvrv": M, "rhodl": R}'`
   - Show score (0-100) and zone (COLD/COOL/WARM/HOT/OVERHEATED)
2. MVRV Z-Score: current value and interpretation
3. DCA Status: current multiplier based on temperature zone
   - COLD: 2.0x | COOL: 1.5x | WARM: 1.0x | HOT: 0.5x | OVERHEATED: paused

## Additional Guardrails
Check and display:
1. Sovereign custody floor (from guardrails/packs/bitcoin-fo/sovereign-custody-floor.md)
2. BTC concentration level (from guardrails/packs/bitcoin-fo/max-btc-concentration.md)
3. No-leverage check (from guardrails/packs/bitcoin-fo/no-leverage.md)

## Additional Strategy Signals
Check triggers:
1. Selling tiers: Is temperature in HOT/OVERHEATED? Which phase is active?
2. Crash deployment: Is drawdown > 30%? Which phase is active?
3. DCA: What's today's adjusted amount?

## Output Section
Add after core report:

```
## Bitcoin (bitcoin-fo pack)
Temperature: XX/100 [ZONE] — "[zone description]"
MVRV: X.X | Drawdown: Y% from ATH
DCA: $X/period at Y.Yx multiplier
Custody: Z% self-custody [ZONE]
Selling ladder: [inactive / Phase N active at temp XX]
```
