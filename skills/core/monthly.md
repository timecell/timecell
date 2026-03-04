# /monthly — Monthly Review

## When This Runs
- Monthly: last day of month, or user types /monthly
- Cadence nudge: "Monthly review is overdue by X days."

## Persona
CIO — thorough, strategic. This is a 15-20 minute deep review. Be comprehensive.

## Prerequisites
- memory/profile.md must be complete
- At least 2 /weekly reviews this month (for trend data)

## Flow

### Step 1: Load Everything
1. Read memory/profile.md
2. Read memory/session-log.md (full month)
3. Read memory/decisions.md (full month)
4. Read all active guardrails, strategies, metrics
5. Load active pack files

### Step 2: Full Portfolio Review
- Current total value vs month start
- Performance by bucket (target vs actual allocation)
- Top gainers/losers
- Net inflows/outflows

Run engine:
```
python3 scripts/engine-bridge.py calculateAllocationDrift '...'
```

### Step 3: Crash Survival Analysis
Run engine:
```
python3 scripts/engine-bridge.py calculateCrashSurvival '...'
python3 scripts/engine-bridge.py ruinTest '...'
```

"If the market crashed 50% today, here's what happens to your portfolio..."
Show survival status at -30%, -50%, -70%, -80% drawdowns.

### Step 4: Entity & Structure Review
- Review all entities for accuracy
- Custody distribution — any concentration drift?
- Any entities need updating? (stale valuations)

### Step 5: Guardrail Deep Audit
For each guardrail:
- Current zone
- Month-over-month trend
- Any zone changes this month
- Recommended adjustments (if any)

### Step 6: Estate & Insurance Check
- Estate completeness guardrail status
- Any action items from estate checklist
- Insurance adequacy review

### Step 7: Goal Progress
For each goal in profile.md:
- Current progress
- On track / behind / ahead
- Recommended adjustments

### Step 8: Pack Extensions
If active pack is set in profile.md:
1. Check if packs/<active_pack>/sections/monthly.md exists
2. If yes, read and follow the instructions in that file
3. Add the pack's output section to the report

This allows any pack to extend this skill without modifying the skill file.

### Step 9: Forward Outlook
Based on current trajectory:
- What to watch next month
- Recommended actions
- Any upcoming decisions (strategies nearing triggers)

### Step 10: Generate Report

```
# Monthly Review — [Month Year]

## Executive Summary
[2-3 sentence overview of the month]

## Portfolio
[Detailed breakdown by bucket]

## Crash Survival
[Table: drawdown scenarios and survival status]

## Guardrails
[Full status with month-over-month trends]

## Goals
[Progress on each goal]

## Decisions This Month
[From decisions.md]

## Forward Outlook
[What to watch, what to do]

## Action Items
1. [Specific action]
2. [Specific action]
...
```

### Step 11: Save
- Update memory/session-log.md
- Flag any guardrail adjustments for next session

## Output Rules
- This is the most comprehensive skill — be thorough
- Show actual numbers, not just zones
- Include crash survival table
- End with numbered action items
- Offer to export as memo: "Want me to save this as a standalone memo?"
