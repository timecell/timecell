# Integration Schema

Every integration file in integrations/ defines a connection between an external data source and one or more TimeCell primitives (entities, metrics, strategies).

## Required Fields

- name: Human-readable name
- layer: core | pack | user
- source_type: api | database | file | manual
- status: active | disabled | not_configured

## Structure

### Source
- name: [data provider name]
- type: api | database | file | manual
- endpoint: [URL, connection string, or file path]
- auth_method: api_key | oauth | service_account | none
- auth_reference: [env var name or credential location — NEVER the actual secret]

### Schedule
- frequency: realtime | hourly | daily | weekly | monthly | on_demand
- preferred_time: [UTC time if scheduled, e.g., "07:00 UTC"]
- retry_on_failure: true | false
- max_retries: [number]

### Data Mapping
Which primitives this integration feeds:
- target_type: metric | entity | strategy
- target_file: [path to the primitive file]
- field: [which field in the target gets updated]
- transform: [any transformation applied — formula, normalization, unit conversion]

### Validation
- expected_format: [json | csv | number | string]
- range_check: [min/max bounds for numeric data]
- spike_detection: [max % change that triggers review instead of auto-accept]
- stale_threshold: [hours/days after which data is considered stale]

### Fallback
- fallback_source: [alternative integration if primary fails]
- manual_override: [can user manually input this data? always yes for v0.1]
- last_successful_sync: [date — updated by sync process]

### Provenance
- source: core | pack | user
- added_during: [which skill/session]
- reasoning: [why this data source was chosen]

## v0.1 Scope
In v0.1, integrations are DOCUMENTATION ONLY:
- They describe where data comes from and what it feeds
- They do NOT auto-sync (user manually updates or uses engine-bridge)
- Auto-sync via cron/GitHub Actions is planned for v0.4 "Signal"

## How Skills Use Integrations
Skills check integration files to know:
1. Where to get data for a metric (e.g., temperature needs MVRV from BMPRO)
2. Whether data is stale (last_successful_sync vs stale_threshold)
3. What to tell the user if data is missing ("Temperature requires MVRV. Last updated: 3 days ago. Update manually or connect BMPRO API.")
