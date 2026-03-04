# Custodian Entity (Template)
layer: pack
type: custodian

## Identity
- name: [e.g., "Coinbase", "Fidelity", "Self-Custody"]
- type: custodian
- custodian_type: exchange | bank | broker | self

## Details
- jurisdiction: [where regulated]
- insurance_coverage: [amount and type]
- proof_of_reserves: [yes/no — link if available]
- regulatory_status: [licensed, registered, unregulated]

## Assets Under Custody
[List of entity files custodied here]
- [[Entity 1]] — $X
- [[Entity 2]] — $Y
- Total: $Z (N% of portfolio)

## Risk Assessment
- concentration_pct: [computed — % of total portfolio here]
- single_point_of_failure: [yes if > max-single-custodian threshold]
- custody_risk_level: [from engine: calculateCustodyRisk]

## Verification
- method: [login and check balance, API, statement]
- last_verified: [date]
- verification_frequency: monthly

## Notes
[History, incidents, policy changes]
