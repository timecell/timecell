# Exchange Account (Template)
layer: pack
type: account

## Identity
- name: [User fills — e.g., "Coinbase Prime"]
- type: account
- account_type: crypto
- institution: [exchange name]

## Details
- account_id: [last 4 characters only]
- tier: [verification level]
- withdrawal_limits: [daily/monthly limits]
- whitelisted_addresses: [yes/no]
- 2fa_method: [hardware key, authenticator, SMS]

## Security
- api_keys_active: [yes/no — for engine data feeds]
- withdrawal_whitelist_enabled: [yes/no]
- ip_whitelist: [yes/no]

## Relationships
- owner: [person entity]
- custodian: [exchange entity — self-referential for exchanges]

## Holdings
- asset: BTC
- quantity: [trading amount only — bulk should be in cold storage]
- value_usd: [computed]
- bucket: [typically Growth Engine or unallocated]

## Risk Notes
- Exchange custody is TEMPORARY for active trading only
- CIO flags if exchange-held BTC exceeds sovereign custody floor guardrail
