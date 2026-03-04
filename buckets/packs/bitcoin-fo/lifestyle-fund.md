# Lifestyle Fund
layer: pack

## Goal
Next big purchase. Earmarked savings for specific lifestyle goals — car, house, travel, education.

## Goal Type
binary

## Target
- threshold: varies per goal
- unit: usd
- source: user-set (each goal has its own target)
- reasoning: "Separating lifestyle goals from investment capital prevents emotional selling. You know exactly how much is earmarked."

## Eligible Assets
- Cash
- Money market funds
- Short-term bonds
- Stablecoins
- Any liquid, low-volatility asset

## NOT Eligible
- Equities (too volatile for near-term goals)
- Cryptocurrency (too volatile)
- Illiquid assets

## Key Metrics
- goal_progress: current_value / target_value per goal
- time_to_goal: months until target date

## Goals (User-Defined)
Each goal is a sub-entry:
- name: [e.g., "Melbourne House"]
- target_usd: [e.g., 4,000,000]
- target_date: [e.g., 2027-06]
- current_value: [e.g., 1,200,000]
- status: saving | funded | completed

## Provenance
source: pack (structure), user-set (individual goals)
reasoning: "Lifestyle goals deserve their own bucket so you never raid your conviction position for a car."
