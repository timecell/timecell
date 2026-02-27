// =============================================================================
// Position Sizing (Framework Part 3)
// =============================================================================
// Determines how to move from current BTC allocation to target allocation,
// including DCA strategy and post-reallocation ruin test.

import { ruinTest } from "./ruin-test.js";
import type { PortfolioInput } from "./types.js";

// -----------------------------------------------------------------------------
// Conviction ladder rung thresholds (mirrors ConvictionLadder.tsx)
// -----------------------------------------------------------------------------
const RUNGS = [
	{ level: 6, name: "Single-Asset Core", min: 50 },
	{ level: 5, name: "Owner-Class", min: 25 },
	{ level: 4, name: "High Conviction", min: 10 },
	{ level: 3, name: "Diversifier", min: 5 },
	{ level: 2, name: "Experimenter", min: 1 },
	{ level: 1, name: "Observer", min: 0 },
] as const;

export function getConvictionRung(btcPct: number): string {
	for (const rung of RUNGS) {
		if (btcPct >= rung.min) return rung.name;
	}
	return "Observer";
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface PositionSizingInput {
	totalValueUsd: number;
	currentBtcPct: number; // 0-100
	targetBtcPct: number; // 0-100
	monthlyBurnUsd: number;
	liquidReserveUsd: number;
	btcPriceUsd: number;
	dcaMonths?: number; // default 6
}

export interface PositionSizingResult {
	/** Current BTC exposure in USD */
	currentBtcUsd: number;
	/** Target BTC exposure in USD */
	targetBtcUsd: number;
	/** Amount to buy (positive) or sell (negative) in USD */
	gapUsd: number;
	/** Amount to buy (positive) or sell (negative) in BTC */
	gapBtc: number;
	/** If DCA: monthly buy/sell amount in USD */
	dcaMonthlyUsd: number;
	/** If DCA: monthly buy/sell amount in BTC */
	dcaMonthlyBtc: number;
	/** Number of DCA months used in calculation */
	dcaMonths: number;
	/** Whether the ruin test passes after reallocation */
	postReallocationRuinTest: boolean;
	/** Post-reallocation runway (months) */
	postReallocationRunwayMonths: number;
	/** Conviction ladder rung name for the TARGET allocation */
	convictionRung: string;
	/** Conviction ladder rung name for the CURRENT allocation */
	currentConvictionRung: string;
}

// -----------------------------------------------------------------------------
// Core calculation
// -----------------------------------------------------------------------------

/**
 * Calculate position sizing: gap analysis, DCA schedule, and post-reallocation
 * ruin test for moving from current BTC% to target BTC%.
 *
 * Pure function — no side effects.
 */
export function calculatePositionSizing(input: PositionSizingInput): PositionSizingResult {
	const {
		totalValueUsd,
		currentBtcPct,
		targetBtcPct,
		monthlyBurnUsd,
		liquidReserveUsd,
		btcPriceUsd,
		dcaMonths = 6,
	} = input;

	// Absolute USD values
	const currentBtcUsd = totalValueUsd * (currentBtcPct / 100);
	const targetBtcUsd = totalValueUsd * (targetBtcPct / 100);

	// Gap: positive = need to buy more BTC, negative = need to sell BTC
	const gapUsd = targetBtcUsd - currentBtcUsd;
	const gapBtc = btcPriceUsd > 0 ? gapUsd / btcPriceUsd : 0;

	// DCA breakdown
	const months = Math.max(1, dcaMonths);
	const dcaMonthlyUsd = gapUsd / months;
	const dcaMonthlyBtc = btcPriceUsd > 0 ? dcaMonthlyUsd / btcPriceUsd : 0;

	// Post-reallocation ruin test
	// After fully reallocating, portfolio still has the same totalValue —
	// we just re-run the ruin test with the target BTC%.
	const postPortfolio: PortfolioInput = {
		totalValueUsd,
		btcPercentage: targetBtcPct,
		monthlyBurnUsd,
		liquidReserveUsd,
		btcPriceUsd,
	};

	const ruinResult = ruinTest(postPortfolio);

	return {
		currentBtcUsd,
		targetBtcUsd,
		gapUsd,
		gapBtc,
		dcaMonthlyUsd,
		dcaMonthlyBtc,
		dcaMonths: months,
		postReallocationRuinTest: ruinResult.passed,
		postReallocationRunwayMonths: ruinResult.runwayMonths,
		convictionRung: getConvictionRung(targetBtcPct),
		currentConvictionRung: getConvictionRung(currentBtcPct),
	};
}
