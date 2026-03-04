# Liquidity Ratio
layer: core
type: computed

## Definition
Ratio of liquid assets to total portfolio value. Measures how quickly the portfolio can be converted to cash.

## Formula
liquidity_ratio = liquid_assets_usd / total_portfolio_value_usd

## Classification of Liquidity
- Immediately liquid: cash, money market, stablecoins
- Liquid (1-3 days): public equities, ETFs, exchange-held crypto
- Semi-liquid (1-4 weeks): self-custodied crypto, bonds
- Illiquid (months+): real estate, private equity, locked funds

## Inputs
- Holdings from profile.md → Portfolio Summary
- Liquidity classification per entity

## Interpretation
- < 10%: LOW — may not be able to meet obligations or seize opportunities
- 10-25%: MODERATE — adequate for normal circumstances
- 25-50%: HEALTHY — good flexibility
- > 50%: HIGH — consider whether excess cash is working

## Used By
- skills/core/start.md
- skills/core/monthly.md
