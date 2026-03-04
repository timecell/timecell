# Coverage Engine (Internal Workflow)

## Purpose
Reads all active metrics + guardrails and produces a coverage report. Used by /start, /check, /monthly — never user-invoked directly.

## Process

### 1. Gather Active Guardrails
Read guardrails from all three layers with override precedence:
1. Read guardrails/user/*.md → highest precedence
2. Read guardrails/packs/<active_pack>/*.md → middle precedence
3. Read guardrails/core/*.md → lowest precedence

If the same guardrail exists at multiple layers, use the highest-precedence version.

### 2. Compute Metrics
For each guardrail, compute the relevant metric:
- Use engine-bridge.py for computed metrics
- Use profile.md values for profile-based metrics
- Use entity files for entity-based assessments

### 3. Evaluate Zones
For each guardrail:
- Compare metric value against zone thresholds
- Classify into zone: CRITICAL / WARNING / SAFE / STRONG (or PASS/FAIL for binary)
- Record source of threshold (core/pack/user)

### 4. Produce Report
Return structured coverage data:
- guardrail_name
- metric_value
- zone
- threshold_source
- action_required (if any)
- priority (CRITICAL > WARNING > rest)

### 5. Sort by Priority
1. CRITICAL guardrails first
2. WARNING guardrails second
3. Strategy triggers third
4. SAFE/STRONG as confirmation

## Output Format
The calling skill (start, check, monthly) formats the output according to its own report template.
This workflow returns raw coverage data, not formatted text.
