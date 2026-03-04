# Deribit
layer: pack
source_type: api
status: not_configured

## Source
- name: Deribit
- type: api
- endpoint: https://www.deribit.com/api/v2
- auth_method: api_key
- auth_reference: DERIBIT_CLIENT_ID, DERIBIT_CLIENT_SECRET (set in environment)

## Description
Options exchange for hedge position tracking. Provides current positions, option chain pricing, and DVOL (implied volatility index). Used for hedge monitoring and roll cost calculations.

## Schedule
- frequency: daily
- preferred_time: on_demand (called during /check or /monthly)
- retry_on_failure: true
- max_retries: 2

## Data Mapping

### Positions → Hedge Entities
- target_type: entity
- target_file: entities/user/hedge-positions.md (if exists)
- field: holdings
- transform: Map Deribit positions to HedgePosition type (strikeUsd, quantityBtc, expiryDate)

### DVOL → Hedge Metric
- target_type: metric
- target_file: (pack extension metric, if defined)
- field: implied_volatility
- transform: none

### Cash Balance → Entity
- target_type: entity
- target_file: entities/user/deribit-account.md (if exists)
- field: value_usd
- transform: BTC balance * price + USD balance

## Validation
- expected_format: json
- range_check: positions quantity > 0, strike > 0
- stale_threshold: 24 hours

## Fallback
- manual_override: yes — user can input hedge positions manually

## v0.1 Usage
Hedge tracking is v0.2 scope. This integration is documented for forward compatibility.
Users with existing Deribit positions can describe them manually in entity files.

## Existing Implementation
If user has fo-web project: positions sync to Turso DB `deribit_positions` table via `scripts/sync-deribit-positions.py`.
