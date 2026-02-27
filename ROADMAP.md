# TimeCell — Product Roadmap

**Vision:** Turn the Bitcoin Investing Framework's decision tree into an interactive product. Data → Understanding → Action.
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
- [x] Integrated BtcPriceTicker, TemperatureGauge, PositionSizing, ActionPlan into App.tsx
- [x] 5-zone dashboard layout (hero > interactive > market intelligence > crash details > framework)
- [x] API route for action-plan with input validation
- [x] Temperature state lifting (live temp feeds into action plan)
- [x] Dashboard UX redesign — hero survival score, 4-zone layout, collapsible details
- [x] Hosted web app infrastructure — standalone mode, Vercel config, engine runs client-side
- [x] Temperature gauge — engine function + API route + SVG gauge component
- [x] Position sizing — engine function + 20 tests + API route + UI with sliders
- [x] Live BTC price — hook + ticker component, auto-refresh, price flash
- [x] npm automation token — passkey-free publishing
- [x] All packages bumped to v0.2.0
- [x] Engine: 54 tests passing (17 crash + 20 position + 17 action plan)

## v0.3 — "Guide me through the full process"

Make the product cover the full position sizing process (Framework Part 3). Every screen ends with an action, not just a number.

- [ ] **Guided first-run flow** — Questions not sliders: "What's your net worth?" → "How much is liquid?" → "What % is BTC?" → reveal dashboard with YOUR numbers. Sliders become "what if" tools after the reveal.
- [ ] **Interactive conviction gates** — At 25%+, show checkboxes: multi-cycle experience? 2yr expenses outside BTC? No forced-sale liabilities? Sleep test? Written triggers? If gates aren't met, warn clearly.
- [ ] **Sleep test display** — "If BTC drops 80% tomorrow, you lose $X. Does your life change?" Big, visceral number.
- [ ] **De-risk triggers** — Written rules UI: "If temperature > 80, sell X%. If ruin test fails, reduce to Y%." Framework Part 3 Step 5.
- [ ] **One-page report card** — single summary view: survival score, ruin test, conviction rung, temperature, action plan. Screenshot-friendly, PDF-exportable, shareable with advisors.
- [ ] **Exchange vs self-custody split** — track what's on exchange vs cold storage. Risk profile differs.
- [ ] **Allocation guard / drift detection** — alert when portfolio drifts outside chosen conviction rung due to price movement.
- [ ] **Capacity gate inputs** — Framework Part 3 Step 2. Age/income proxy, withdrawal horizon, liability schedule. `Effective Allocation = min(Conviction Rung, Capacity Ceiling)`.

## v0.4 — "Make it easy to access"

Distribution and access improvements. Reach users who won't install a CLI.

- [ ] **Hosted web app deploy** — timecell.ai/app = zero install, fully standalone
- [ ] **Desktop app** (Electron or Tauri) — download .dmg/.exe, no terminal required
- [ ] **PDF export** — one-page report card as downloadable PDF
- [ ] **Mobile-optimized UX** — larger touch targets, better slider controls on phone

## v0.5 — "Keep me updated"

Live data feeds and ongoing awareness.

- [ ] **Live MVRV/RHODL data** — replace mock temperature with real on-chain feeds
- [ ] **Live currency conversion** — auto-fetch INR/USD/EUR rates
- [ ] **Portfolio history** — SQLite persistence, "what changed since last visit"
- [ ] **"What if" comparison mode** — split screen: current allocation vs proposed, both crash survival states side by side
- [ ] **Market sentiment** — Fear & Greed index alongside temperature
- [ ] **Historical crash overlay** — map current scenario to 2018, 2022

---

## Future Horizons (unscoped ideas — no timeline, no commitment)

### Bitcoin Depth
- Lightning integration
- UTXO-aware tax lot tracking
- Multisig-aware portfolio
- Monte Carlo / Kelly criterion simulations
- 4-year moving average chart (Framework Part 4.3)
- DCA calculator (Framework Part 4)
- Hedge/insurance configuration UI (Framework Part 6)

### Beyond Bitcoin
- Multi-asset portfolio (ETH, stocks, real estate)
- Asset correlation matrix
- Unified net worth dashboard
- Real estate and bond modeling

### Intelligence
- AI-powered "what changed since last visit"
- Anomaly alerts
- Custom rules engine
- News relevance scoring (exposure-weighted alerts)
- Historical crash overlay (map current to 2018, 2022)

### Social
- Share report cards (anonymized)
- Compare with peers
- Advisor collaboration mode

### Infrastructure
- Team/family mode (shared dashboards)
- API for third-party integrations
- Plugin system
- Trade intents (design outputs for future execution)
- Dataset versioning / snapshots
- WASM compilation of engine (pure browser, no API)
- CI/CD pipeline (GitHub Actions)

---

## "What Should I Do?" Engine — Architecture

The action plan engine is the core differentiator. It reads ALL inputs and produces personalized recommendations.

### Inputs
- Portfolio: total value, BTC %, monthly burn, liquid reserve
- Temperature: current score and zone
- Conviction: current rung, gates status (at 25%+)
- Capacity: withdrawal horizon, liability schedule (when available)
- Crash survival: max survivable drawdown, ruin test result

### Rules (from Framework)
1. **Ruin test failed** → "Reduce BTC allocation until ruin test passes. Current: X%, suggested: Y%"
2. **Allocation exceeds conviction** → "Your X% allocation is Rung N, but gates for that rung aren't met"
3. **Temperature < 20** → "Extreme fear zone. Historically the best time to accumulate. Consider lump sum."
4. **Temperature 20-40** → "Fear zone. DCA aggressively."
5. **Temperature 40-60** → "Neutral. Continue DCA at normal pace."
6. **Temperature 60-75** → "Greed zone. Slow down buying. Review risk management."
7. **Temperature > 75** → "Extreme greed. Stop buying. Activate selling rules."
8. **No liquid reserve** → "Build a safety net: 2+ years of expenses outside BTC"
9. **Runway < 18 months at 80% crash** → "Insufficient runway. Increase liquid reserve or reduce allocation."
10. **25%+ without gates** → "At this concentration, you need: [missing gates list]"
11. **50%+ without insurance** → "Downside insurance is required at this allocation (Framework Part 6)"

### Output
3-5 bullet points, prioritized by urgency:
- Red (act now): ruin test failing, insufficient runway
- Amber (consider): gates not met, temperature extreme
- Green (on track): allocation matches conviction, ruin test passes

---

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-02-28 | "What Should I Do?" engine is the product differentiator | Framework audit: product shows data but doesn't give answers. Action plan closes the loop. |
| 2026-02-28 | Framework v2 is the source of truth for all product logic | Copied to docs/, referenced in CLAUDE.md. All features trace back to framework parts. |
| 2026-02-28 | Capacity gate is critical input, not nice-to-have | Framework Part 3 Step 2: Effective Allocation = min(Conviction, Capacity). Without it, position sizing is incomplete. |
| 2026-02-27 | Currency: option 2 (with conversion) for long-term | Math is currency-agnostic, but INR users need ₹ display + live conversion |
| 2026-02-27 | Logo: v3-3 (orange circle+dot + wordmark) | Finalized after 5 rounds |
| 2026-02-27 | Distribution: hosted web app > CLI for non-tech users | timecell.ai/app = zero install |

---

## Build History

### v0.2 — Session 5 (Feb 28)
- [x] Action plan engine — 11 framework rules, pure function, 17 tests
- [x] ActionPlan.tsx component with standalone mode support
- [x] Integrated BtcPriceTicker, TemperatureGauge, PositionSizing, ActionPlan into App.tsx
- [x] 5-zone dashboard layout (hero > interactive > market intelligence > crash details > framework)
- [x] API route for action-plan with input validation
- [x] Temperature state lifting (live temp feeds into action plan)
- [x] All packages bumped to v0.2.0
- [x] Engine: 54 tests passing (17 crash + 20 position + 17 action plan)

### v0.2 — Session 4 (Feb 28)
- [x] Dashboard UX redesign — hero survival score, 4-zone layout, collapsible details
- [x] Hosted web app infrastructure — standalone mode, Vercel config, engine runs client-side
- [x] Temperature gauge — engine function + API route + SVG gauge component
- [x] Position sizing — engine function + 20 tests + API route + UI with sliders
- [x] Live BTC price — hook + ticker component, auto-refresh, price flash
- [x] npm automation token — passkey-free publishing
- [x] All packages published v0.1.2

### v0.1 — Sessions 1-3 (Feb 27)
- [x] Full monorepo scaffolding, all packages published v0.1.1
- [x] Engine: crash survival, ruin test, runway, hedge payoff, CAGR
- [x] Dashboard: shadcn/ui, recharts, dark theme, responsive
- [x] CLI: wizard, auto BTC price, port handling
- [x] Landing page: timecell.ai on Vercel
- [x] Logo, conviction ladder, currency support, shorthand numbers, info panel

---

## Distribution & Marketing (Icebox)
- [ ] Product Hunt launch
- [ ] Twitter/X content — demo GIF, thread explaining the framework
- [ ] Blog post — "Why crash survival matters more than returns"
- [ ] Install instructions page — timecell.ai/install with screenshots
- [ ] npm package README with screenshots
