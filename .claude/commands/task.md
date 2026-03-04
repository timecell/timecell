---
description: Work on a timecell task with context continuity across sessions - load, clarify, work, close
aliases: [focus]
---

# /task - Task Work Session

Pick a task, load prior context, clarify scope, work interactively, save context when done.

**Core UX:** Load task + context → clarify scope → work → close + save context.

**Context Continuity:** Task context persists in `/Users/goenkas/Projects/timecell/.claude/task-context/T[id].md` across sessions. When you return to a task days later, Claude loads the prior context automatically.

---

## Step 0: Load Project Context (REQUIRED)

Read these files first to understand the project:
- `/Users/goenkas/Projects/timecell/NOW.md` — Current state and active work
- `/Users/goenkas/Projects/timecell/CLAUDE.md` or `README.md` — Project overview (if exists)
- The relevant package `README.md` based on the task domain

**Purpose:** Context helps assess task priority, find the right package to work in, and ensure work aligns with current project state.

---

## Step 1: Load Task + Context

Accept one of:
1. **Task ID** — `T42`, `42` → Look up context file
2. **GitHub issue number** — `#42` → Check if context file exists
3. **Freeform text** — New work description
4. **No input** — Ask user what to work on, or read NOW.md "Next up" section

**If Task ID / Issue:**
- Check for context file at `/Users/goenkas/Projects/timecell/.claude/task-context/T{id}.md`
- If no context file, treat as new task with that ID

**If no input:**
- Read `NOW.md` → "Next up" section
- Suggest it, let user confirm or redirect

### Step 1.5: Load Prior Context (if exists)

**Check for context file:**
```bash
ls /Users/goenkas/Projects/timecell/.claude/task-context/T{id}.md 2>/dev/null
```

**If context file exists:**
1. Read `T{id}.md`
2. Display summary and pending items:
   ```
   T{id}: [Task Title]

   Previous context loaded:
   > [Summary section content - 2-3 sentences]

   Pending:
   - [ ] [pending item 1]
   - [ ] [pending item 2]
   ```

**If no context file:**
```
T{id}: [Task Title]
[No prior context - first session on this task]
```

---

## Step 2: Clarify

Assess the task on three dimensions (judgment-based):

| Dimension | Low (1) | Medium (2) | High (3) |
|-----------|---------|------------|----------|
| **Verb specificity** | Vague ("handle", "sort out") | Moderate ("research", "check") | Specific ("add IRR calculation to engine, expose via API") |
| **Success criteria** | None stated | Implicit from context | Explicit in task |
| **Scope** | Unclear boundaries | Partially clear | Bounded and finite |

**Based on total clarity (3-9):**
- 7-9: Skip clarification, start working
- 4-6: Ask 1-2 focused questions
- 1-3: Ask 2-3 questions to establish scope

**Key clarifying questions for timecell tasks:**
- Which package does this belong in? (engine/api/web/cli)
- Is this a new feature or modifying existing behavior?
- Does this change the public API of `@timecell/engine`?
- Are there cross-package implications?

**Questions should offer options, not be open-ended.**

After clarification, state the goal:
```
Working on: "[task title]"
Package: [engine/api/web/cli]
Goal: [clear 1-sentence goal]
Done when: [success criteria]
```

---

## Step 3: Work

Start working on the task interactively. Do whatever the task requires:
- Read and understand relevant source files
- Write code, tests, or configuration
- Run builds and tests
- Look up documentation or specs
- Make decisions with user input
- Track subtasks in `## Pending` section of context file (not as separate tasks)

**Useful commands during work:**
```bash
# From /Users/goenkas/Projects/timecell
npm run build --workspace=packages/engine    # Build engine
npm run build --workspace=packages/api       # Build API
npm run build --workspace=packages/web       # Build web
npm test                                      # Run all tests
npm run lint                                  # Lint check
```

**Background research (optional):**
If sub-task is pure research and user wants to work on something else simultaneously:
```
"Want me to research [topic] in background while we continue?"
```
If yes: launch a Task sub-agent with `run_in_background=true`. Notify when done.

**Stay interactive.** Ask the user when decisions are needed. Don't assume — check.

---

## Step 4: Close + Save Context

When user says "done", "close", "that's it", or the work is complete:

### 4.1: Save Task Context

**Create or update `/Users/goenkas/Projects/timecell/.claude/task-context/T{id}.md`:**

```markdown
# T{id}: [Task Title]

**Package:** [engine/api/web/cli/cross-package]
**Status:** [Active | Waiting | Done]
**Last Session:** YYYY-MM-DD

## Summary
[Claude-generated 2-3 sentence summary of current state]

## Pending
- [ ] [Any waiting items with context]
- [ ] [Scheduled follow-ups]

## Session Log

### YYYY-MM-DD — Session N
**Goal:** [what we aimed to do this session]
**Done:** [what was accomplished]
**Decisions:** [key decisions made — especially architecture/API choices]
**Next:** [what to do next session]
**Refs:** [file paths changed, PR links, issue links if any]

[... prior sessions preserved below ...]
```

Create the directory if needed:
```bash
mkdir -p /Users/goenkas/Projects/timecell/.claude/task-context/
```

**Context extraction rules:**
- **Summary:** Synthesize across all sessions, not just latest
- **Pending:** Extract from conversation (waiting for reviews, blocked on dependencies)
- **Session log:** Append new session, preserve prior sessions
- **Refs:** Capture file paths changed, commit hashes, PR links for future lookup

### 4.2: Update NOW.md

If the task's outcome changes what's "active" or "next up", update `/Users/goenkas/Projects/timecell/NOW.md`:

```markdown
**Active work:**
[Update if this task is now in progress or newly complete]

**Next up:**
[Update if priorities shifted]
```

### 4.3: Determine Next State

**Default: keep task open.** The task stays open as a touchpoint. Subtasks and follow-ups live in the context file.

**Mark done only when all work is complete:**
- Context file updated with final state
- All tests passing
- Code committed (or PR opened)

**Only create NEW task entries for:**
- Follow-ups that require action on a different day
- Work that needs to be handed to someone else
- Items with hard deadlines

### 4.4: Report

```
Closed: "[task title]"

Outcome: [1-2 sentences]
Package: [engine/api/web/cli]
Commits: [list if any]
Follow-ups: [list if any]
Context saved: /Users/goenkas/Projects/timecell/.claude/task-context/T{id}.md
```

---

## Step 5: Archive Routing (on task completion only)

**When task is marked done**, ask about context disposition:

```
Task complete. What to do with the accumulated context?

1. Keep as reference — rename to descriptive title, keep in task-context/
2. Archive — move to .claude/task-context/archive/
3. Delete — context served its purpose
```

**Smart defaults:**

| Task Type | Default | Rationale |
|-----------|---------|-----------|
| Algorithm/calculation work | Keep as reference | Implementation notes valuable |
| Multi-session feature | Keep as reference | Process + decisions worth keeping |
| Quick bug fix | Archive | Execution details rarely needed |
| Config/dependency update | Delete | No substantive content |

---

## Multiple Tasks

User can work on multiple tasks in one session. After closing one:
```
Work on another task? (task ID, description, or "done for now")
```

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Task ID not found | "No context found for T{id}. Starting fresh — what's the task?" |
| User never says "done" | Auto-save context on session close |
| Build fails during work | Report error, help debug before moving on |
| Cross-package dependency issue | Check workspace links, may need engine build first |

---

## Relationship to Other Skills

| Skill | Difference |
|-------|------------|
| `/plan` | Plans implementation approach. `/task` does the actual work. |
| `/vibe` | Fully autonomous pipeline with QA agents. `/task` is interactive, you stay involved. |
| `/session-close-quick` | Closes the session and saves session summary. `/task` saves task-specific context. |

---

## Integration

**Triggered by:**
- User: `/task [task ID or description]`
- User: `/task` (no arg) → reads NOW.md "Next up" and asks

**Saves to:**
- `/Users/goenkas/Projects/timecell/.claude/task-context/T{id}.md` (task-specific context)
- `/Users/goenkas/Projects/timecell/NOW.md` (if active work / next up changes)

---

## Context File Location

| State | Location |
|-------|----------|
| Active task | `/Users/goenkas/Projects/timecell/.claude/task-context/T{id}.md` |
| Completed → Archive | `/Users/goenkas/Projects/timecell/.claude/task-context/archive/T{id} - [title].md` |

---

## When NOT to Use This

- Quick one-off questions → just ask Claude directly
- Fully autonomous feature implementation → use `/vibe`
- Pure planning → use `/plan`

This skill is for **interactive task work** that benefits from structured scope, context continuity, and closure.

---

## Success Criteria

1. **Context persists across sessions** (return to T42 tomorrow, prior work is loaded)
2. **Task scope is clear before work begins** (clarification prevents wasted effort)
3. **Work produces a concrete outcome** (artifact, decision, commit, or clear next step)
4. **Follow-ups are captured** (nothing falls through cracks)
5. **Context is useful** (summary is accurate, pending items are actionable)

---

## Known Failure Modes

| Issue | Resolution |
|-------|------------|
| Context file grows very large | Keep Summary section synthesized; full log preserved but Summary reflects current state |
| Cross-package task unclear which to edit | Ask user which package, or use `/plan` first to map the changes |
| Task stays "active" indefinitely | Add specific done criteria at Step 2; review pending items each session |

---

*Ported from SandeepPKM task.md: 2026-02-27. Key changes: removed SQLite task DB (pkm_tasks.py, pkm_dispatch.py), replaced with file-based context at .claude/task-context/. Removed outreach-pending.log step, journal logging, and draft/review/ creation. Replaced personal context loading (Personal Context.md, 2026 OS) with timecell project context (NOW.md, package READMEs). Kept core workflow: load → clarify → work → close → archive.*
