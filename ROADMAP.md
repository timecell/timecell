# TimeCell — Product Roadmap

**Last updated:** 2026-02-28 10:00 IST
**Source of truth:** Bitcoin Investing Framework v2 (`docs/bitcoin-investing-framework-v2.md`)
**Vision:** Turn the framework's decision tree into an interactive product. Data → Understanding → Action.

---

## Guiding Principle

The framework is a 10-part decision system. The product should walk users through it:
1. **Where am I?** (crash survival, temperature, conviction rung)
2. **Am I safe?** (ruin test, runway, capacity gate)
3. **What should I do?** (action plan based on all inputs)

Every screen should end with an ACTION, not just a number.

---

## NOW — Integrate & Ship (v0.2)

Components are built but not wired together. Priority: integrate into dashboard, deploy hosted version.

- [ ] **Integrate new components into App.tsx** — wire temperature gauge, position sizing, BTC ticker, into the 4-zone layout
- [ ] **Deploy hosted web app** — Vercel config is ready, just needs deploy. timecell.ai/app = zero install
- [ ] **"What Should I Do?" action plan engine** — THE differentiator. Based on all inputs (portfolio, conviction, temperature, ruin test), output 3-5 personalized action bullets. Framework decision tree as code. (See Architecture section below)
- [ ] **One-page report card** — single summary view: survival score, ruin test, conviction rung, temperature, action plan. Screenshot-friendly, PDF-exportable, shareable with advisors.

---

## NEXT — Framework Depth (v0.3)

Make the product cover the full position sizing process (Framework Part 3).

- [ ] **Guided first-run flow** — Questions not sliders: "What's your net worth?" → "How much is liquid?" → "What % is BTC?" → reveal dashboard with YOUR numbers. Sliders become "what if" tools after the reveal.
- [ ] **Capacity gate inputs** — Framework Part 3 Step 2. Age/income proxy, withdrawal horizon, liability schedule. `Effective Allocation = min(Conviction Rung, Capacity Ceiling)`
- [ ] **Interactive conviction gates** — At 25%+, show checkboxes: multi-cycle experience? 2yr expenses outside BTC? No forced-sale liabilities? Sleep test? Written triggers? If gates aren't met, warn clearly.
- [ ] **Sleep test display** — "If BTC drops 80% tomorrow, you lose $X. Does your life change?" Big, visceral number.
- [ ] **De-risk triggers** — Written rules UI: "If temperature > 80, sell X%. If ruin test fails, reduce to Y%." Framework Part 3 Step 5.
- [ ] **Temperature action labels** — Not just "55 — Neutral" but "Continue DCA at normal pace. Don't try to be clever."
- [ ] **"What If" comparison mode** — Split screen: current allocation vs proposed. See both crash survival states side by side.

---

## LATER — Polish & Distribution (v0.4+)

- [ ] **Desktop app** (Electron or Tauri) — download .dmg/.exe, no terminal
- [ ] **Export/share PDF** — one-page report card as downloadable PDF
- [ ] **Live MVRV/RHODL data** — replace mock temperature with real on-chain feeds
- [ ] **Currency conversion with live rates** — auto-fetch INR/USD/EUR
- [ ] **Historical crash overlay** — show where current scenario maps to 2018, 2022
- [ ] **DCA calculator** — Framework Part 4: model regular buying outcomes
- [ ] **4-year moving average chart** — Framework Part 4.3: price floor visualization
- [ ] **Hedge/insurance configuration UI** — Framework Part 6: set put option parameters, see budget impact
- [ ] **Portfolio history** — SQLite persistence, "what changed since last visit"
- [ ] **Multiple portfolios** — save/compare different allocation strategies
- [ ] **Market sentiment** — Fear & Greed index alongside temperature
- [ ] **Mobile-optimized UX** — larger touch targets, better slider controls

---

## ICEBOX — Distribution & Marketing

- [ ] Product Hunt launch
- [ ] Twitter/X content — demo GIF, thread explaining the framework
- [ ] Blog post — "Why crash survival matters more than returns"
- [ ] Install instructions page — timecell.ai/install with screenshots
- [ ] npm package README with screenshots
- [ ] CI/CD pipeline — GitHub Actions for test + publish
- [ ] WASM compilation of engine — pure browser, no API at all

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

## DONE

### Session 4 — Feb 28
- [x] Dashboard UX redesign — hero survival score, 4-zone layout, collapsible details
- [x] Hosted web app infrastructure — standalone mode, Vercel config, engine runs client-side
- [x] Temperature gauge — engine function + API route + SVG gauge component
- [x] Position sizing — engine function + 20 tests + API route + UI with sliders
- [x] Live BTC price — hook + ticker component, auto-refresh, price flash
- [x] Framework reference — Bitcoin Investing Framework v2 in docs/
- [x] npm automation token — passkey-free publishing
- [x] Fastify logger cleanup — no more JSON spam in terminal
- [x] All packages published v0.1.2
- [x] Engine: 37 tests passing (17 crash + 20 position sizing)

### Session 3 — Feb 27
- [x] Logo, conviction ladder, currency support, shorthand numbers, info panel, saved indicator

### Sessions 1-2 — Feb 27
- [x] Full monorepo scaffolding, all packages published v0.1.1
- [x] Engine: crash survival, ruin test, runway, hedge payoff, CAGR
- [x] Dashboard: shadcn/ui, recharts, dark theme, responsive
- [x] CLI: wizard, auto BTC price, port handling
- [x] Landing page: timecell.ai on Vercel

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
