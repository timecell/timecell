# Manual Input (Default Integration)
layer: core
source_type: manual
status: active

## Source
- name: User Manual Input
- type: manual
- endpoint: n/a
- auth_method: none

## Description
The default integration for all primitives. The user provides data directly during skill conversations (/setup, /ask, /start).

This is always available as a fallback — even if an API integration exists, the user can manually override any value.

## Data Mapping
- target_type: any
- target_file: any primitive
- field: any
- transform: none (user provides final value)

## Schedule
- frequency: on_demand
- triggered_by: user conversation

## Validation
- expected_format: varies
- range_check: CIO applies judgment (e.g., "You said runway is 500 months — that seems high. Did you mean 50?")

## v0.1 Note
Manual input is the PRIMARY integration method in v0.1. All other integrations enhance but don't replace the ability to manually provide data.
