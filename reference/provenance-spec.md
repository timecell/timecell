# ConfigurableThreshold with Provenance

Every user-modifiable value in TimeCell tracks where it came from and why.

## Provenance Fields

### source
Where this value originated:
- `core` — Built into TimeCell. Universal default that applies to every family office.
- `pack` — From an active community pack (e.g., bitcoin-fo). Represents expert opinion.
- `recommended` — CIO suggested this value during a session based on analysis.
- `user-set` — User explicitly chose this value. Highest precedence.

### reasoning
Why this value was chosen. Plain language explanation.
- Core: "12 months covers most disruptions without panic selling."
- Pack: "Bitcoin-conviction investors accept higher concentration as a feature, not a bug."
- Recommended: "Based on your $100K/month burn and $1.8M liquid reserves, 18 months is your current threshold."
- User-set: "I want 24 months runway because I sleep better with extra buffer."

### set_during
Which skill or session established this value.
- "/setup" — Set during initial onboarding
- "/ask — 2024-03-15" — Changed during a conversation
- "/monthly — 2024-02-28" — Adjusted during monthly review

## Override Precedence

User > Pack > Core

When the same value exists at multiple layers:
1. Check user/ — if exists, use it
2. Check packs/<active-pack>/ — if exists, use it
3. Fall back to core/

## Display Convention

When showing a value to the user, always indicate its source:
- "Min runway: 18 months (pack default — bitcoin-fo)"
- "Max concentration: 70% (you set this during /setup)"
- "Estate completeness: 4/5 (core default)"

## Changing Values

Users change values conversationally through /ask:
- "I want to change my runway minimum to 24 months"
- CIO confirms, updates the user/ file, logs to decisions.md

Or during calibration in /setup:
- CIO shows default → user agrees or adjusts → saved with provenance
