# Bitcoin Family Office Pack
version: 0.1.0
author: TimeCell
description: Opinionated framework for Bitcoin-conviction family offices
requires_engine: true

## Overview
This pack is for investors who view Bitcoin as a core long-term holding, not a speculative trade. It adds Bitcoin-specific metrics, guardrails, strategies, and bucket definitions to the core TimeCell framework.

## What This Pack Adds
- 3 metrics: temperature, MVRV, drawdown %
- 3 guardrails: no leverage, sovereign custody floor, max BTC concentration
- 3 strategies: selling tiers, crash deployment, DCA schedule
- 6 buckets: Safety Floor, Core Conviction, Growth Engine, Moonshots, Hard Assets, Lifestyle Fund
- 3 entity templates: cold wallet, exchange account, custodian

## Cadence Extensions
This pack extends (not replaces) core skills:
- /start: temperature reading, MVRV zone, DCA execution status
- /weekly: on-chain trend summary, temperature trajectory
- /monthly: cycle positioning, halving timeline, temperature-based strategy adjustments
- /check: real-time temperature, BTC-specific stress scenarios

## Installation
Pre-installed with TimeCell. To remove: delete packs/bitcoin-fo/ directory.
To disable without deleting: set `active_pack: none` in memory/profile.md.
