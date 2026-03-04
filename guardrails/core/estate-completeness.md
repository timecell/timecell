# Estate Completeness
layer: core
type: checklist

## Purpose
Ensure basic estate planning documents exist. Without these, assets may be frozen or distributed contrary to wishes upon death or incapacity.

## Required Documents
- [ ] Will — directs asset distribution
- [ ] Power of Attorney (Financial) — someone can manage finances if incapacitated
- [ ] Power of Attorney (Medical/Healthcare Directive) — someone can make medical decisions
- [ ] Beneficiary Designations — on all accounts that support them
- [ ] Digital Asset Plan — access instructions for crypto, passwords, 2FA

## Zones
- CRITICAL: 0-1 of 5 complete — "Your family has no protection. This is urgent."
- WARNING: 2-3 of 5 complete — "Partial coverage. Gaps create risk."
- SAFE: 4-5 of 5 complete — "Well-protected."

## Default Threshold
value: 4
unit: documents out of 5
source: core
reasoning: "Estate planning is the most neglected area of family office management. Every adult with assets needs at minimum a will and POA."

## How Assessed
Check profile.md for estate planning fields. If fields are empty or missing, flag as incomplete.

## Actions When Breached
- CRITICAL: Top priority in /start. Recommend finding an estate attorney this week.
- WARNING: Include in /monthly review. List specific missing documents.

## User Override
Users can add jurisdiction-specific requirements in guardrails/user/estate-completeness.md.
