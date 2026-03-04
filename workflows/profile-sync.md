# Profile Sync (Internal Workflow)

## Purpose
Validates profile completeness and consistency. Used by /setup (completion check) and /start (pre-flight check).

## Completeness Check

### Required Fields (profile.md)
- [ ] Identity → name
- [ ] Identity → tax_jurisdiction
- [ ] Identity → life_context (free text)
- [ ] Portfolio Summary → total_value_usd
- [ ] Portfolio Summary → holdings_by_bucket (at least 1 bucket)
- [ ] Burn & Runway → monthly_burn_usd
- [ ] Burn & Runway → liquid_reserve_usd
- [ ] Goals (at least 1 goal)
- [ ] Risk Profile → risk_context
- [ ] CIO Preferences → communication_density
- [ ] CIO Preferences → challenge_level
- [ ] Active pack (can be 'none')

### Completeness Score
complete_fields / total_required_fields * 100

### Consistency Checks
1. total_value_usd should approximately equal sum of all entity holdings
2. liquid_reserve_usd should be <= total_value_usd
3. holdings_by_bucket should cover most of total_value_usd (small unallocated is ok)
4. monthly_burn_usd should be > 0
5. Active guardrails should reference valid files

## Actions
- If completeness < 100%: flag missing fields
- If consistency fails: flag specific mismatches
- Used by /setup to determine resume point
- Used by /start to warn about stale or incomplete data

## Output
Returns:
- completeness_pct: number
- missing_fields: list
- consistency_issues: list
- last_updated: date from profile.md
- stale: boolean (> 30 days since last update)
