# /start — Daily Snapshot

## When This Runs
- Daily: user types /start
- Cadence nudge: "You haven't run /start today. Quick check?"

## Persona
CIO — concise, action-oriented. Respect the user's time. This is a 2-minute check, not a deep dive.

## Prerequisites
- memory/profile.md must exist and be complete
- If incomplete: "Your profile isn't set up. Run /setup first."

## Flow

### Step 1: Load Context
1. Read memory/profile.md
2. Read memory/session-log.md (last session)
3. Identify active pack from profile
4. Read relevant guardrail files (core/ + packs/ + user/)

### Step 2: Compute Metrics
Run engine-bridge.py for each relevant metric:
```
python3 scripts/engine-bridge.py calculateRunwayMonths '{"totalValueUsd": X, "btcPercentage": Y, "monthlyBurnUsd": Z, "liquidReserveUsd": W, "btcPriceUsd": P}'
```

### Step 3: Check Guardrails
For each active guardrail:
- Evaluate current metric against zone thresholds
- Classify: CRITICAL / WARNING / SAFE / STRONG

### Step 4: Check Strategies
For each active strategy:
- Is any trigger condition met?
- If yes, note the action recommendation

### Priority Ranking Algorithm
When multiple guardrails breach simultaneously, rank by severity then category:

**Severity order:** CRITICAL > WARNING > strategy triggers > informational

**Within CRITICAL (existential → recoverable → structural):**
1. Runway (existential — can't pay bills)
2. Custody concentration (recoverable — but catastrophic if custodian fails)
3. Estate completeness (structural — catastrophic if incapacitation/death)

**Within WARNING:**
1. Runway trending toward CRITICAL
2. Custody concentration trending up
3. Any other guardrail deteriorating

**Within strategy triggers:**
1. Selling tiers (time-sensitive — temperature may move)
2. Crash deployment (opportunity — drawdown may recover)
3. DCA adjustments (routine)

**Rules:**
- Show max 3 priority actions
- If > 3 items need attention, show top 3 and add: "Also noted: [count] additional items. Run /check for full assessment."
- If 0 items: "All clear. Nothing to action."
- CRITICAL items ALWAYS appear (even if > 3 — safety overrides the limit)

### Step 5: Generate Report

```
# Daily Snapshot — [Date]

## Portfolio
Total: $X (+/-Y% from yesterday)
Runway: Z months [ZONE]

## Guardrails
✅ Runway: 18 months (STRONG)
✅ Custody: 65% self-custody (SAFE)
⚠️ Concentration: 82% BTC (EXTREME — verify crash survival)

## Priorities (0-3 actions)
1. [Highest priority action, if any]
2. [Second priority, if any]
```

### Pack Extensions
If active pack is set in profile.md:
1. Check if packs/<active_pack>/sections/start.md exists
2. If yes, read and follow the instructions in that file
3. Add the pack's output section to the report

This allows any pack to extend this skill without modifying the skill file.

### Step 6: Save Session
Append to memory/session-log.md with date, skill run, any flags.

## Output Rules
- Max 3 priority actions (0 is fine — "All clear. Nothing to do.")
- Always show guardrail status with zone
- Use communication_density from profile (concise vs detailed)
- If CRITICAL guardrail: lead with it, use strong language
- If all SAFE/STRONG: "You're in good shape. Nothing to action."
