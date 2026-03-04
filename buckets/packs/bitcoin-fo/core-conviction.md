# Core Conviction
layer: pack

## Goal
My biggest bet. Long-term Bitcoin holdings that are never panic-sold. This is the "forever stack."

## Goal Type
range

## Target
- min: 40% of portfolio
- max: 80% of portfolio
- unit: percent
- source: pack
- reasoning: "For Bitcoin-conviction investors, this IS the portfolio. The question isn't whether to hold BTC, it's how much."

## Eligible Assets
- Bitcoin (BTC) — self-custody preferred
- Bitcoin ETFs (as bridge to self-custody)

## NOT Eligible
- Altcoins
- Stablecoins
- Fiat currency
- Any non-Bitcoin asset

## Key Metrics
- btc_concentration (from engine)
- custody_risk (from engine — should be mostly self-custody)
- temperature (informs selling decisions FROM this bucket)

## Special Rules
- Selling tiers strategy sells FROM this bucket (never below floor)
- Core floor: never sell below 50% of peak BTC holdings
- Crash deployment buys INTO this bucket

## Provenance
source: pack
reasoning: "This is the conviction bucket. It only goes up in BTC terms over full cycles."
