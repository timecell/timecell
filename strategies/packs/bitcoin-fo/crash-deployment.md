# Crash Deployment Strategy
layer: pack
type: multi-phase
status: active

## Overview
Systematic buying ladder triggered during significant drawdowns. Uses cash/stables accumulated from selling tiers to buy back BTC at lower prices.

## Trigger
- metric: metrics/packs/bitcoin-fo/drawdown-pct.md
- condition: drawdown > 30% from ATH
- frequency: checked daily in /start

## Rules (Default Ladder)

### Phase 1: Initial Deployment (30-40% drawdown)
- Deploy: 10% of available opportunity fund
- Source: Safety Floor excess (above min runway)
- Reasoning: "Correction territory. Small initial position."

### Phase 2: Moderate Deployment (40-50% drawdown)
- Deploy: 20% of remaining opportunity fund
- Source: Safety Floor excess + Growth Engine reallocation
- Reasoning: "Bear market. Historically strong buying zone."

### Phase 3: Heavy Deployment (50-60% drawdown)
- Deploy: 30% of remaining opportunity fund
- Source: Any non-essential liquid assets
- Reasoning: "Deep bear. High conviction zone."

### Phase 4: Maximum Deployment (60%+ drawdown)
- Deploy: 40% of remaining opportunity fund
- Source: All available non-runway liquidity
- Reasoning: "Generational opportunity. Deploy aggressively."

## Guardrail Dependencies
- guardrails/core/min-runway.md must remain SAFE or above AFTER deployment
- Never deploy runway money — only excess liquidity

## Engine Function
calculatePositionSizing(input: PositionSizingInput) → PositionSizingResult

## Decision Journal
When this strategy fires, log:
- date, drawdown_pct, phase, amount_deployed, btc_price, reasoning
