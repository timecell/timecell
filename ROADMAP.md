# TimeCell — Product Roadmap

**What:** Your AI Chief Investment Officer. A local-first, open-source tool that gives anyone — regardless of investing experience — a trusted CIO they can talk to about their money. Built on a rigorous 10-part framework, powered by Claude AI (BYOK).

**Why:** Most people don't have access to a CIO who knows their complete financial picture, thinks in frameworks, and gives direct actionable guidance. TimeCell is that CIO — not a dashboard to stare at, but an advisor to talk to. The dashboard is proof; the conversation is the product.

**Product arc:**
1. **Bitcoin CIO** (v0.1-v0.3) — Prove the pattern: framework → engine → conversational advisor (web app)
2. **TimeCell Agent** (v0.4-v0.5) — Local daemon: background monitoring, proactive alerts, Telegram/WhatsApp, session memory, self-improving skills
3. **Full portfolio** (v1.0+) — Multi-asset CIO: stocks, bonds, real estate — one advisor for everything
4. **Platform** (v2.0+) — Family office CIO: role-scoped agents, governance, execution

**Architecture principle (settled, 4-AI validated):** TimeCell is an AI agent, not a CLI tool or web app. The core is a local daemon ("TimeCell Agent") — a long-lived background process that monitors markets, runs scheduled checks, delivers alerts, and remembers context. Multiple surfaces connect to this agent:
- **Web app** (timecell.ai/app) — zero-install trial & rich UI. Also serves as "remote control" for the daemon.
- **Messaging** (Telegram, WhatsApp, Signal) — daily touchpoint for alerts and quick queries.
- **CLI** — developer/power-user tool, daemon installer.
The web app is the acquisition funnel. The daemon is the product. Installation friction is a temporary problem solved progressively (like OpenClaw did — started complex, simplified over time). Architectural ceiling is permanent — a browser-sandboxed app can never run background monitoring, access the filesystem, pipe data between tools, or self-improve. BYOK + local-first requires a local agent for proactive features.

**Kill-switch:** If daemon install conversion < 5% after 6 weeks of polished installer, fall back to web-app-first with server-side monitoring. The web app already works standalone.

**UX principle (from OpenClaw):** Tools are invisible infrastructure. The CIO uses crash_survival, temperature, position_sizing behind the scenes — users see the judgment, not the plumbing. Tool status shown briefly during execution, results collapsed by default. Progressive context: the CIO builds understanding over the conversation, remembers across sessions, and proactively references what changed.

**Source of truth:** Bitcoin Investing Framework v2 (`docs/bitcoin-investing-framework-v2.md`)
**Last updated:** 2026-02-28

---

## v0.1 ✅ SHIPPED
Monorepo scaffolding, crash survival engine, ruin test, runway, hedge payoff, CAGR, CLI wizard, dashboard (shadcn/ui, recharts, dark theme), landing page, logo, conviction ladder, currency support. Published as v0.1.1.

## v0.2 ✅ SHIPPED
Action plan engine (11 rules), temperature gauge, position sizing, live BTC price, 5-zone dashboard layout, hosted web app (timecell.ai/app), standalone mode. All packages v0.2.0, 54 tests passing.

## v0.3 — "Talk to your portfolio"

Chat IS the product. The AI advisor is the primary experience — users ask questions and get framework-driven answers backed by real calculations. The dashboard exists as visual proof that appears when relevant.

**Shipped:** Chat-first AI advisor (BYOK, 8 engine tools, agentic loop, streaming), layout flip (chat full-width + collapsible sidebar), conversational onboarding, sleep test + capacity gate engines, temperature v3.0 (live Turso), report card, landing page v2.

- [x] **Additional AI tools** — All 14 engine functions exposed as Claude tools (allocation drift, historical crash sim, downside insurance, custody risk, geometric CAGR, temperature-adjusted DCA)

**Deferred to v0.4 (daemon features):**
- [ ] CIO memory across sessions — Persist portfolio context + conversation insights. On return: "Welcome back. Temperature moved from 55 to 62 — want me to review?"
- [ ] Conversation persistence / multi-conversation
- [ ] Embed dashboard widgets inline in chat responses (v0.5)

## v0.4 — "TimeCell Agent" (the daemon)

Transform CLI from setup wizard into a long-lived local agent. The agent runs in the background, monitors markets, and delivers proactive CIO advice via web UI and messaging.

**Core daemon:**
- [ ] **TimeCell Gateway** — Long-lived Node.js daemon process. `npx @timecell/cli agent start` launches it. Health check endpoint. Graceful shutdown. Auto-restart on crash.
- [ ] **Scheduled monitoring** — Cron-style checks: temperature every 4h, portfolio drift daily, ruin test on significant BTC price moves.
- [ ] **Telegram bot integration** — Daily morning brief: "Temperature: 37 (Fear). Your portfolio survived overnight. DCA multiplier: 1.5x." Quick query support.
- [ ] **Session memory** — Local Markdown/SQLite persistence. Agent remembers past conversations, portfolio changes, advice given. Progressive context building.
- [ ] **Web UI as remote control** — timecell.ai/app connects to local daemon via localhost API. Daemon does the heavy lifting; web renders results.

**Carried forward:**
- [x] **Live MVRV/RHODL temperature** — Connected to existing Turso live feed.
- [x] **Live currency conversion** — Auto-fetch rates, cached with 1hr TTL.
- [ ] **Portfolio history** — SQLite persistence, "what changed since last visit."
- [x] **Allocation drift detection** — Alert when portfolio drifts outside conviction rung.
- [x] **PDF export** — One-page report card as downloadable PDF.
- [x] **Mobile-optimized UX** — Larger touch targets, responsive breakpoints.

**Kill-switch metric:** If <5% of web users convert to daemon install after 6 weeks of polished installer, fall back to server-side monitoring + web push notifications.

## v0.5 — "Compare and decide"

Advanced analysis tools for experienced investors making allocation decisions.

- [x] **"What if" comparison mode** — Split screen: current allocation vs proposed, both crash survival states side by side, delta row
- [ ] **Exchange vs self-custody tracking** — What's on exchange vs cold storage. Risk profile differs (Framework Part 7).
- [x] **Historical crash overlay** — Map current scenario to 2014, 2018, 2022, COVID actual drawdowns with survival simulation (19 tests)
- [x] **Market sentiment** — Fear & Greed index alongside temperature for cross-validation, agreement indicator

---

## v1.0 — "My money command center" *(contingent on validation — see gates below)*

Graduate from Bitcoin-only to full portfolio. The framework's core process (conviction → capacity → ruin → insurance → rules → sleep test) is universal — what changes per asset class is the **temperature indicators** and **stress parameters**. Architecture: universal pipeline with pluggable, asset-specific adapters.

**What transfers directly:** Conviction Ladder, Position Sizing Pipeline, Sleep Test, Action Plan Engine structure. These are behavioral/risk-management patterns that work for any concentrated position.

**What needs asset-specific adapters:**
- **Temperature** — BTC uses MVRV/RHODL. Stocks: Shiller CAPE, P/E, equity risk premium. Real estate: cap rate spreads, price-to-rent, vacancy rates. Bonds: real yields, credit spreads, term premium. Each asset gets a 0-100 composite from Valuation + Positioning/Sentiment + Macro/Conditions.
- **Ruin Test parameters** — BTC: -80%. Growth stocks: -70%. Blue chips: -50%. Real estate: -30% + 12mo vacancy. Bonds: duration/inflation regime shifts. The method is universal; the numbers are asset-specific.
- **Action Plan rules** — Engine structure transfers, but thresholds and recommended actions need recalibration per asset class and its temperature proxy.

**Key assumption to validate:** Yield-bearing assets (stocks, bonds, real estate) break the zero-yield/pure-price-appreciation model. Income cushions crashes and changes survival math. The Ruin Test and Sleep Test must account for ongoing cash flows, not just mark-to-market losses.

- [ ] **Pluggable temperature adapters** — Interface: `TemperatureAdapter { compute(data): 0-100 }`. BTC adapter ships first (existing). Stock adapter (CAPE-based) second. Community contributes others.
- [ ] **Parameterized stress library** — Scenario sets per asset type: equity crash (-55%), idiosyncratic collapse (-90%), rates shock (2022-style), RE refi crunch. Users pick baseline, customize thresholds.
- [ ] **Multi-asset data model** — Entities → accounts → instruments → positions (from architecture spec)
- [ ] **Connectors** — Exchange OAuth, brokerage sync, manual input for any asset class
- [ ] **Unified net worth dashboard** — All assets in one view, BTC as one component
- [ ] **Risk-budgeted conviction ladder** — Rungs defined by max drawdown contribution and max portfolio loss in stress, not just flat % allocation. Works for both single bets and multi-asset portfolios.
- [ ] **Postgres ledger** — Canonical source of truth for multi-entity, auditable financial data (SQLite remains for local-only mode)

## v2.0 — "Run my portfolio like a family office" *(contingent on validation — see gates below)*

Two modes, one engine. Mass retail stays simple; family office exposes governance. This is the most speculative horizon — requires demonstrated multi-asset framework generalization and validated demand from family offices.

- [ ] **Role-scoped agents** — Tax advisor, legal, CIO perspectives on every decision
- [ ] **Trade intents → execution** — Analysis outputs become actionable trade intents; later, actual execution
- [ ] **Multi-entity / family mode** — Shared dashboards, per-entity views, RBAC
- [ ] **Governance workflows** — Approval chains, audit trails, decision logging
- [x] **Selling rules engine** — Temperature-based 6-tier selling schedule (70-95), pulled forward from v2.0
- [x] **Downside insurance configuration** — Put option budgeting, hedge breakeven, payoff scenarios (25 tests), pulled forward from v2.0

---

## Future Horizons (unscoped — community-driven, none block v1.0/v2.0)

### Framework Depth (Bitcoin)
- ~~Thesis health check~~ — ✅ Built (7 properties, qualitative assessment, localStorage)
- ~~Journey/stage tracking~~ — ✅ Built in v0.5 (6-question quiz, Learning/Tested/Systems stages)
- Barbell-to-buckets visualization — Portfolio structure evolution (Framework Part 8.4)
- ~~DCA calculator~~ — ✅ Built (flat + temperature-adjusted, 4yr cycle simulation, 55 tests)
- ~~4-year moving average chart~~ — ✅ Built (3-cycle synthetic data, recharts, ratio display)
- Monte Carlo / Kelly criterion simulations

### UX / Navigation
- Tabbed navigation — Break single-page dashboard into tabs/sections (Position → Risk → Action → Protection). Critical for scalability to multi-asset.
- Guided decision flow — Floating progress indicator walking users through Know → Assess → Decide → Protect journey
- Shorthand number input in all text fields (8m, 500k, 2cr) — ✅ Done in onboarding modal
- Code splitting — Lazy-load dashboard sections to reduce initial bundle (currently 1.4MB)

### Conversational Interface
- ~~Chat panel~~ — ✅ Built in v0.3 (chat-first layout, 8 tools, BYOK, agentic loop)
- ~~Chat streaming~~ — ✅ Built in v0.3
- **WhatsApp/Telegram bot** — Same engine tools, text-only responses. Users get advice on the go without opening the web app. Web app remains the "rich" channel with interactive widgets.
- **CLI conversational mode** — Extend existing CLI wizard with AI-powered chat that reads engine output and interprets it
- **User personas** — 3 test personas (Conservative HNI / Aggressive crypto-native / Curious newcomer) for flow testing and UX validation
- **Multi-conversation history** — Conversation titles, history sidebar, search across conversations
- **Message actions** — Copy to clipboard, share, pin important advice, bookmark
- **Inline dashboard widgets** — AI responses embed interactive charts/gauges (survival chart, temperature gauge) directly in the chat stream

### Intelligence
- AI-powered "what changed since last visit"
- Anomaly detection and alerts
- Custom rules engine (user-defined triggers)
- Personality layer — engagement without contaminating math (computation vs rendering separation)

### Social
- Share report cards (anonymized)
- Compare with peers
- Advisor collaboration mode

### Infrastructure
- Self-contained temperature data pipeline — CLI/self-hosted mode should fetch MVRV/RHODL directly (no dependency on shared Turso DB). Bitcoin Magazine Pro API is paid; evaluate free alternatives or bundled local caching. Shared Turso is fine for hosted (timecell.ai/app) but OSS users need independence.
- ~~Consolidate Vercel projects~~ — ✅ Done. Domain moved from timecell-site to timecell project. API + app on same domain.
- Desktop app (Electron or Tauri)
- Plugin system / marketplace
- Dataset versioning / snapshots / lineage
- WASM compilation of engine (pure browser, no API)
- CI/CD pipeline (GitHub Actions)
- API for third-party integrations

### Beyond v2 (speculative)
- Real estate temperature adapter (cap rate spreads, price-to-rent, vacancy, refi stress)
- Bond temperature adapter (real yields, credit spreads, term premium, duration regime)
- Single-stock adapter (EV/FCF, short interest, options skew, revision breadth)
- Estate planning / generational wealth transfer
- Jurisdiction-aware tax optimization
- IC (Investment Committee) simulation mode

---

## Validation Gates

v0.1-v0.5 ship on the development timeline. v1.0 and v2.0 are contingent horizons — each gate requires evidence before investing.

| Gate | From → To | Metrics / Evidence |
|------|-----------|--------------------|
| Wedge works | v0.5 → v1.0 | ≥500 GitHub stars OR ≥1k npm weekly downloads; D30 retention ≥20%; action closure rate ≥25%; community requests for multi-asset support |
| Framework generalizes | v1.0 → v2.0 | At least 1 non-BTC temperature adapter shipped and backtested (e.g., CAPE-based stock adapter); ruin test validated with yield-bearing asset math; ≥5 FO discovery interviews; active contributors beyond core team |

## Risks & Assumptions

- **Framework generalizability** — Multi-AI review (4 models) confirmed: the **decision process** (conviction → sizing → ruin → sleep test) generalizes with high confidence. The **temperature metric** is the fragile part — MVRV/RHODL are Bitcoin-specific with no direct equivalent elsewhere. Stock proxies (CAPE, P/E) are lagging and subjective; real estate data is private and localized; bond "temperature" inverts intuitively (high yields = cold = good). The framework's unique power comes from Bitcoin's transparent on-chain data — replacing it with traditional metrics risks becoming "generic financial advice with extra steps." Architecture must be pluggable adapters, not forced universality.
- **Yield-bearing asset gap** — Current framework assumes zero yield, pure price appreciation. Stocks pay dividends, bonds pay coupons, real estate generates rent. Income cushions crashes, changes survival math, and makes -80% drawdowns far less likely. Ruin Test and Sleep Test must account for ongoing cash flows, not just mark-to-market losses. This is a non-trivial extension.
- **Bear/bull market sensitivity** — Crash survival has maximum appeal during volatility and drawdowns. During euphoria, user motivation drops. Distribution timing matters.
- **Financial advice line** — Action plan recommendations could be perceived as financial advice. All outputs need clear disclaimers: "This is a computational framework, not financial advice. Consult a qualified advisor."
- **Real-time data at scale** — Pure-function architecture works well for on-demand computation. Live data feeds (MVRV, price, alerts) may require a streaming/event layer that doesn't exist yet.
- **OSS sustainability** — No revenue model by design. Sustained development depends on personal motivation and community contributions.

## Distribution

OSS-first distribution — no paid channels, no sales team.

- **GitHub** — Primary. README with screenshots, GIF demo, clear install instructions.
- **npm** — `npx @timecell/cli` for instant try-it.
- **Hosted web app** — timecell.ai/app for zero-install access.
- **Crypto communities** — Bitcoin Twitter, r/Bitcoin, Stacker News, masterclassbitcoin.com.
- **Twitter (@timecellai)** — Demo clips, framework threads, crash scenario screenshots.
- **Word of mouth** — Report card sharing (anonymized one-pagers).

## Decision Log

Last 3 decisions. Full log: `docs/decisions.md`

| Date | Decision | Context |
|------|----------|---------|
| 2026-02-28 | Layout flip: chat-dominant interface | User insight: chat is 90-95% of the value, dashboard is 5%. Flipped: chat full width, dashboard as 380px collapsible sidebar. |
| 2026-02-28 | Daemon-as-core architecture (4-AI validated, 2 rounds) | Round 1: all 4 AIs recommended web-first, daemon optional. Founder pushed back: install friction is temporary but ceiling is permanent. Round 2: OpenAI shifted to daemon-first. Final: daemon IS the core product, web app is acquisition funnel / remote control. Kill-switch: <5% install conversion after 6 weeks. |
| 2026-02-28 | Framework generalizability analysis (4-AI second opinion) | Core process (conviction, sizing, ruin, sleep) transfers with high confidence. Temperature is Bitcoin-specific — needs pluggable adapters per asset. Yield-bearing assets break zero-yield assumption. v1.0 rewritten with adapter architecture. |

## Build History

Build history: `docs/build-history.md`

## Marketing (Icebox)
- [ ] Product Hunt launch
- [ ] Blog post — "Why crash survival matters more than returns"
- [ ] Install instructions page — timecell.ai/install with screenshots
