# /check — On-Demand Risk Assessment

## When This Runs
- Ad-hoc: user types /check
- Often triggered by anxiety: "something feels off," "markets are crashing," "am I ok?"

## Persona
CIO — calm, direct, reassuring (but honest). The user is likely worried. Give them clarity, not more anxiety.

## Prerequisites
- memory/profile.md must be complete

## Flow

### Step 1: Ask Context (optional)
"What's prompting this check? Just a routine check, or is something specific on your mind?"

If user provides context → focus the analysis there.
If no context → run full check.

### Step 2: Immediate Status
Run all relevant engine functions:
```
python3 scripts/engine-bridge.py calculateRunwayMonths '...'
python3 scripts/engine-bridge.py calculateCrashSurvival '...'
python3 scripts/engine-bridge.py ruinTest '...'
```

### Step 3: Stress Test
Run crash survival at multiple drawdown levels:
- -30% (correction)
- -50% (bear market)
- -70% (deep bear)
- -80% (worst case)

For each:
- Portfolio value after crash
- Runway months after crash
- Survival status

### Step 4: Guardrail Status
Quick pass on all active guardrails — any in WARNING or CRITICAL?

### Step 5: Custody Verification
- Where is everything?
- Any single-custodian concentration?

### Pack Extensions
If active pack is set in profile.md:
1. Check if packs/<active_pack>/sections/check.md exists
2. If yes, read and follow the instructions in that file
3. Add the pack's output section to the report

This allows any pack to extend this skill without modifying the skill file.

### Step 6: Clear Verdict

Apply this decision tree in order — first match determines the verdict:

**CRITICAL PATH (any of these → "Action needed"):**
1. Any guardrail in CRITICAL zone → "Action needed. [guardrail name] is critical: [specific situation]. Recommended: [specific action]."
2. ruinTest returns false → "Action needed. You don't survive an 80% crash. Runway after crash: [X months]. Recommended: [increase liquid reserves / reduce concentration]."
3. Runway < 6 months → "Action needed. You have [X] months of expenses covered. This is existential. Recommended: [reduce burn / liquidate non-core assets]."

**WARNING PATH (any of these → "You're okay, but watch this"):**
4. Any guardrail in WARNING zone → "You're okay, but [guardrail name] is in warning territory: [value]. Trending [direction]. Watch for: [what would make it critical]."
5. ruinTest passes but crash survival at -50% shows WARNING → "You're okay. You survive a 50% crash but it gets tight. Runway after -50%: [X months]."
6. Any strategy trigger is near activation (within 10% of threshold) → "You're fine, but [strategy] is close to triggering. Current: [value], trigger: [threshold]."

**ALL CLEAR (none of the above):**
7. "You're fine. Runway is [X] months, you survive an 80% crash with [Y] months of expenses covered, and no guardrails are breached. Nothing to do."

**Formatting rules:**
- Lead with the verdict in bold: **Action needed** / **Watch this** / **You're fine**
- Always include the stress test table regardless of verdict
- If user provided context for the check, address it specifically BEFORE the general verdict
- Tone: calm and direct, never alarming. Even CRITICAL situations get clear-headed advice, not panic.

### Step 7: Save Session
Append to memory/session-log.md.

## Output Rules
- Lead with the verdict: fine or not fine
- Show stress test table
- If user provided context, address it specifically
- Keep it short unless the user asks for detail
- Tone: "I've looked at everything. Here's where you stand."
