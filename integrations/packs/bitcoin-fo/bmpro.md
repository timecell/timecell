# Bitcoin Magazine Pro (BMPRO)
layer: pack
source_type: api
status: not_configured

## Source
- name: Bitcoin Magazine Pro
- type: api
- endpoint: https://api.bitcoinmagazinepro.com
- auth_method: api_key
- auth_reference: BMPRO_API_KEY (set in .env or environment)

## Description
Primary source for Bitcoin on-chain metrics. Provides MVRV Z-Score and RHODL Ratio, which are the two inputs to the Bitcoin Temperature calculation.

## Schedule
- frequency: daily
- preferred_time: 07:00 UTC
- retry_on_failure: true
- max_retries: 3

## Data Mapping

### MVRV Z-Score → Temperature Metric
- target_type: metric
- target_file: metrics/packs/bitcoin-fo/temperature.md
- field: mvrv
- transform: Raw MVRV Z-Score value passed to calculateTemperature()
- secondary_target: metrics/packs/bitcoin-fo/mvrv.md

### RHODL Ratio → Temperature Metric
- target_type: metric
- target_file: metrics/packs/bitcoin-fo/temperature.md
- field: rhodl
- transform: Raw RHODL Ratio value passed to calculateTemperature()

### BTC Price → Entity Valuations
- target_type: entity
- target_file: entities/user/*.md (all BTC-holding entities)
- field: value_usd
- transform: quantity * btc_price_usd

## Validation
- expected_format: json
- range_check:
  - mvrv: -2.0 to 10.0 (historical range)
  - rhodl: 0 to 1000000 (wide range, log-scale metric)
  - price: > 0
- spike_detection: 20% daily change triggers review
- stale_threshold: 48 hours

## Fallback
- fallback_source: integrations/packs/bitcoin-fo/coingecko.md (price only, no on-chain)
- manual_override: yes — user can input MVRV/RHODL manually in /start or /ask

## v0.1 Usage
Until auto-sync is configured:
1. User provides MVRV and RHODL values when running /start
2. CIO asks: "What's the current MVRV?" or "Check bitcoinmagazinepro.com for today's MVRV"
3. Values passed to engine-bridge for temperature calculation

## Existing Implementation
If user has fo-web project: data already syncs to Turso DB `temperature_history` table via `scripts/sync-btc-temp.py`. TimeCell can reference this directly.
