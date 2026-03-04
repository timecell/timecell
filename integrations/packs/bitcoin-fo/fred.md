# FRED (Federal Reserve Economic Data)
layer: pack
source_type: api
status: not_configured

## Source
- name: Federal Reserve Bank of St. Louis
- type: api
- endpoint: https://api.stlouisfed.org/fred/series/observations
- auth_method: api_key
- auth_reference: FRED_API_KEY (free registration at fred.stlouisfed.org)

## Description
US macroeconomic data for contextual analysis. Provides credit impulse components, M2 money supply, DXY (dollar index), treasury yields, and inflation expectations. Used for macro environment assessment in weekly/monthly reviews.

## Schedule
- frequency: weekly
- preferred_time: Monday 10:00 UTC
- retry_on_failure: true
- max_retries: 3

## Data Mapping

### Macro Indicators → Context
- target_type: strategy
- target_file: strategies/packs/bitcoin-fo/crash-deployment.md (macro context)
- field: macro_environment
- transform: Aggregate indicators into macro sentiment (risk-on / neutral / risk-off)
- series_ids:
  - DGS10: 10-year treasury yield
  - DTWEXBGS: Trade-weighted dollar index
  - M2SL: M2 money supply
  - T10YIE: 10-year breakeven inflation
  - CPALTT01USM657N: CPI

## Validation
- expected_format: json
- stale_threshold: 14 days (macro data updates slowly)

## Fallback
- manual_override: yes — user can describe macro environment qualitatively

## v0.1 Usage
Macro context is qualitative in v0.1. CIO asks: "How would you describe the macro environment?" rather than fetching FRED data. This integration is documented for v0.4+ auto-sync.

## Existing Implementation
If user has fo-web project: macro metrics sync to Turso DB `macro_metrics` table via `scripts/sync-macro-metrics.py`.
