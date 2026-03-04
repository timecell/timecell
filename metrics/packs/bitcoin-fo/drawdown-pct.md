# Drawdown %
layer: pack
type: computed

## Definition
Current percentage decline from Bitcoin's all-time high. Measures where we are in the drawdown/recovery cycle.

## Formula
drawdown_pct = ((ath_price - current_price) / ath_price) * 100

## Inputs
- current_price: BTC price in USD (from profile or market data)
- ath_price: All-time high BTC price (manually updated or fetched)

## Interpretation
- 0%: At all-time high
- 0-20%: Normal volatility
- 20-40%: Correction territory
- 40-60%: Bear market
- 60-80%: Deep bear / capitulation
- > 80%: Generational buying opportunity (historically)

## Used By
- strategies/packs/bitcoin-fo/crash-deployment.md
- skills/core/check.md (stress scenarios)
