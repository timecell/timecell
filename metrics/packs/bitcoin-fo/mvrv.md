# MVRV Z-Score
layer: pack
type: fetched

## Definition
Market Value to Realized Value Z-Score. Measures how far the current market cap deviates from the realized cap (cost basis of all coins). High MVRV = market overvalued relative to aggregate cost basis.

## Formula
MVRV Z-Score = (Market Cap - Realized Cap) / StdDev(Market Cap)

## Data Source
External — fetched from on-chain data provider or manually input.

## Interpretation
- < 0: Extremely undervalued. Historically marks cycle bottoms.
- 0-2: Undervalued to fair value.
- 2-5: Above fair value. Caution zone.
- > 5: Extremely overvalued. Historically marks cycle tops.

## Weight in Temperature
60% of temperature calculation (primary signal).

## Used By
- metrics/packs/bitcoin-fo/temperature.md (60% weight)
