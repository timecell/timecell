import type { PortfolioInput, HedgePosition } from "../types.js";

// =============================================================================
// Demo Portfolio — Realistic YPO-relevant example
// =============================================================================

/** Default BTC price for demo — only used if live fetch fails */
export const DEMO_BTC_PRICE = 67000;

/** Demo portfolio: $5M, 35% BTC, $25K/mo burn, $600K liquid reserve */
export const DEMO_PORTFOLIO: PortfolioInput = {
	totalValueUsd: 5_000_000,
	btcPercentage: 35,
	monthlyBurnUsd: 25_000,
	liquidReserveUsd: 600_000,
	btcPriceUsd: DEMO_BTC_PRICE,
};

/** Demo hedge positions (optional — shows with vs without insurance) */
export const DEMO_HEDGE_POSITIONS: HedgePosition[] = [
	{
		strikeUsd: 60_000,
		quantityBtc: 10,
		expiryDate: "2026-09-30",
	},
];

/** Portfolio with no hedge — for comparison */
export const DEMO_PORTFOLIO_NO_HEDGE: HedgePosition[] = [];
