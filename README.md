# TimeCell — AI Family Office OS

TimeCell is an open-source, CLI-first AI family office operating system. The product IS a Claude Code configuration — CLAUDE.md + skills + memory templates + engine. No web dashboard, no API server. Skills ARE the interface.

## Quick Start

```bash
npx timecell
# → installs to ~/timecell
# → "Open in Claude Code to start your setup"

cd ~/timecell
claude
# → /setup runs automatically
```

## How It Works

TimeCell turns Claude Code into your personal CIO (Chief Investment Officer). You interact through 6 skills organized by cadence:

| Skill | When | Purpose |
|-------|------|---------|
| `/setup` | Once | Guided onboarding — builds your financial profile |
| `/start` | Daily | "Where do I stand?" — 2-minute portfolio check |
| `/weekly` | Weekly | Trends, strategy review, next-week priorities |
| `/monthly` | Monthly | Full review, crash survival, goal progress |
| `/check` | Anytime | "Am I ok?" — on-demand risk assessment |
| `/ask` | Anytime | Free-form questions, rule changes, "what if" |

## Architecture

### Five Primitives

Every piece of family office intelligence fits into one of five categories:

1. **Entities** — Structural objects (accounts, trusts, wallets, people)
2. **Metrics** — Computed values (runway months, concentration %, temperature)
3. **Guardrails** — Constraints with zones (min runway, max concentration)
4. **Strategies** — Decision frameworks (selling rules, DCA, crash deployment)
5. **Buckets** — Allocation targets (Safety Floor, Core Conviction, Growth Engine)

### Three Layers

Each primitive exists at three layers. Override precedence: User > Pack > Core.

| Layer | What | Who Creates |
|-------|------|-------------|
| **Core** | Universal defaults | TimeCell |
| **Packs** | Expert opinions (e.g., "Bitcoin FO") | Community |
| **User** | Your customizations | You |

### Engine

14 financial computation functions with 239 tests. Pure math — no opinions. The engine calculates, the CIO interprets.

## Packs

TimeCell ships with the `bitcoin-fo` pack — an opinionated framework for Bitcoin-conviction family offices. It adds:
- Temperature-based selling/buying rules
- Custody risk monitoring
- Cycle-aware portfolio management
- 6 specialized buckets

Don't hold Bitcoin? Delete the pack. Use core + your own guardrails.

## Project Structure

```
timecell/
├── CLAUDE.md              # CIO persona (generic — pack beliefs loaded dynamically)
├── entities/              # Structural objects
│   ├── core/              # Schemas + templates
│   ├── packs/bitcoin-fo/  # BTC-specific entity templates
│   └── user/              # Your entities
├── metrics/               # Computed values
├── guardrails/            # Constraints with zones
├── strategies/            # Decision frameworks
├── buckets/               # Allocation targets
├── skills/core/           # 6 cadence-based skills
├── workflows/             # Internal orchestration
├── memory/                # User state (profile, decisions, sessions)
├── packs/bitcoin-fo/      # Bitcoin FO pack
├── packages/engine/       # Computation engine (TypeScript)
├── scripts/               # CLI tools
└── reference/             # Templates + specs
```

## License

MIT

## Status

v0.1 "Mirror" — Foundation release. See ROADMAP.md for what's next.
