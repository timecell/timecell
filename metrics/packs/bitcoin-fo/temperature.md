# Bitcoin Temperature
layer: pack
type: computed

## Definition
Composite cycle indicator combining MVRV Z-Score (60%) and RHODL Ratio (40%). Ranges from 0 (extreme cold — deep bear) to 100 (extreme hot — cycle top).

## Formula
temperature = (normalize_mvrv(mvrv) * 0.6) + (normalize_rhodl(rhodl) * 0.4)

## Engine Function
calculateTemperature(mvrv: number, rhodl: number) → TemperatureResult

## Zones
- 0-15: COLD — "Deep value. Maximum accumulation zone."
- 15-40: COOL — "Below fair value. DCA aggressively."
- 40-60: WARM — "Fair value. Standard DCA."
- 60-80: HOT — "Above fair value. Begin selling ladder."
- 80-100: OVERHEATED — "Cycle top approaching. Execute selling rules."

## Data Sources
- MVRV Z-Score: on-chain data (external API or manual input)
- RHODL Ratio: on-chain data (external API or manual input)

## Used By
- strategies/packs/bitcoin-fo/selling-tiers.md (triggers selling)
- strategies/packs/bitcoin-fo/dca-schedule.md (adjusts DCA amounts)
- strategies/packs/bitcoin-fo/crash-deployment.md (opportunity detection)
- skills/core/start.md (daily snapshot — pack extension)
- skills/core/weekly.md (trajectory — pack extension)
