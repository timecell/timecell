# /plan — Iterative Plan Development

**Enforce iterative planning with summary presentation.**

---

## Purpose

Meta-skill that ensures plans are:
1. Iterated until converged (no major new insights)
2. Presented in summary format with confidence flagging
3. Approved before execution

**Why a skill vs CLAUDE.md instructions:** CLAUDE.md is guidance. This skill is explicitly called and enforced.

---

## Usage

```
/plan [task or topic]
```

**Examples:**
- `/plan add crash-survival score calculation to engine`
- `/plan refactor API endpoint for portfolio analysis`
- `/plan add dark mode to web package`

---

## Context Loading

**None required.** This is a meta-skill for planning methodology. It doesn't process domain content or require personal context.

The plan itself will load appropriate context based on the topic being planned.

---

## Instructions

### 1. Parse Input

Extract the task/topic from user input. If vague, ask clarifying question.

### 2. Classify Plan Size

| Size | Criteria | Minimum Iterations | Checkpoint Every |
|------|----------|--------------------|------------------|
| **Major** | 5+ files, creates skills, modifies instruction files, new patterns, cross-package changes | 3 | 3 iterations |
| **Standard** | 2-4 files, routine changes, single-package work | 2 | 2 iterations |
| **Simple** | 1 file, minor tweak | 2 | 2 iterations |

**Hard rule:** ALL plans require minimum 2 iterations, regardless of size. A single-pass plan is not a reviewed plan.

### 2.5. Skill Creation Check

**If plan creates `.claude/commands/*.md` file:**

Check project CLAUDE.md → "Skill Creation Workflow" for authoritative trigger/skip conditions (if it exists).

1. If ANY trigger applies (complex workflow, MCP integration, destructive actions, recurring cadence):
   ```
   New skill with [trigger]. Consider running /skill-audit after creation.
   - [y] Continue with planning
   - [skip] Continue (document rationale in Known Failure Modes)
   ```

2. If user says "skip": Note rationale, proceed with planning.

### 3. Initial Plan Draft

Create first draft addressing:
- What files to modify (with package paths, e.g., `packages/engine/src/...`)
- What changes to make
- Success criteria

### 4. Iterate Until Convergence

**For each iteration, run Review Checklist:**

1. **Requirements Alignment** — Original intent preserved? Scope creep?
2. **Blindspots** — What could go wrong? Error handling?
3. **System Consistency** — Conflicts with existing patterns across packages?
4. **Over-engineering** — Simpler solution available?
5. **Verification** — Success criteria clear?
6. **Dependencies** — Prerequisites exist? Package interdependencies handled?

**After each iteration, log:**
```
Plan Review — Iteration X
Passed: [categories]
Issues: [list with fixes]
Status: [Major improvements / Converged]
```

**HARD GATE:** You MUST show iteration markers for at least 2 iterations in your output BEFORE presenting the summary. If only 1 iteration marker exists, STOP and run another review pass. No exceptions.

**Convergence criterion:** Last iteration yields only minor polish (wording, formatting).

**Convergence Verification (subagent reviewer):**

When you believe convergence is reached (minimum 2 iterations completed):

1. Spawn reviewer:
   ```
   Task tool: subagent_type="general-purpose", model="haiku"
   Prompt: You are a plan convergence reviewer. Read the following plan with all iteration markers and determine if it has converged (no major new insights would emerge from another review pass). Reply with CONVERGED or NOT_CONVERGED followed by any remaining blindspots.

   Plan: {plan_with_all_iteration_markers}
   ```
2. Parse output:
   - **CONVERGED:** Proceed to Step 5
   - **NOT_CONVERGED:** Run exactly 1 more iteration addressing flagged blindspots, then proceed to Step 5 regardless (prevents infinite loops)
3. **On timeout (30s) or failure:** Accept convergence claim, proceed to Step 5

**Checkpoint:** After 3 iterations with ongoing improvements, ask:
> "Completed 3 iterations. Continue iterating? (cost checkpoint)"

### 5. Present Summary

When converged, present using Plan Presentation format:

```markdown
**Plan: [Brief Title]**

**Summary:** [1-2 sentences]
**Size:** [Simple/Standard/Major] | **Files:** [N] | **Iterations:** [X]

---

**Needs Your Input:** [N items]

| # | Decision | Options | My Lean |
|---|----------|---------|---------|
| 1 | [Decision] | A / B | A |

---

**Steps:** [N total]
1. [Critical step]
2. [Important step]
3. [Routine step]

---

Awaiting your input on the above before proceeding.
```

**Step Importance:**
- Critical — Irreversible, new patterns, cross-package changes, modifies package exports
- Important — Key logic, multi-file, API surface changes
- Routine — Standard patterns, boilerplate, test updates

**Confidence Flagging (triggers "Needs Your Input"):**
- No existing pattern to follow in the codebase
- Multiple valid approaches
- Trade-off decisions (e.g., engine vs API layer placement)
- User preference matters

**If no items need input:** Skip that section entirely AND proceed directly to execution (no approval prompt).

### 6. Handle Response

**If "Needs Your Input" section was empty:** Skip this step — execution already started in Step 5.

**If "Needs Your Input" had items:** Wait for user response, then:

| Response | Action |
|----------|--------|
| Answers to questions | Incorporate answers, proceed to execution |
| `details` | Show full plan with reasoning, code samples, alternatives |
| `n` / `no` | Ask what to change, revise plan |

### 7. Execute and Report

After approval:
1. Execute each step
2. Report progress
3. Show completion summary

---

## Error Handling

**If task is too vague:**
```
Need more context. What specifically do you want to plan?
```

**If plan keeps growing (5+ iterations, no convergence):**
```
Plan hasn't converged after 5 iterations. Options:
1. Proceed with current version
2. Simplify scope
3. Break into smaller plans
```

---

## Integration Points

**Triggered by:**
- `/plan [topic]` command
- User saying "plan this iteratively"
- `/vibe` when `--plan` flag is set

**References:**
- Project `CLAUDE.md` (if present) for project-specific patterns and conventions

---

## Subagent Usage

**When launching a planning subagent via Task tool, use this exact pattern:**

```
Read and follow /Users/goenkas/Projects/timecell/.claude/commands/plan.md exactly.

Plan: [topic]

Requirements:
- Iterate until convergence per Section 4 (multiple iterations required)
- Present summary format per Section 5
- DO NOT execute until user approves
```

**Why this matters:** Custom prompts often skip iteration. Explicitly referencing this file ensures the full methodology is followed.

**Note:** Plan now auto-executes after convergence unless there are clarifying questions. Only add approval requirement if you specifically need user sign-off on all plans.

---

## Relationship to Other Skills

| This Skill | `/vibe` |
|------------|---------|
| Explicitly called, enforced | Calls /plan when --plan flag or thorough mode auto-triggers |
| Always iterates + presents summary | Uses plan output as ARCHITECTURE_PLAN block for Coder |
| User can invoke anytime | Planning is one stage in the vibe pipeline |

**Use /plan when:** You want guaranteed iterative planning with summary output before coding begins.

---

## Logging

**No logging required.** This is a meta-skill — the actual work done after plan approval is logged by those skills/workflows.

---

## Success Criteria

1. **Plan converges** (no major new insights in final iteration)
2. **Summary format used** (not wall of text)
3. **Confidence flagged** (ambiguous decisions surfaced to user)
4. **Auto-execute when no questions** (proceed immediately if "Needs Your Input" is empty)
5. **Step importance tiers shown** (communicate priority clearly)

---

## Known Failure Modes

| Issue | Resolution |
|-------|------------|
| Plan scope too large | Break into phases, plan first phase only |
| User wants to skip iteration | Respect "just do it" — skip to execution |
| Convergence takes too long | Checkpoint at 3 iterations, ask to continue |

---

*Ported from SandeepPKM: 2026-02-27*
