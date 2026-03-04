# Temperature-Adjusted DCA
layer: pack
type: conditional
status: active

## Overview
Dollar-cost averaging schedule that adjusts purchase amounts based on Bitcoin temperature. Buy more when cold, less when hot, pause when overheated.

## Trigger
- metric: metrics/packs/bitcoin-fo/temperature.md
- condition: continuous — adjusts DCA multiplier based on current temperature
- frequency: daily/weekly (user configurable)

## Rules

### Temperature-Based Multipliers
- COLD (0-15): 2.0x base DCA amount — "Deep value. Double down."
- COOL (15-40): 1.5x base DCA amount — "Below fair value. Increase."
- WARM (40-60): 1.0x base DCA amount — "Fair value. Standard."
- HOT (60-80): 0.5x base DCA amount — "Above fair value. Reduce."
- OVERHEATED (80-100): 0x — "Pause DCA. Selling rules active."

### Configuration
- base_amount_usd: [user sets during /setup]
- frequency: daily | weekly | biweekly | monthly
- source_account: [entity reference]
- destination: Core Conviction bucket

## Engine Functions
- calculateDCA(input: DCAInput) → DCAResult
- calculateTemperatureAdjustedDCA(temperature, baseAmount) → adjusted amount

## Guardrail Dependencies
- DCA pauses if guardrails/core/min-runway.md is WARNING or below
- DCA amount never exceeds discretionary spending budget

## Decision Journal
Log monthly: total DCA'd, average temperature, average price
