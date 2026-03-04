# Pack Template

Use this template to create community packs in packs/<pack-name>/.

## Required Files

```
packs/<pack-name>/
├── pack.md           # Pack metadata
├── beliefs.md        # Core beliefs injected into CIO persona
├── entities/         # Entity templates (optional)
├── metrics/          # Pack-specific metrics (optional)
├── guardrails/       # Pack-specific constraints (optional)
├── strategies/       # Pack-specific decision frameworks (optional)
└── buckets/          # Pack-specific allocation targets (optional)
```

## pack.md Template

```markdown
# [Pack Name]
version: 0.1.0
author: [Author]
description: [What this pack adds]
requires_engine: true | false

## Overview
[What this pack is for — who should use it]

## What This Pack Adds
[List of primitives added: metrics, guardrails, strategies, buckets, entities]

## Cadence Extensions
[What sections this pack adds to core skills: /start, /weekly, /monthly, /check]

## Installation
Copy to packs/<name>/. Set active_pack in memory/profile.md.
```

## beliefs.md Template

```markdown
# [Pack Name] — Core Beliefs

These beliefs are injected into the CIO persona when this pack is active.

## Beliefs
1. **[Belief name].** [Explanation — 1-2 sentences]
2. **[Belief name].** [Explanation]
...
```

## Guidelines
- Packs ADD to the framework, never modify core/
- Pack opinions are starting points — users override in user/
- Keep beliefs to 5-10 statements
- Each guardrail should explain WHY, not just WHAT
- Every value needs provenance (source, reasoning)
- Packs extend cadence skills (add sections), don't create new skills
