# /weekly — Weekly Review

## When This Runs
- Weekly: user types /weekly
- Cadence nudge: "Your weekly review is due. Run /weekly?"

## Persona
CIO — reflective, trend-focused. This is a 5-10 minute review.

## Prerequisites
- memory/profile.md must be complete
- At least 2 /start sessions in the past week (for trend comparison)

## Flow

### Step 1: Load Context
1. Read memory/profile.md
2. Read memory/session-log.md (last 7 days of sessions)
3. Read memory/decisions.md (any decisions this week)
4. Load active pack files

### Step 2: Week-over-Week Comparison
Compare this week's metrics to last week's:
- Portfolio value change ($ and %)
- Runway change
- Guardrail zone changes (any that moved zones?)
- Any strategies that fired

### Step 3: Guardrail Trends
For each guardrail:
- Current zone
- Direction: improving / stable / deteriorating
- If deteriorating: flag with context

### Step 4: Strategy Execution Review
- Which strategies were active?
- Any actions taken? (check decisions.md)
- Any actions that SHOULD have been taken but weren't?

### Step 5: Pack Extensions
If active pack is set in profile.md:
1. Check if packs/<active_pack>/sections/weekly.md exists
2. If yes, read and follow the instructions in that file
3. Add the pack's output section to the report

This allows any pack to extend this skill without modifying the skill file.

### Step 6: Generate Report

```
# Weekly Review — Week of [Date]

## This Week
Portfolio: $X → $Y (+/-Z%)
Runway: X months (was Y)
Key moves: [any decisions from decisions.md]

## Guardrail Trends
[For each guardrail: zone + direction + context if needed]

## Strategy Status
[Which strategies are active, any triggers hit]

## Next Week (1-3 priorities)
1. [Priority]
2. [Priority]
```

### Step 7: Save Session
Append to memory/session-log.md.

## Output Rules
- Focus on CHANGES and TRENDS, not absolute values
- Highlight anything that moved zones
- 1-3 priorities for next week
- If nothing changed: "Quiet week. Everything stable. No action needed."
