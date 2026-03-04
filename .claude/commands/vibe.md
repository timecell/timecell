---
description: Orchestrate autonomous coding on timecell packages with full quality pipeline
---

# /vibe — Coding Subagent Orchestrator

**Trigger:** `/vibe [package] "[task]"` or `/vibe "[task]"` (auto-detect from cwd)

**Purpose:** Orchestrate autonomous coding with mandatory quality gates: build verification, code review, testing, and security audit.

---

## Usage

```
# Specify package explicitly:
/vibe engine "add crash-survival score calculation"
/vibe api "add portfolio stress-test endpoint"
/vibe web "implement dark mode toggle"
/vibe cli "add --scenario flag to run command"

# From project root (specify package):
/vibe engine "fix IRR calculation edge case" --fast
/vibe web "add new scenario builder page" --thorough

# Full project task (cross-package):
/vibe "update engine API and expose via REST endpoint"
```

**Flags (optional overrides — auto-detected by default):**
- `--fast`: Fast mode (skip review/test/security agents, still runs build check)
- `--thorough`: Force thorough mode (stricter review + full security audit)
- `--review`: Pause after QA for manual user testing before push
- `--clarify`: Force detailed clarification questions
- `--yolo`: Skip clarification entirely
- `--plan`: Force architecture planning step before coding
- `--no-plan`: Skip planning even for complex tasks (`--no-plan` wins over `--plan`)

**Auto-mode detection (when no flag given):**

Analyze the task description and select mode automatically:

| Signal | Mode | Plan? | Pipeline |
|--------|------|-------|----------|
| Typo, version bump, rename, one-file fix, "fix X in Y" | **fast** | No | Coder → Build Check → Auto-push |
| Feature, refactor, new endpoint, multi-file change | **default** | No (suggest `--plan` if ambiguous scope) | Clarify → Coder → Build Check → Parallel QA → Fix → Auto-push |
| UI change, new page, interactive feature, layout rework | **default + suggest --review** | No | Clarify → Coder → Build Check → Parallel QA → Fix → **User Test** → Push |
| Auth, security, data migration, schema change, new cross-package system | **thorough** | **Yes (auto)** | **Plan →** Coder → Build Check → Parallel QA (strict) → Fix → Auto-push |

**Show the auto-detected mode before proceeding:**
```
Mode: default (new feature) — override with --fast or --thorough
Mode: thorough (schema change) + planning — override with --no-plan
```

**Auto-suggest --review:** When detecting UI/interactive signals, suggest but don't force:
```
Mode: default (UI change) — suggest --review for manual testing before push
Add --review? [y/n]
```

User can override by saying "use thorough" or passing a flag.

---

## Pipeline Overview

```
1. Parse input (package + task + mode)
2. Validate package exists
3. Load package context
3.5 Architecture Plan (if thorough/--plan, skip Clarify)
4. Clarify requirements (if needed, skipped when planning)
5. Spawn Coder agent (worktree isolated)
5.5 Merge Coder worktree back to main
6. Build/Lint Check (deterministic — must pass)
6.5 Start Dev Server (for web smoke tests if applicable)
7. If not --fast: Parallel QA agents
   ├── Reviewer (code quality, patterns, UI/UX)
   ├── Tester (run tests, check coverage)
   └── Security Auditor (OWASP, secrets, injection)
8. Merge findings — PASS or NEEDS_FIXES
9. If issues: Spawn Fixer → Build Check → Re-review
9.5 If --review: Pause for user testing (before push)
10. Auto-push to remote
11. Report summary with all quality gate results
```

**Model selection per agent** (uses Task tool `model` parameter):

| Agent | Model | Rationale |
|-------|-------|-----------|
| Planner (arch) | `opus` | Architecture decisions — codebase exploration, iteration, convergence |
| Coder | `opus` | Most complex — implements features, writes tests |
| Reviewer | `haiku` | Pattern matching — style, quality, UI checks |
| Tester | `haiku` | Deterministic — run tests, check coverage |
| Security | `opus` | Subtle judgment — exploit reasoning, supply chain risk |
| Fixer | `sonnet` | Applying known fixes — good reasoning at lower cost |

---

## Project Registry

| Package | Path | Stack | Build Command | Dev URL |
|---------|------|-------|---------------|---------|
| `engine` | `/Users/goenkas/Projects/timecell/packages/engine` | TypeScript, pure logic | `npm run build --workspace=packages/engine` | N/A (library) |
| `api` | `/Users/goenkas/Projects/timecell/packages/api` | Fastify + TypeScript | `npm run build --workspace=packages/api` | `http://localhost:3737` |
| `web` | `/Users/goenkas/Projects/timecell/packages/web` | React + Vite + Tailwind | `npm run build --workspace=packages/web` | `http://localhost:3738` |
| `cli` | `/Users/goenkas/Projects/timecell/packages/cli` | TypeScript CLI | `npm run build --workspace=packages/cli` | N/A (CLI) |
| `root` | `/Users/goenkas/Projects/timecell` | Monorepo root | `npm run build` | N/A |

**Full project root:** `/Users/goenkas/Projects/timecell`

---

## Context Loading

**Required:** Read the package's own context file. Priority order:
1. `packages/{name}/CLAUDE.md`
2. `packages/{name}/README.md`
3. `packages/{name}/package.json` (stack detection fallback)

Also read the root `CLAUDE.md` if it exists.

**Build context block for agents:**
```
PROJECT: timecell
PACKAGE: [package name]
PATH: [package full path]
STACK: [from package.json scripts + dependencies]
CONTEXT:
[contents of context file]
```

---

## Step 1: Parse Input & Detect Package

Extract from user input:
- `package`: Package name (engine, api, web, cli) or "root" for cross-package tasks
- `task`: The coding task description (quoted or unquoted)
- `mode`: --fast, --thorough, or default

**Package detection (in order):**

1. **Explicit name given** → Look up in Project Registry above
2. **No name given** → Analyze the task:
   - Pure calculation/logic → `engine`
   - REST endpoint / server → `api`
   - UI / React component → `web`
   - Command-line tool → `cli`
   - Touches multiple packages → `root` (use monorepo build)
3. **If ambiguous:** Ask user which package

**If explicit package not found:**
```
Package "[name]" not in registry. Available: engine, api, web, cli
```

---

## Step 2: Load Package Context

Read the package's context file (priority order listed in Context Loading section above).

**Build context block for agents:**
```
PROJECT: timecell
PACKAGE: [name]
PATH: /Users/goenkas/Projects/timecell/packages/[name]
STACK: [stack]
CONTEXT:
[contents of context file]
```

---

## Step 3: Clarify Requirements

**Skip if:** `--fast` or `--yolo` flag set

**Purpose:** Resolve ambiguity before coding to avoid rework.

**Lightweight (default):**
- Analyze task for ambiguous terms
- Ask 2-3 targeted questions
- Questions should be quick (multiple choice when possible)

**Detailed (--clarify or --thorough):**
Ask across these categories:

| Category | Sample Questions |
|----------|-----------------|
| **Scope** | What's included? What's explicitly NOT included? |
| **UI/UX** | Where does it appear? How does user interact? (web tasks) |
| **Data** | What state needs persistence? Where? |
| **Package boundary** | Should this logic live in engine (pure) or api (server)? |
| **Integration** | Other packages affected? Need to update engine exports? |

**No clarification needed for:**
- Bug fixes with clear reproduction
- "Fix typo in X"
- "Update dependency Y to version Z"

---

## Step 3.5: Architecture Plan

**Skip if:** `--fast`, `--no-plan`, or auto-detection says no planning needed.

**When planning runs, Step 3 (Clarify) is skipped** — the Plan subagent handles clarification as part of its codebase exploration.

**Triggers:** Auto-detected thorough mode (auth, security, schema, cross-package system) OR explicit `--plan` flag.

**Invocation:** Use Task tool:
```
subagent_type: "general-purpose"
model: "opus"
prompt: |
  Read and follow /Users/goenkas/Projects/timecell/.claude/commands/plan.md exactly.

  PROJECT: timecell
  PACKAGE: {package_name}
  PATH: {package_path}
  STACK: {stack}
  PACKAGE_CONTEXT: {contents of package context file}

  Plan: {task_description}

  Requirements:
  - Explore the package codebase at {package_path}
  - Iterate until convergence per Section 4
  - Return converged plan as plain text (files to modify, approach, edge cases, order of changes)
  - Surface any clarifying questions — prefix with NEEDS_INPUT:
  - Do NOT execute — return the plan only
```

**After subagent returns:**

1. If output contains `NEEDS_INPUT:` lines → present to user, then re-run plan with answers appended
2. Converged plan prepended to Coder prompt as `ARCHITECTURE_PLAN:` block

**Error handling:** If Plan subagent fails or times out → warn user, proceed to Coder without plan (fail-open).

---

## Step 4: Spawn Coder Agent

**Use Task tool with:**
- `subagent_type`: "general-purpose"
- `model`: "opus"
- `isolation`: "worktree" — Coder works in isolated git worktree (all packages are in a tracked git repo)
- `run_in_background`: true
- Prompt: Include project context + task + architecture plan (if any)

**Worktree usage:** All timecell packages are in a tracked git repo at `/Users/goenkas/Projects/timecell`. Always use worktree isolation.

**Coder agent instructions summary:**
1. Understand the package structure (read README/CLAUDE.md, explore `src/`)
2. Implement the requested feature/fix
3. Write tests (best-effort — vitest for engine/api, component tests for web)
4. Create atomic commits with clear messages
5. Respect monorepo patterns (import from `@timecell/engine` not relative paths across packages)
6. DO NOT push (orchestrator handles push)
7. Write summary of changes to output

**Wait for completion** using TaskOutput tool.

---

## Step 4.5: Merge Coder Worktree

**Only runs if Coder made changes** (worktree branch returned in Task result).

```bash
cd /Users/goenkas/Projects/timecell && git merge {coder_branch} --no-edit
```

**If merge fails:**
- Report conflict to user
- Do NOT auto-resolve
- Stop pipeline

**If merge succeeds:** Continue to Build Check.

---

## Step 5: Build/Lint Check (Deterministic)

**ALWAYS runs — even in --fast mode.**

Run the package-appropriate build command:

| Package | Build Command | What It Catches |
|---------|---------------|-----------------|
| `engine` | `cd /Users/goenkas/Projects/timecell && npm run build --workspace=packages/engine` | TypeScript errors, broken exports |
| `api` | `cd /Users/goenkas/Projects/timecell && npm run build --workspace=packages/api` | TypeScript errors, missing imports |
| `web` | `cd /Users/goenkas/Projects/timecell && npm run build --workspace=packages/web` | Vite build errors, TypeScript errors |
| `cli` | `cd /Users/goenkas/Projects/timecell && npm run build --workspace=packages/cli` | TypeScript errors |
| `root` | `cd /Users/goenkas/Projects/timecell && npm run build` | All packages |

**Also run lint:**
```bash
cd /Users/goenkas/Projects/timecell && npm run lint
```

**If build/lint fails:**
- Report the error output
- Send back to Coder agent with error details (counts as a fix cycle)
- Coder fixes → re-run build check
- If build fails again after fix, stop and report to user

---

## Step 5.5: Start Dev Server (for web smoke tests)

**Only runs for `web` or `api` packages when not --fast.**

| Package | Start Command | Dev URL |
|---------|---------------|---------|
| `web` | `cd /Users/goenkas/Projects/timecell && npm run dev --workspace=packages/web` | `http://localhost:3738` |
| `api` | `cd /Users/goenkas/Projects/timecell && npm run dev --workspace=packages/api` | `http://localhost:3737` |

Start in background with `run_in_background: true`.

**Health check:** Poll up to 15 seconds:
```bash
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code}" {dev_url} | grep -q 200 && break; sleep 1; done
```

If server doesn't start, warn and continue — Tester falls back to build/import checks only.

**Kill after Step 7** (Merge Findings) using TaskStop.

---

## Step 6: Parallel QA Agents (if not --fast)

**Spawn three agents in PARALLEL using Task tool.**

### 6a: Reviewer Agent
- `model`: "haiku"
- `run_in_background`: true
- **Focuses on:** Code quality, TypeScript patterns, monorepo conventions, UI/UX (for web tasks)
- **Context:** Git diff + package context + timecell conventions (workspace imports, biome linting rules)

### 6b: Tester Agent
- `model`: "haiku"
- `run_in_background`: true
- **Command:** `cd /Users/goenkas/Projects/timecell && npm test`
- **Focuses on:** Running vitest, verifying tests pass, checking coverage gaps for new code
- **For web:** Browser smoke tests on changed routes via dev server

### 6c: Security Auditor Agent
- `model`: "opus"
- `run_in_background`: true
- **Focuses on:** API authentication gaps, input validation, secrets in code, dependency vulnerabilities
- **Extra attention:** User financial data handling (this is a portfolio/crash-survival tool — data integrity is critical)

**Wait for all three** using TaskOutput tool.

**In --thorough mode:** Pass `MODE: thorough` to reviewer (stricter — include MEDIUM issues).

---

## Step 7: Merge Findings

Collect results from all three agents and produce a unified verdict.

**Kill dev server** before proceeding.

**Confidence filtering:** Only include issues with confidence >= 70. In `--thorough` mode, lower threshold to >= 50.

**PASS if:** All agents return PASS / no CRITICAL or HIGH issues above confidence threshold.

**NEEDS_FIXES if:** Any agent returns NEEDS_FIXES or CRITICAL/HIGH issues above threshold.

---

## Step 8: Spawn Fixer Agent (if issues found)

**If merged verdict is NEEDS_FIXES:**

Spawn Fixer agent with:
- `model`: "sonnet"
- Original task context
- Merged findings from QA agents
- Instruction to fix issues and commit

**After Fixer completes:**
1. Re-run Build Check (Step 5)
2. If passes, re-run only the agents that returned NEEDS_FIXES
3. Merge results again

**Circuit breaker:** Max 2 fix cycles. After that, report remaining issues to user, push current state.

```
2 fix cycles completed. Remaining issues:
1. [issue description]

Pushing current state. Please review manually.
```

---

## Step 8.5: Human Review Gate (if --review)

**After QA passes, if `--review` flag is set:**

```
Ready for manual testing

**Changes:**
- [file1]: [description]

**What to test:**
- [test instruction from Coder output]

**Check at:** http://localhost:3738 (web) or http://localhost:3737 (api)

Quality gates all passed. Try it out and let me know.
```

**Wait for user response:**

| Option | Action |
|--------|--------|
| Looks good — push it | Proceed to Auto-Push |
| Needs changes | User provides feedback → Fixer → build check → re-pause |

Max 2 feedback cycles, then push with warning.

---

## Step 9: Auto-Push

```bash
cd /Users/goenkas/Projects/timecell && git push origin HEAD
```

**If push fails:**
- Report error to user
- Do NOT auto-resolve conflicts
- Leave for manual intervention

---

## Step 10: Report Summary

```
/vibe complete: timecell/[package]

**Task:** [original task]
**Mode:** [default/fast/thorough]

**Changes:**
- [file1]: [description]

**Commits:**
- abc1234: [message]

**Quality Gates:**
- Plan:     CONVERGED [or SKIPPED]
- Build:    PASSED
- Lint:     PASSED
- Review:   PASSED [or SKIPPED (--fast)]
- Tests:    PASSED (X passed, 0 failed) [or SKIPPED]
- Security: PASSED [or SKIPPED]
- Fix cycles: 0 [or N]

**Pushed to:** origin/[branch]
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Package not recognized | Show available packages, suggest correct one |
| Context file missing | Warn, proceed without context |
| Plan agent fails/times out | Warn, proceed to Coder without plan (fail-open) |
| Coder agent fails | Report error, do not proceed |
| Build check fails twice | Stop, report build errors to user |
| QA agent fails (crashes) | Warn, continue with other agents' results |
| All QA agents fail | Warn, push with notice (degrade gracefully) |
| Push fails | Report error, leave unpushed |
| Fix cycle > 2 | Stop, report remaining issues, push current state |

---

## Working Directory Handling

- All Bash commands use absolute paths or `cd /Users/goenkas/Projects/timecell` first
- Workspace commands: `npm run build --workspace=packages/{name}` from repo root
- Git operations from repo root: `cd /Users/goenkas/Projects/timecell && git ...`
- Never assume cwd persists between Bash calls — always use absolute paths

---

## TimeCell-Specific Notes

### timecell (auto-detected from cwd)

**Monorepo structure & build order:**
- TypeScript monorepo: engine/api/web/cli (npm workspaces)
- Build order matters: `engine` → `api` → `web` → `cli` (engine must build first; others depend on it)
- Full build: `npm run build --workspaces` from repo root
- Workspace build: `npm run build --workspace=packages/{name}`

**Testing:**
- Tests: `npx vitest run packages/engine/src/` (engine has test suite)
- Other packages: test support varies (cli has minimal tests, api/web use component tests)
- No test suite? Tester reports "no tests" and passes (not a blocker)

**Dev servers:**
- API: port 3737 (`npm run dev --workspace=packages/api`)
- Web: port 3738 (`npm run dev --workspace=packages/web`)
- Both must be running for manual browser testing

**Standalone mode check (critical for Vercel deployment):**
- All web components MUST work without API fallback
- Pattern: `detectStandalone()` helper in engine + `generateXLocally()` in `engine-standalone.ts`
- API serves as fallback on error, but should not be required
- When building web features, verify both standalone and API-connected paths work

**Worktree gotcha:**
- Worktrees share node_modules via symlinks
- If engine exports change, the symlinked engine dist must be built on main repo before API/web can import new exports in a worktree
- Recommendation: Consider skipping worktrees for this project; use feature branches instead if cross-package changes cause friction

**Temperature state management:**
- TemperatureGauge component exposes `onTemperatureChange` callback
- ActionPlan reads live temperature from App-level state, not hardcoded
- When modifying temp logic, ensure state flows upward to App and down to consumers

**Parallel coding opportunity:**
- Engine + tests, web components, and API routes touch different files
- Safe to parallelize across agents: engine logic work, UI component work, and endpoint work can happen concurrently
- Just ensure engine builds first before API/web merges attempt to use new exports

---

## Known Failure Modes

| Issue | Resolution |
|-------|------------|
| Cross-package TypeScript errors | Check that engine exports are correct; api/web may need engine rebuild first |
| Workspace import errors | Ensure `@timecell/engine` is in workspace dependencies |
| Vite build fails in web | Check for missing env vars, broken imports, or Tailwind config issues |
| No test suite for package | Tester reports "no tests" and passes (not a blocker) |
| QA agent crashes | Continue with remaining agents, warn user |
| Push conflicts | Manual resolution required |

---

*Ported from SandeepPKM vibe.md: 2026-02-27. Adapted for timecell monorepo (engine/api/web/cli packages). Removed PKM-specific project registry, pkm-web Flask context, and PKM path references. Added timecell package registry, workspace build commands, and monorepo patterns.*
