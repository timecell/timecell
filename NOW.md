# NOW — TimeCell Development

**Updated:** 2026-03-04 (Session 1 — v0.1 "Mirror" build)

---

## Shipped Today (v0.1)
- 71 files: 5 primitives × 3 layers + bitcoin-fo pack + 6 skills + engine bridge
- Dynamic pack section injection (packs extend cadence skills, not create new ones)
- Priority ranking algorithm in /start, 7-node verdict decision tree in /check
- Integration infrastructure (7 files, documentation-only for v0.1)
- Test scripts: structural validation (61 checks) + engine bridge (15 functions)
- Slash commands registered in .claude/commands/
- Auto-detect onboarding on first message

## Known Issues (from testing today)
- [ ] `calculateTemperatureAdjustedDCA` bridge mapping incorrect — passes number where DCAInput object expected
- [ ] 2 pre-existing engine test failures in crash-survival.test.ts
- [ ] No eval harness for skill quality testing yet

---

## Backlog (captured from Session 1)

### Next Session (v0.1 polish)
1. **Eval harness for skills** — Python script that simulates user conversations against CLAUDE.md + skills, checks output for required sections. Enables iterating on skill quality without manual testing.
2. **Test-drive /setup end-to-end** — Run through onboarding as a new user, fix what breaks.
3. **Fix engine bridge arg mappings** — calculateTemperatureAdjustedDCA and verify all 14 functions match actual TypeScript signatures.

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
1. **Mar 4 Session 1** — Built v0.1 "Mirror" from plan. 4 parallel agents created 50 files. Added pack section injection, priority ranking, verdict logic. Added integration infrastructure (7 files). Created test scripts. Fixed engine bridge. Registered slash commands. Pushed to github.com/timecell/timecell.
