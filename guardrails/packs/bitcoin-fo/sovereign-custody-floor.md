# Sovereign Custody Floor
layer: pack
type: threshold

## Purpose
Ensure a minimum percentage of BTC holdings are in self-custody (hardware wallet, multisig). Exchange-held BTC is someone else's Bitcoin until withdrawn.

## Zones
- CRITICAL: < 30% self-custody — "Most of your BTC is on exchanges. You don't own it."
- WARNING: 30-50% self-custody — "Custody concentration on exchanges is high."
- SAFE: 50-70% self-custody — "Reasonable self-custody ratio."
- STRONG: > 70% self-custody — "Sovereign. Your keys, your coins."

## Default Threshold
value: 50
unit: percent of BTC in self-custody
source: pack
reasoning: "At minimum, half your Bitcoin should be in your direct control. Exchanges can freeze accounts, get hacked, or go bankrupt."

## How Assessed
Sum BTC in entities where custody = 'self' (wallet_type: hardware, multisig).
Compare to total BTC holdings across all entities.
sovereign_pct = self_custody_btc / total_btc * 100

## Engine Function
calculateCustodyRisk(input: CustodyInput) → CustodyResult

## Actions When Breached
- CRITICAL: Priority action. "Move BTC to self-custody. Start with the largest exchange balance."
- WARNING: Include in /weekly. "Consider moving [amount] from [exchange] to cold storage."

## User Override
Users who prefer institutional custody (e.g., Coinbase Prime with insurance) can adjust threshold in guardrails/user/sovereign-custody-floor.md.
