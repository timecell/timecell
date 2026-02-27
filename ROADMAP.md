# TimeCell — Product Roadmap

**What:** An open-source, local-first framework for managing money and investments using AI. Part of the AI Labs project — money is the first domain.

**Why:** Help individuals and family offices make better investment decisions through deterministic computation + actionable guidance. Not a commercial product — an open-source tool for impact, like OpenClaw for code.

**Product arc:**
1. **Bitcoin wedge** (v0.1-v0.3) — Prove the pattern: framework → engine → interactive guidance
2. **Daily habit** (v0.4-v0.5) — Live data, monitoring, three loops: snapshot → survival → alerts
3. **Full portfolio** (v1.0+) — Multi-asset, connectors, net worth, the money command center
4. **Platform** (v2.0+) — Family office mode, role-scoped agents, execution layer, plugins

**Architecture principle:** One shared engine, multiple surfaces. Individual mode hides complexity; family office mode exposes governance. Computation is deterministic and auditable; personality/rendering is separate.

**Source of truth:** Bitcoin Investing Framework v2 (`docs/bitcoin-investing-framework-v2.md`)
**Last updated:** 2026-02-28

---

## v0.1 — "Can I survive a crash?" ✅ SHIPPED

- [x] Full monorepo scaffolding, all packages published v0.1.1
- [x] Engine: crash survival, ruin test, runway, hedge payoff, CAGR
- [x] Dashboard: shadcn/ui, recharts, dark theme, responsive
- [x] CLI: wizard, auto BTC price, port handling
- [x] Landing page: timecell.ai on Vercel
- [x] Logo, conviction ladder, currency support, shorthand numbers, info panel

## v0.2 — "What should I do about it?" ✅ SHIPPED

- [x] Action plan engine — 11 framework rules, pure function, 17 tests
- [x] ActionPlan.tsx component with standalone mode support
- [x] 5-zone dashboard layout (hero > interactive > market intelligence > crash details > framework)
- [x] Temperature gauge — engine function + API route + SVG gauge component
- [x] Position sizing — engine function + 20 tests + API route + UI with sliders
- [x] Live BTC price — hook + ticker component, auto-refresh, price flash
- [x] Hosted web app infrastructure — standalone mode, Vercel config, engine runs client-side. Live at timecell.ai/app.
- [x] All packages bumped to v0.2.0, 54 tests passing

## v0.3–v0.5 Scope Note

These three releases collectively prove the **habit loop**: trigger → recommendation → action → improved scorecard. The critical variable is not more features — it is whether users form the "info → action" habit. Validation targets: D30 retention ≥20%, action closure rate ≥25%.

## v0.3 — "Know your position"

Complete the Position Sizing Process (Framework Part 3). Every screen ends with an action, not just a number. Sliders become "what if" tools after you enter YOUR numbers.

- [x] **Guided first-run flow** — Questions not sliders: "What's your net worth?" → "How much is liquid?" → "What % is BTC?" → reveal dashboard with YOUR numbers
- [x] **Sleep test display** — "If BTC drops 80% tomorrow, you lose $X. Does your life change?" Big, visceral number. Framework Part 3 Step 6.
- [x] **Capacity gate inputs** — Age/income proxy, withdrawal horizon, liability schedule. `Effective Allocation = min(Conviction Rung, Capacity Ceiling)`. Framework Part 3 Step 2.
- [x] **Interactive conviction gates** — At 25%+, show checkboxes: multi-cycle experience? 2yr expenses outside BTC? No forced-sale liabilities? Sleep test? Written triggers? Warn clearly if gates aren't met.
- [x] **De-risk triggers** — Written rules UI: "If temperature > 80, sell X%. If ruin test fails, reduce to Y%." Framework Part 3 Step 5.
- [x] **One-page report card** — Single summary: survival score, ruin test, conviction rung, temperature, action plan. Screenshot-friendly, shareable with advisors.
- [ ] **Chat-first AI advisor** — Claude-powered chat panel as primary experience. BYOK (user provides API key). Engine functions as AI tools. Framework embodied in system prompt.
- [ ] **BYOK setup** — API key entry, model selection (sonnet/opus/haiku), localStorage storage
- [ ] **Split layout** — Chat (left 440px) + Dashboard (right scrollable). Mobile: tab bar toggle.

## v0.4 — "Stay informed"

Live data and ongoing awareness. Replace mock data with real feeds. Establish the three daily loops: portfolio health snapshot → crash survival check → exposure-weighted alerts.

- [x] **Live MVRV/RHODL temperature** — Pulling forward — connecting to existing Turso live feed from fo-web project. Replace mock temperature with real on-chain data feeds. Credibility-critical: mock data breaks trust.
- [x] **Live currency conversion** — Auto-fetch INR/USD/EUR/GBP/SGD rates, display-only conversion, cached with 1hr TTL
- [ ] **Portfolio history** — SQLite persistence, "what changed since last visit"
- [x] **Allocation drift detection** — Alert when portfolio drifts outside chosen conviction rung due to price movement
- [x] **PDF export** — One-page report card as downloadable PDF (html2canvas + jspdf)
- [x] **Mobile-optimized UX** — Larger touch targets, better slider controls on phone, responsive breakpoints

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
- **Chat panel** — Sliding panel in web dashboard for contextual Q&A. Template-based v1 (engine explains its own output), LLM-powered v2 (Claude/GPT for free-form). Dashboard = show, Chat = explain + decide.
- **CLI conversational mode** — Extend existing CLI wizard with AI-powered chat that reads engine output and interprets it
- **User personas** — 3 test personas (Conservative HNI / Aggressive crypto-native / Curious newcomer) for flow testing and UX validation

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

| Date | Decision | Context |
|------|----------|---------|
| 2026-02-27 | OSS/AI Labs reframing + second-opinion incorporation | Multi-AI review (OpenAI, Gemini, DeepSeek, Claude). Key changes: v1.0/v2.0 reframed as contingent horizons with validation gates; v0.3-v0.5 unified around habit loop proof; added Risks & Assumptions (framework generalizability, bear market sensitivity, financial advice disclaimers); added Distribution section. |
| 2026-02-28 | Broadened roadmap vision to full investing lifecycle | ChatGPT architecture session captured product arc: Bitcoin wedge → daily habit → full portfolio → family office platform. Roadmap was too Bitcoin-narrow. |
| 2026-02-28 | Added v1.0 and v2.0 horizons | v1.0 = multi-asset command center. v2.0 = family office mode. Captures architecture decisions from planning session (Postgres, multi-entity, role-scoped agents, trade intents). |
| 2026-02-28 | Restructured v0.3-v0.5 around product story | Survive → Understand → Size → Monitor → Advance. Previous v0.4 (distribution) was stale. |
| 2026-02-28 | Desktop app moved to icebox | No proven demand. Hosted web app covers zero-install need. |
| 2026-02-28 | "What Should I Do?" engine is the product differentiator | Framework audit: product shows data but doesn't give answers. Action plan closes the loop. |
| 2026-02-28 | Framework v2 is the source of truth for all product logic | Copied to docs/, referenced in CLAUDE.md. All features trace back to framework parts. |
| 2026-02-28 | Capacity gate is critical input, not nice-to-have | Framework Part 3 Step 2: Effective Allocation = min(Conviction, Capacity). Without it, position sizing is incomplete. |
| 2026-02-28 | Computation vs personality separation | Numbers and actions must be deterministic and auditable. Personality layer (engagement, UX tone) is separate. From ChatGPT architecture session. |
| 2026-02-28 | Execution deferred by design | Read-only until v2.0. Design outputs as trade intents so future execution is possible. Execution is 10x harder than analysis. |
| 2026-02-28 | One engine, multiple surfaces | Mass retail hides complexity; family office exposes governance. Prevents building two products. |
| 2026-02-27 | Currency: option 2 (with conversion) for long-term | Math is currency-agnostic, but INR users need ₹ display + live conversion |
| 2026-02-27 | Logo: v3-3 (orange circle+dot + wordmark) | Finalized after 5 rounds |
| 2026-02-27 | Distribution: hosted web app > CLI for non-tech users | timecell.ai/app = zero install |
| 2026-02-28 | Chat-first architecture (v0.3) | Product shifted from dashboard-first to chat-first. AI advisor (Claude) is the primary experience via BYOK. Engine functions exposed as Claude tools. Dashboard is visual reference. Browser-direct API calls (no proxy). Inspired by OpenClaw model. |
| 2026-02-28 | Live temperature pulled forward from v0.4 | Discovered existing live MVRV/RHODL feed in Turso DB (shared with fo-web, open-fo, mc-bitcoin-tools). Daily sync via GitHub Actions. Connecting TimeCell directly rather than building from scratch. |
| 2026-02-28 | Framework generalizability analysis (4-AI second opinion) | Claude + OpenAI + Gemini + DeepSeek consensus: core process (conviction, sizing, ruin, sleep) transfers with high confidence. Temperature is Bitcoin-specific — needs pluggable adapters per asset (CAPE for stocks, cap rates for RE, real yields for bonds). Yield-bearing assets break zero-yield assumption. v1.0 rewritten with adapter architecture. Strongest counterargument: without on-chain data quality, framework loses its differentiating edge over generic advice. |

---

## Build History

### v0.3 (partial) — Session 6 (Feb 28)
- Temperature v3.0 (MVRV z-score CDF + RHODL log-scale, 6-tier zones), live Turso connection
- Sleep test engine (8 tests) + capacity gate engine (23 tests), 86 total tests
- OnboardingModal (4-step wizard), SleepTest (visceral loss display), ReportCard (screenshot-friendly)
- Framework generalizability analysis (4-AI second opinion), ROADMAP rewritten with adapter architecture
- Financial disclaimer, standalone mode fix, action plan 6-tier thresholds

### v0.2 — Sessions 4-5 (Feb 28)
- Action plan engine (11 rules, 17 tests), temperature gauge, position sizing (20 tests)
- 5-zone dashboard, standalone mode, Vercel config, live BTC price
- All packages v0.2.0, 54 tests passing

### v0.1 — Sessions 1-3 (Feb 27)
- Full monorepo, crash survival, ruin test, runway, hedge payoff, CAGR
- Dashboard (shadcn/ui, recharts, dark theme), CLI wizard
- Landing page, logo, conviction ladder, currency, shorthand numbers

---

## Marketing (Icebox)
- [ ] Product Hunt launch
- [ ] Blog post — "Why crash survival matters more than returns"
- [ ] Install instructions page — timecell.ai/install with screenshots
