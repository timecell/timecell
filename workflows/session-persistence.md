# Session Persistence (Internal Workflow)

## Purpose
Save and restore session context across sessions. Every skill that modifies state should call this at the end.

## Save (End of Session)

### 1. Update session-log.md
Append entry:
```
## [Date] — [Skill Name]

### What Happened
[Brief summary of the session]

### Key Numbers
- Portfolio: $X
- Runway: Y months
- Guardrails: Z warnings, W critical

### Decisions Made
[Any changes logged to decisions.md]

### Next Actions
[What to follow up on]
```

Keep only last 5 sessions in session-log.md (archive older ones).

### 2. Update decisions.md (if any changes)
Append:
```
## [Date] — [Decision]
- context: [what prompted this]
- action: [what was changed]
- reasoning: [why]
- source: [which skill]
```

### 3. Update profile.md (if any values changed)
- Update computed fields (runway_months)
- Update any user-modified guardrails
- Update `Updated:` date

## Restore (Start of Session)

### 1. Read session-log.md
Load last 3 sessions for context.

### 2. Check for stale data
If profile.md Updated date > 30 days: flag as stale.
If any entity files Updated > 90 days: flag for review.

### 3. Detect cadence
Check when each cadence skill was last run:
- /start: should be daily
- /weekly: should be weekly
- /monthly: should be monthly

Flag overdue cadences.
