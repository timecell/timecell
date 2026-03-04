# Max BTC Concentration
layer: pack
type: range

## Purpose
Define acceptable Bitcoin concentration levels. Unlike traditional finance where concentration = risk, for Bitcoin-conviction investors, high concentration may be intentional.

## Zones
- MONITOR: < 30% BTC — "Low conviction position. Is this intentional?"
- COMFORTABLE: 30-60% BTC — "Moderate conviction. Well-balanced."
- CONVICTION: 60-80% BTC — "High conviction. Ensure runway is strong."
- EXTREME: > 80% BTC — "Maximum conviction. Runway and custody must be bulletproof."

## Default Threshold
value: 80
unit: percent of portfolio
source: pack
reasoning: "Bitcoin-conviction investors accept high concentration. But above 80%, any crash directly threatens lifestyle. The constraint is not the conviction — it's the math of runway survival."

## How Assessed
btc_concentration = total_btc_value_usd / total_portfolio_value_usd * 100

## Interaction with Runway
At EXTREME concentration:
- Runway guardrail threshold automatically tightens (18 → 24 months)
- Crash survival must handle -80% drawdown
- Selling strategy must be active and calibrated

## Actions When Breached
- EXTREME: Not a hard stop, but a calibration check. "Your BTC concentration is [X]%. At this level, let's verify: runway is [Y] months, crash survival is [status], selling rules are [active/inactive]."

## User Override
Users can adjust zone boundaries. Many Bitcoin maximalists will set this to 95%+ intentionally — that's valid if runway and custody are strong.
