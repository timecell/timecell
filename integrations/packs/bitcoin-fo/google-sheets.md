# Google Sheets (Holdings)
layer: pack
source_type: api
status: not_configured

## Source
- name: Google Sheets
- type: api
- endpoint: Google Sheets API v4
- auth_method: service_account
- auth_reference: GOOGLE_SERVICE_ACCOUNT_JSON (set in environment)

## Description
Many family offices maintain a master holdings spreadsheet. This integration syncs holdings data from a Google Sheet into entity files and portfolio summary.

## Schedule
- frequency: daily
- preferred_time: 08:00 UTC
- retry_on_failure: true
- max_retries: 2

## Data Mapping

### Holdings Export → Entity Files
- target_type: entity
- target_file: entities/user/*.md
- field: holdings (quantity, value_usd, bucket)
- transform: Map spreadsheet rows to entity holdings format

### Holdings Summary → Profile
- target_type: profile
- target_file: memory/profile.md
- field: total_value_usd, holdings_by_bucket
- transform: Aggregate holdings by bucket, sum total value

## Validation
- expected_format: spreadsheet rows
- range_check: values > 0, quantities > 0
- spike_detection: 20% change in total value triggers review
- stale_threshold: 7 days

## Fallback
- manual_override: yes — user provides holdings during /setup or /ask

## v0.1 Usage
Holdings are entered manually during /setup and updated via /ask.
Google Sheets integration is for users who already maintain a holdings spreadsheet.

## Existing Implementation
If user has fo-web project: holdings sync from "Holdings Export" tab via `scripts/sync-sheets-to-turso.py`. Sheet ID configured in script.
