# Entity Schema

Every entity file in entities/ must follow this structure.

## Required Fields

- name: Human-readable name
- type: account | trust | wallet | custodian | advisor | person | company | property
- layer: core | pack | user
- jurisdiction: Country/state (if applicable)

## Structure

### Identity
- name:
- type:
- layer:
- created:
- updated:

### Details
[Type-specific fields — varies by entity type]

### Relationships
[Links to other entities using relationship-types.md]
- owner: [entity]
- custodian: [entity]
- beneficiary: [entity]
- advisor: [entity]

### Holdings
[For account/wallet types — what assets are held here]
- asset:
- quantity:
- value_usd:
- bucket: [which bucket this is allocated to]

### Notes
[Free text — context, history, decisions]

## Type-Specific Fields

### account
- institution:
- account_number: [last 4 digits only]
- account_type: brokerage | savings | checking | retirement | crypto
- currency:

### trust
- trust_type: revocable | irrevocable | family | business
- grantor:
- trustee:
- beneficiaries:
- formation_date:

### wallet
- wallet_type: hardware | software | multisig | paper
- custody: self | third-party | collaborative
- network: bitcoin | ethereum | multi
- verification_method: [how to verify holdings]

### custodian
- custodian_type: exchange | bank | broker | self
- insurance: [coverage details]
- withdrawal_limits:
- verification_url:

### advisor
- role: attorney | accountant | financial_advisor | tax_advisor | insurance
- firm:
- contact:
- engagement: retainer | project | hourly

### person
- role: family_member | business_partner | trustee | beneficiary
- relationship:
- contact:

### company
- company_type: operating | holding | LLC | corporation
- registration:
- ownership:

### property
- property_type: residential | commercial | land
- location:
- value_usd:
- mortgage:
