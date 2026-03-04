# Strategy Schema

Every strategy file in strategies/ must follow this structure.

## Required Fields

- name: Human-readable name
- layer: core | pack | user
- type: simple | multi-phase | conditional
- status: active | paused | draft

## Structure

### Overview
[What this strategy does — 1-2 sentences]

### Trigger
[When this strategy activates]
- metric: [which metric triggers this]
- condition: [threshold or zone]
- frequency: continuous | daily | weekly | monthly | on-demand

### Rules
[The actual decision logic — numbered steps]
1. When [condition], do [action]
2. When [condition], do [action]
...

### Phases (for multi-phase strategies)
- Phase 1: [description] — triggers when [condition]
- Phase 2: [description] — triggers when [condition]
...

### Guardrail Dependencies
[Which guardrails must pass before this strategy executes]
- Requires: guardrails/[path] in SAFE or STRONG zone

### Metrics Used
[Which metrics this strategy reads]
- metrics/[path]

### Decision Journal
[When this strategy fires, log to memory/decisions.md]
- date:
- action:
- reasoning:
- market_context:

### User Override
Users can modify rules, triggers, and phases in strategies/user/.
Pack strategies can be disabled by creating a user override with status: paused.
