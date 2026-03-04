# CoinGecko
layer: pack
source_type: api
status: not_configured

## Source
- name: CoinGecko
- type: api
- endpoint: https://api.coingecko.com/api/v3/simple/price
- auth_method: none (free tier) or api_key (pro tier)
- auth_reference: COINGECKO_API_KEY (optional, for pro tier)

## Description
Current BTC price for entity valuations and portfolio calculations. Free tier has rate limits but is sufficient for daily updates.

## Schedule
- frequency: daily
- preferred_time: on_demand (called when /start or /check runs)
- retry_on_failure: true
- max_retries: 2

## Data Mapping

### BTC Price → Portfolio Calculations
- target_type: metric
- target_file: memory/profile.md
- field: btcPriceUsd (used in all engine calculations)
- transform: none (direct USD price)

### BTC Price → Entity Valuations
- target_type: entity
- target_file: entities/user/*.md (all BTC-holding entities)
- field: value_usd
- transform: quantity * price

### BTC Price → Drawdown Calculation
- target_type: metric
- target_file: metrics/packs/bitcoin-fo/drawdown-pct.md
- field: current_price
- transform: ((ath - current) / ath) * 100

## Validation
- expected_format: json
- range_check: price > 0, price < 10000000
- spike_detection: 15% daily change triggers review
- stale_threshold: 24 hours

## Fallback
- fallback_source: manual input (user types current BTC price)
- manual_override: yes

## v0.1 Usage
User provides current BTC price when running skills. CIO asks once per session: "What's the current BTC price?" and uses it for all calculations in that session.
