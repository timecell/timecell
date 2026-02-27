import type { PortfolioInput, HedgePosition } from "./types.js";
import { calculateCrashSurvival } from "./crash-survival.js";

// =============================================================================
// Ruin Test (Framework Part 3, Step 3)
// =============================================================================

/**
 * The Ruin Test from Bitcoin Investing Framework v2:
 *
 * "If Bitcoin drops 80% AND your other assets drop 40% simultaneously
 *  — as happened in 2022 — do you survive? Can you meet all obligations?"
 *
 * Returns true if you survive the worst-case correlated crash.
 */
export function ruinTest(
	portfolio: PortfolioInput,
	hedgePositions: HedgePosition[] = [],
): {
	passed: boolean;
	runwayMonths: number;
	portfolioValueAfterCrash: number;
	netPosition: number;
	hedgePayoff: number;
} {
	const result = calculateCrashSurvival(portfolio, hedgePositions, { drawdowns: [80] });
	const scenario = result.scenarios[0];

	return {
		passed: scenario.survivalStatus !== "critical",
		runwayMonths: scenario.runwayMonths,
		portfolioValueAfterCrash: scenario.portfolioValueAfterCrash,
		netPosition: scenario.netPosition,
		hedgePayoff: scenario.hedgePayoff,
	};
}
