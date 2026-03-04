# Min Runway
layer: core
type: range

## Purpose
Ensure the family office always has enough liquid reserves to cover expenses without forced selling.

## Zones
- CRITICAL: < 6 months — "Existential risk. Immediate action required."
- WARNING: 6-12 months — "Below comfortable. Review burn rate."
- SAFE: 12-18 months — "Adequate for most situations."
- STRONG: > 18 months — "Well-positioned."

## Default Threshold
value: 12
unit: months
source: core
reasoning: "12 months covers most disruptions — job loss, market crash, health emergency — without forcing panic selling."

## Engine Function
calculateRunwayMonths(portfolio: PortfolioInput) → number

## Metric Reference
metrics/core/runway-months.md

## Actions When Breached
- CRITICAL: Flag as priority #1 in /start. Recommend immediate burn reduction or asset liquidation plan.
- WARNING: Include in /start priorities. Suggest reviewing discretionary spending.

## User Override
Users can adjust zone boundaries and threshold in guardrails/user/min-runway.md.
Override inherits this structure — only changed values need to be specified.
