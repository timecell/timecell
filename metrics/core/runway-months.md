# Runway Months
layer: core
type: computed

## Definition
Number of months the family office can sustain current spending from liquid reserves, assuming no new income.

## Formula
runway_months = liquid_reserve_usd / monthly_burn_usd

## Engine Function
calculateRunwayMonths(portfolio: PortfolioInput) → number

## Inputs
- liquid_reserve_usd: from profile.md → Portfolio Summary → liquid reserves
- monthly_burn_usd: from profile.md → Burn & Runway → monthly_burn_usd

## Interpretation
- < 6 months: CRITICAL — existential risk
- 6-12 months: WARNING — review burn rate
- 12-18 months: SAFE — adequate
- > 18 months: STRONG — well-positioned

## Used By
- guardrails/core/min-runway.md
- skills/core/start.md (daily snapshot)
- skills/core/check.md (risk assessment)
- skills/core/monthly.md (full review)
