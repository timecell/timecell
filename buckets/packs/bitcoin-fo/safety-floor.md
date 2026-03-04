# Safety Floor
layer: pack

## Goal
Money I can't lose. Covers living expenses and provides runway during market downturns.

## Goal Type
range

## Target
- min: 12 months of burn (matches min-runway guardrail)
- max: 24 months of burn
- unit: months_expenses
- source: pack
- reasoning: "12-24 months of expenses in safe assets means you never have to sell BTC in a crash."

## Eligible Assets
- Cash (all currencies)
- Money market funds
- Treasury bills (< 1 year)
- Stablecoins (USDC, USDT on reputable exchanges)
- Government bonds (< 2 year maturity)

## NOT Eligible
- Equities
- Cryptocurrency (including BTC)
- Real estate
- Any illiquid asset
- Any asset that can lose > 5% in a month

## Key Metrics
- runway_months (from engine)
- coverage_ratio: current_value / (monthly_burn * target_months)

## Provenance
source: pack
reasoning: "The safety floor is what lets you sleep at night and hold through -80% BTC drawdowns."
