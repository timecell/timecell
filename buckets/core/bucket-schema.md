# Bucket Schema

Every bucket file in buckets/ must follow this structure.

## Required Fields

- name: Human-readable name
- layer: core | pack | user
- goal: What this bucket is FOR (plain language)
- goal_type: binary | range | llm

## Structure

### Goal
[What this bucket is FOR — plain language]

### Goal Type
- binary: Either funded or not (e.g., emergency fund = 6 months expenses)
- range: Target range with min/max (e.g., 15-25% of portfolio)
- llm: Qualitative assessment by CIO (e.g., "adequate diversification")

### Target
[Depends on goal_type]
- binary: { threshold: value, unit: "months_expenses" | "usd" | "percent" }
- range: { min: value, max: value, unit: "percent" | "usd" }
- llm: { assessment_prompt: "Is this bucket adequately funded given..." }

### Eligible Assets
[What CAN go in this bucket]

### NOT Eligible
[What should NOT go in this bucket]

### Key Metrics
[Which metrics are relevant to this bucket]

### Provenance
- source: core | pack | user-set
- reasoning: [why these targets]
- set_during: [which skill/session]

### User Modifications
- Can rename: yes
- Can change eligible assets: yes
- Can change target: yes
- Can delete: yes (with CIO warning about coverage gaps)
