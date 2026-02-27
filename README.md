# TimeCell

Crash survival calculator for Bitcoin investors. Know exactly how much crash you can survive before you need to sell.

**Local-first. Your data stays on your machine.**

## What it does

- Models portfolio impact across 30%, 50%, 70%, and 80% BTC crash scenarios
- Calculates runway (months of burn covered) for each scenario
- Runs the **Ruin Test**: if BTC drops 80% AND other assets drop 40%, do you survive?
- Computes geometric mean CAGR for hedged vs unhedged portfolios (Spitznagel method)

## Quick start

```bash
npx timecell
```

This launches an interactive wizard, starts a local server, and opens the dashboard in your browser.

## Development

```bash
git clone https://github.com/timecell/timecell.git
cd timecell
npm install
npm run dev     # starts API + web dashboard
npm test        # runs engine tests
```

## Project structure

```
packages/
  engine/   — Pure TypeScript math (zero dependencies)
  api/      — Fastify server
  web/      — React + Tailwind dashboard
  cli/      — Interactive CLI wizard
site/       — Landing page (timecell.ai)
```

## Tech stack

- TypeScript throughout
- Fastify API server
- React + Vite + Tailwind CSS v4
- Vitest for testing
- SQLite for local persistence (planned)

## License

MIT
