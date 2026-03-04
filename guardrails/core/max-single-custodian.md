# Max Single Custodian
layer: core
type: threshold

## Purpose
Prevent catastrophic loss from a single custodian failure (exchange hack, bank failure, broker insolvency).

## Zones
- CRITICAL: > 50% at one custodian — "Unacceptable concentration. Diversify immediately."
- WARNING: 30-50% at one custodian — "High exposure. Plan redistribution."
- SAFE: < 30% at one custodian — "Well-diversified custody."

## Default Threshold
value: 30
unit: percent of total portfolio
source: core
reasoning: "If any single custodian fails, you lose at most 30% of your portfolio. Painful but survivable."

## How Assessed
For each custodian entity:
  custodian_concentration = sum(assets held by custodian) / total_portfolio_value * 100

Flag if any custodian exceeds threshold.

## Actions When Breached
- CRITICAL: Priority action in /start. Name the custodian and recommend specific redistribution.
- WARNING: Include in /weekly review. Suggest gradual redistribution plan.

## User Override
Users can adjust in guardrails/user/max-single-custodian.md.
