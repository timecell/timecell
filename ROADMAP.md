# TimeCell — Project Board

**Last updated:** 2026-02-27 12:15 IST
**Next milestone:** YPO Delhi Demo — Feb 28, 2:30 PM IST

---

## IN PROGRESS

- [ ] **Dashboard UX redesign** — too much data, needs hierarchy: hero survival score > sliders+chart > details below fold
- [ ] **Rebuild + republish to npm** (v0.1.2) — bundle all new features from this session
- [ ] **Verify new components** — conviction ladder, info panel, saved indicator, currency support render correctly

---

## PLANNED (Demo-Critical)

- [ ] **Demo dry run** — full walkthrough per demo-checklist.md, on projector, timed
- [ ] **Logo deploy to Vercel** — push site/ changes so timecell.ai shows logo
- [ ] **Currency default to INR for demo** — audience thinks in crores, show ₹ symbol
- [ ] **Hosted web version** (timecell.ai/app) — deploy dashboard to Vercel so YPO members can try with zero install. Static Vite build + serverless API. **Highest priority for post-demo distribution** — "open this URL on your phone" beats "install Node.js"

---

## DONE (This Session — Feb 27)

- [x] Logo integrated — dashboard header + landing page HTML/CSS (logo-v3-3, orange circle+dot)
- [x] Shorthand number parsing — CLI accepts `80m`, `5cr`, `25k`, `10l`, `1.5b`
- [x] "How it works" explainer panel — collapsible, explains crash model, survival threshold, ruin test, runway
- [x] Conviction Ladder — 6-rung display, highlights current allocation, gates warning at 25%+
- [x] Currency support — CLI wizard currency picker (USD/INR/EUR/GBP/SGD), dashboard shows selected symbol
- [x] "Saved" persistence indicator — green checkmark fades in/out after slider changes
- [x] Missing Radix UI deps fixed — @radix-ui/react-tooltip, slider, separator installed
- [x] npx @timecell/cli@0.1.1 tested — wizard starts, BTC price fetches, prompts work
- [x] Engine tests — 17/17 passing
- [x] API dist tested — dashboard serves, crash-survival endpoint returns correct data
- [x] Landing page verified — timecell.ai live, `npx @timecell/cli` command correct

## DONE (Previous Sessions)

- [x] All packages published to npm v0.1.1 (@timecell/engine, @timecell/api, @timecell/cli)
- [x] Dashboard: shadcn/ui, recharts crash chart, dark theme, favicon, mobile responsive
- [x] CLI: auto-fetches BTC price, accepts commas, finds available port, privacy message
- [x] API serves built web dashboard via @fastify/static (bundled in dist/web/)
- [x] Engine: crash survival, ruin test, runway calc, hedge payoff, CAGR
- [x] Landing page: timecell.ai deployed on Vercel
- [x] GitHub: github.com/timecell/timecell

---

## ICEBOX (Post-Demo / v0.2+)

### Product — Framework Features
- [ ] Temperature gauge — MVRV/RHODL 0-100, engine has it, needs dashboard UI
- [ ] Position sizing steps — framework Part 3, 6 steps from current to target allocation
- [ ] De-risk triggers — written rules: "if temperature > 80, reduce by X%"
- [ ] Hedge position UI — configure put options (engine supports it, no UI)
- [ ] Rebalancing calculator — from current to target allocation, with tax-aware suggestions
- [ ] Cycle tracker — which part of the cycle are we in? historical overlay

### Product — User Experience
- [ ] Empty state / first-run wizard — "Enter YOUR portfolio" guidance in dashboard
- [ ] Portfolio persistence feedback — "Saved" indicator more prominent
- [ ] Mobile slider UX — larger touch targets, better thumb controls
- [ ] Onboarding flow — guided tour of dashboard sections
- [ ] Export/share — PDF report of crash survival analysis
- [ ] Multiple portfolios — save/compare different allocation strategies
- [ ] "What should I do?" panel — actionable recommendations based on current position

### Product — Data & Intelligence
- [ ] Live BTC price feed in dashboard — auto-refresh, show last updated
- [ ] Historical crash overlay — show where current scenario maps to 2018, 2022 crashes
- [ ] Currency conversion with live rates — INR/USD/EUR with auto-fetch
- [ ] Market sentiment integration — Fear & Greed index alongside temperature

### Distribution & Access (Make it easy for non-tech users)
- [ ] **Hosted web app** (timecell.ai/app) — zero install, just open URL. Vite static build + Vercel serverless API. **Recommended first priority post-demo.** Nikesh-friendly.
- [ ] **Desktop app** (Electron or Tauri) — download .dmg/.exe, double-click, no terminal. High effort but best UX for recurring use.
- [ ] **One-line install script** — `curl timecell.ai/install | sh` installs Node + runs npx. Still needs terminal.
- [ ] **Install instructions page** — timecell.ai/install with step-by-step screenshots for Mac/Windows. Minimum viable for CLI distribution.
- [ ] npm package README with screenshots
- [ ] Product Hunt launch
- [ ] Twitter/X content — demo GIF, thread explaining the framework
- [ ] Blog post — "Why crash survival matters more than returns"
- [ ] YPO follow-up email template with personalized results

### Technical
- [ ] SQLite persistence — save portfolio history, track changes over time
- [ ] Better CLI error messages for non-technical users
- [ ] WASM compilation of engine — run in browser without API
- [ ] Test coverage for API routes
- [ ] CI/CD pipeline — GitHub Actions for test + publish
- [ ] Hosted mode — optional cloud deployment for teams (Postgres, auth)

---

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-02-27 | Currency: option 2 (with conversion) for long-term | Math is currency-agnostic, but INR users need ₹ display + live conversion |
| 2026-02-27 | Logo: v3-3 (orange circle+dot + wordmark) | Finalized after 5 rounds of iterations |
| 2026-02-27 | Number shorthand: simple suffix parsing, no AI | k/m/b/cr/l covers Western + Indian notation |
| 2026-02-27 | Dashboard UX: needs redesign — too data-heavy | Prioritize emotional impact for demo: survival score hero > interactive sliders > details |
| 2026-02-27 | Distribution: hosted web app is priority over CLI for non-tech users | Only dep for CLI is Node.js 18+ — blocker for YPO audience. timecell.ai/app = zero install |
