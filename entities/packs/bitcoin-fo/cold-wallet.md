# Cold Wallet (Template)
layer: pack
type: wallet

## Identity
- name: [User fills — e.g., "Primary Coldcard"]
- type: wallet
- wallet_type: hardware
- custody: self
- network: bitcoin

## Details
- device: [Coldcard, Ledger, Trezor, Foundation Passport, etc.]
- firmware_version: [last verified]
- seed_backup: [location — e.g., "steel plate in safety deposit box"]
- passphrase: [yes/no — NOT the actual passphrase]
- multisig: [yes/no — if yes, link to multisig setup entity]

## Verification
- method: [how to verify — e.g., "plug in device, check address matches"]
- last_verified: [date]
- verification_frequency: quarterly

## Relationships
- owner: [person entity]
- successor: [person entity — who gets access if owner is incapacitated]

## Holdings
- asset: BTC
- quantity: [amount]
- value_usd: [computed]
- bucket: Core Conviction

## Notes
[Setup history, firmware update log, any incidents]
