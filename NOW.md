# NOW — TimeCell Development

**Updated:** 2026-03-04 (Session 2 — Eval framework + skill quality testing)

---

## Shipped Today (v0.1)
- 71 files: 5 primitives × 3 layers + bitcoin-fo pack + 6 skills + engine bridge
- Dynamic pack section injection (packs extend cadence skills, not create new ones)
- Priority ranking algorithm in /start, 7-node verdict decision tree in /check
- Integration infrastructure (7 files, documentation-only for v0.1)
- Test scripts: structural validation (61 checks) + engine bridge (15 functions)
- Slash commands registered in .claude/commands/
- Auto-detect onboarding on first message

## Shipped Session 2
- Compounding eval framework: `scripts/evals/` with eval-runner.py, 5 test cases, LLM-as-judge scoring
- Ran full eval suite against API: 3/5 cases perfect (promoted to golden baselines), 2/5 near-pass (88-94%)
- Fixed /setup skill: added conversation flow rules to prevent investigation loops
- LLM-as-judge catches real quality issues (model continues asking questions instead of transitioning between steps)

## Known Issues
- [ ] `calculateTemperatureAdjustedDCA` bridge mapping incorrect — passes number where DCAInput object expected
- [ ] 2 pre-existing engine test failures in crash-survival.test.ts
- [ ] /setup completion transition needs more work — model sometimes opens new investigation lines instead of wrapping up (eval score: 88-94%)

---

## Backlog (captured from Session 1)

### Next Session (v0.1 polish)
1. ~~**Eval harness for skills**~~ — DONE. `scripts/evals/eval-runner.py` with LLM-as-judge + keyword checks + golden baselines + regression.
2. **Test-drive /setup end-to-end** — Human testing still needed. Run through onboarding as a new user with the skill flow improvements.
3. **Fix engine bridge arg mappings** — calculateTemperatureAdjustedDCA and verify all 14 functions match actual TypeScript signatures.
4. **Iterate on /setup quality** — Run eval, score, fix skill, re-run until setup-btc-investor and setup-traditional-investor both score 100%.

### v0.2 Scope (from plan + session discussions)
4. **Integration packs as independent packs** — BMPRO, CoinGecko, Google Sheets, FRED, Deribit become their own packs (not bundled inside bitcoin-fo). Opinion packs RECOMMEND integration packs.
5. **API key onboarding in /setup** — "Which data sources do you want to connect?" flow, guide key setup, store references in config.
6. **Skill deep-dive** — Detailed design pass on /setup portfolio data entry (manual vs import), /start priority ranking in practice, /check verdict edge cases.
7. **Hedge positions / options strategies** — Per roadmap v0.2 "Lens"
8. **Decision learning loop** — strategy → decision → retro → update

### Build in Public (audience strategy — not yet planned)
9. **Build-in-public plan** — Strategy for building audience alongside v0.1. What to share, where to share, cadence. Needs dedicated planning session.
10. **Landing page** — Simple timecell.dev with README content + "star the repo." Not a priority until there are users to send to it.
11. **Daily website updates** — Decided: overkill for v0.1. Revisit when there's a site.

### v0.3+ (from roadmap)
12. Multi-asset modules beyond Bitcoin (v0.3 "Gravity")
13. Signals/alerts/monitoring (v0.4 "Signal") — this is when auto-sync/cron lands
14. Community skills marketplace + pack installer (v0.5)
15. Static HTML export (v0.6 "Atlas")
16. Cron/autonomous monitoring (v0.7 "Lighthouse")

---

## Last 3 Sessions
1. **Mar 4 Session 2** — Built eval framework with LLM-as-judge. Ran 5 test cases against API. 3 golden baselines established. Fixed /setup skill flow rules. Keyword evals too brittle — LLM judge catches real quality issues.
2. **Mar 4 Session 1** — Built v0.1 "Mirror" from plan. 4 parallel agents created 50 files. Added pack section injection, priority ranking, verdict logic. Added integration infrastructure (7 files). Created test scripts. Fixed engine bridge. Registered slash commands. Pushed to github.com/timecell/timecell.
