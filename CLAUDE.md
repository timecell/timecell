# TimeCell — Project Guide

## What Is This

TimeCell (timecell.ai) is a local-first, CLI-first money and investing framework tool. Bitcoin crash survival is the initial wedge; the product evolves to cover the full investing lifecycle.

**Install:** `npx @timecell/cli` → setup wizard → local SQLite → localhost dashboard
**Config:** `~/.timecell/`
**No cloud, no auth, data stays local.**
**Roadmap:** `ROADMAP.md` — single source of truth for all tasks (icebox/planned/in-progress/done). Read at session start.
**Framework:** `docs/bitcoin-investing-framework-v2.md` — the 10-part Bitcoin Investing Framework that defines all product logic (conviction ladder, position sizing, temperature, ruin test, downside insurance). Read when implementing framework features.

## Architecture

### Stack
- TypeScript (all packages)
- Vite + React + Tailwind (frontend)
- Fastify (API server)
- better-sqlite3 (local storage)
- npm workspaces monorepo

### Monorepo Structure
```
packages/
  engine/    — Pure TS calculation library. Zero dependencies on UI/API.
               Crash survival, runway, CAGR, temperature, ruin test.
  api/       — Fastify server. Thin layer over engine. Port 3737.
  web/       — Vite + React dashboard. Port 3738.
  cli/       — npx entry point. Setup wizard, starts api+web.
```

### Key Principle: Engine Independence
The engine package contains ALL business logic as pure functions. It has no dependency on API, DB, or UI. This allows:
- CLI can use engine directly (no API needed)
- API is a thin HTTP wrapper
- Tests run against engine without servers
- Future: WASM compilation, SDK distribution

### Data Flow
```
User Input → API → Engine (pure functions) → Response → UI renders
                    ↕
              SQLite (optional persistence)
```

## Business Logic

### Crash Survival Calculator
- Tests portfolio across drawdown scenarios (30%, 50%, 70%, 80%)
- Non-BTC assets drop at ~50% of BTC drawdown (correlation model from framework)
- Calculates: post-crash value, hedge payoff, runway months, survival status
- Survival threshold: 18 months runway minimum

### Ruin Test (Framework Part 3, Step 3)
"If BTC drops 80% AND other assets drop 40% simultaneously, do you survive?"

### Temperature (0-100)
- MVRV (60%) + RHODL (40%) composite
- Zones: 0-20 extreme fear, 20-40 fear, 40-60 neutral, 60-75 greed, 75-100 extreme greed

### Geometric Mean CAGR (Spitznagel)
- Hedged vs unhedged CAGR across cycle lengths
- Break-even: max cycle length where hedge is positive EV

### Conviction Ladder (6 rungs)
- Observer (0%) → Experimenter (1-3%) → Diversifier (5-10%) → High Conviction (10-25%) → Owner-Class (25-50%) → Single-Asset Core (50%+)
- Gates for 25%+: multi-cycle experience, 2yr expenses outside BTC, no forced-sale liabilities, sleep test, written de-risk triggers

## Conventions

### Code Style
- Biome for lint/format (tab indent, 100 line width)
- Pure functions preferred — no side effects in engine
- Types co-located with implementation, not in separate files
- No barrel exports except package entry points

### File Naming
- kebab-case for files: `crash-survival.ts`
- PascalCase for React components: `CrashCard.tsx`
- Tests co-located: `crash-survival.test.ts`

### Git
- Conventional commits: feat:, fix:, chore:, docs:
- No force push to main
- Commit working states frequently during build sessions

## Key References

- Core math: crash payoff scenarios, geometric mean CAGR (Spitznagel), ruin test, hedge breakeven
- Bitcoin Investing Framework v2 (10-part framework, conviction ladder, position sizing, temperature, downside insurance)
- Architecture decisions documented in ChatGPT session and preserved in this file

## Skills Available
- `/plan` — Iterative plan development with convergence checking
- `/vibe` — Autonomous coding with quality pipeline
- `/second-opinion` — Multi-AI consultation (OpenAI + Gemini + DeepSeek)
- `/session-close-quick` — Fast session close with context preservation
- `/task` — Task continuity across sessions
- `/skill-audit` — Validate skills against design principles

## Session Management

Proactively suggest closing the session and starting fresh when any of these are true:
- 3+ agent swarms have completed in the session
- Context is heavy with tool output (many file reads, large diffs, repeated browser automation)
- Work is shifting to a different focus area (e.g. from feature building to UX redesign)
- Browser automation or agents start failing/retrying — sign of context degradation

When suggesting a session close:
1. Commit all uncommitted work
2. Update ROADMAP.md with current state
3. Update MEMORY.md with anything learned
4. **Draft a copy-paste continuation prompt** the user can paste into the new session — include context, priorities, and specific next steps

## Product Context

- **Domain:** timecell.ai
- **GitHub:** github.com/timecell
- **Twitter:** @timecellai
- **Target users:** Bitcoin holders who want to stress-test their portfolio
- **V1 wedge:** Crash survival calculator ("Know if you survive the crash before it happens")
- **Long-term:** Full money and investing actionable framework
