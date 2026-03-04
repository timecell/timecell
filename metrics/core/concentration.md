# Concentration %
layer: core
type: computed

## Definition
Percentage of total portfolio value held in a single asset or asset class. Flags single-point-of-failure risk.

## Formula
concentration_pct = (single_asset_value / total_portfolio_value) * 100

## Engine Function
calculateAllocationDrift(input: AllocationDriftInput) → AllocationDriftResult

## Inputs
- Holdings from profile.md → Portfolio Summary
- Bucket targets from active bucket definitions

## Interpretation
- Concentration itself is not good or bad — it depends on the asset and the investor's conviction.
- Guardrails define what concentration levels trigger warnings.
- A Bitcoin-conviction investor at 70% BTC may be within their guardrails.
- A traditional investor at 70% in a single stock is likely over-concentrated.

## Used By
- guardrails/core/max-single-custodian.md (custodian concentration)
- guardrails/packs/bitcoin-fo/max-btc-concentration.md (asset concentration)
- skills/core/start.md
- skills/core/check.md
