---
description: Fast session close for short/admin sessions — save context to NOW.md and MEMORY.md
---

# /session-close-quick

**Trigger:** `/session-close-quick` directly
**Purpose:** Close short sessions fast. Updates only what's essential for continuity.

---

## Workflow (4 Steps)

```
1.  Get timestamp          → Python day/time
1.5 Save task context      → If task worked on (conditional)
2.  Update NOW.md          → Last 3 sessions
3.  Update MEMORY.md       → Session record
4.  Update skill cadence   → If skills ran
```

---

## Step 1: Get Timestamp

```bash
python3 -c "from datetime import datetime; now = datetime.now(); print(now.strftime('%Y-%m-%d %A')); print('Morning' if now.hour < 12 else 'Afternoon' if now.hour < 17 else 'Evening' if now.hour < 21 else 'Night')"
```

Determine time of day: Morning / Afternoon / Evening / Night

Read `/Users/goenkas/Projects/timecell/NOW.md` to get current session number (parse "Session N" from Updated line, increment by 1). If NOW.md doesn't exist, start at Session 1.

---

## Step 1.5: Save Task Context (CONDITIONAL)

**Quick check:** Was a specific task or feature worked on this session?

**Detection:** Look for file path mentions, package names (engine/api/web/cli), GitHub issue references, or "working on..." mentions.

**If no task detected:** Skip to Step 2.

**If task detected:**
1. Note the task description and current state in the session summary
2. Ask: Complete or continuing?
   - **Complete** → note as done in session summary
   - **Continuing** → note "continuing next session" in summary

**Keep it fast:** No elaborate context files — just capture enough in the session summary to resume.

---

## Step 2: Update NOW.md

**File:** `/Users/goenkas/Projects/timecell/NOW.md`

1. Read current NOW.md (create if it doesn't exist)
2. Update the `**Updated:**` line with new session number and time
3. Update `**Last 3 sessions:**` — prepend new entry, keep only 3:

```markdown
# timecell — Current State

**Updated:** Session [N] — [Date] [Time of day]

**Last 3 sessions:**
1. [Date] [Time] (Session N) — [1-line summary of what happened this session]
2. [previous entry 1]
3. [previous entry 2]

**Active work:**
[What's currently in progress — update if changed this session]

**Next up:**
[What to work on next — update if changed this session]
```

**Summary format:** `[Package/area]: [What was done]. [Key outcome if any].`

Keep summaries to one line. No fluff.

If NOW.md doesn't exist, create it with the template above.

---

## Step 3: Update MEMORY.md

**File:** `/Users/goenkas/.claude/projects/-Users-goenkas-Projects-timecell/memory/MEMORY.md`

Create the `memory/` directory if it doesn't exist:
```bash
mkdir -p /Users/goenkas/.claude/projects/-Users-goenkas-Projects-timecell/memory/
```

1. If MEMORY.md doesn't exist, create with header:
```markdown
# timecell Project Memory

## Session Log

```

2. Count existing `### Session` headers, increment by 1
3. Append:

```markdown
### Session [N] — [Date] [Time of day]

**Topics:** [comma-separated — packages touched, features worked on]
**Decisions:** [key decisions, or "None"]

**Summary:**
[2-3 sentences of what happened]

**Skills run:** [list, or "None"]
**Status:** [what's complete, what's in progress]
```

---

## Step 4: Update Skill Cadence (Conditional)

**If no skills were run this session:** Skip. Report "No skills to track."

**If skills were run:**

1. Note which skills ran in the session summary (Step 3 already captures this)
2. If you maintain a skill cadence log at `/Users/goenkas/Projects/timecell/.claude/skill-cadence.md`:
   - Update "Last Run" to today for each skill run
   - Create the file if it doesn't exist

**Always include `/session-close-quick` itself.**

---

## Output

```
Quick Close — Session [N]

[1-line summary]

Updated: NOW.md, MEMORY.md
Cadence: [Updated N skills / No skills to track]

Session closed.
```

---

## When to Do a Fuller Close

If during this quick close you notice any of these, consider a fuller manual close instead:
- A significant architectural decision was made
- A new pattern was established that should persist
- A meaningful insight emerged about the codebase
- A complex bug was resolved with non-obvious root cause

If so, add a more detailed note to MEMORY.md manually before finishing.

---

## Integration Points

**Triggered by:**
- User directly runs `/session-close-quick`
- End of short admin or exploration sessions

**Triggers next:**
- None (terminal skill)

**Related files:**
- `/Users/goenkas/Projects/timecell/NOW.md` — Session continuity (in repo, visible to git)
- `/Users/goenkas/.claude/projects/-Users-goenkas-Projects-timecell/memory/MEMORY.md` — Persistent project memory (outside repo)

**Intentionally skipped (by design for quick mode):**
- Detailed context files per task
- Full architectural documentation updates
- Changelog or PR summaries

---

## Success Criteria

1. **NOW.md updated correctly** (session number incremented, last 3 entries maintained, readable at a glance)
2. **MEMORY.md updated** (session record appended with enough detail to resume tomorrow)
3. **Quality: Next session has continuity** (NOW.md + MEMORY.md together provide enough context to resume without re-reading code)

---

## Known Failure Modes

| Issue | Prevention |
|-------|------------|
| Session number drift | Always parse from NOW.md Updated line |
| NOW.md doesn't exist | Create with template |
| MEMORY.md directory doesn't exist | `mkdir -p` before writing |
| Quick mode misses important content | "When to Do a Fuller Close" section catches this |

---

*Ported from SandeepPKM session-close-quick.md: 2026-02-27. Key changes: removed PKM-specific steps (Journal/, Skill-Cadence.md, pkm_utils.py, OpenClaw signal, pkm_tasks.py). Replaced with timecell paths: NOW.md at /Users/goenkas/Projects/timecell/NOW.md and MEMORY.md at /Users/goenkas/.claude/projects/-Users-goenkas-Projects-timecell/memory/MEMORY.md. Simplified to 4 steps (removed journal and OpenClaw steps). Kept core logic: timestamp → task context → NOW.md → MEMORY.md → cadence.*
