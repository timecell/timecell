// =============================================================================
// Historical Crash Overlay
// =============================================================================

import type { PortfolioInput } from "./types.js";
import { calculateRunwayMonths } from "./runway.js";

/** A real Bitcoin bear market event with verified drawdown data */
export interface HistoricalCrash {
	name: string;
	peakDate: string;
	troughDate: string;
	peakPrice: number;
	troughPrice: number;
	drawdown: number; // percentage, e.g. 85.2
	recoveryMonths: number;
}

/** Result of simulating a historical crash against the user's portfolio */
export interface HistoricalCrashResult {
	crash: HistoricalCrash;
	portfolioValueAtTrough: number;
	btcLoss: number;
	otherAssetsLoss: number;
	totalLoss: number;
	runwayMonths: number;
	survived: boolean;
}

/** All four major Bitcoin crash events */
export const HISTORICAL_CRASHES: HistoricalCrash[] = [
	{
		name: "2014 Mt. Gox",
		peakDate: "2013-12",
		troughDate: "2015-01",
		peakPrice: 1150,
		troughPrice: 170,
		drawdown: 85.2,
		recoveryMonths: 36,
	},
	{
		name: "2018 ICO Bust",
		peakDate: "2017-12",
		troughDate: "2018-12",
		peakPrice: 19783,
		troughPrice: 3122,
		drawdown: 84.2,
		recoveryMonths: 36,
	},
	{
		name: "2022 LUNA/FTX",
		peakDate: "2021-11",
		troughDate: "2022-11",
		peakPrice: 68789,
		troughPrice: 15476,
		drawdown: 77.5,
		recoveryMonths: 25,
	},
	{
		name: "COVID 2020",
		peakDate: "2020-02",
		troughDate: "2020-03",
		peakPrice: 10500,
		troughPrice: 3850,
		drawdown: 63.3,
		recoveryMonths: 7,
	},
];

/**
 * Survival threshold in months. A portfolio must have at least this much runway
 * after a crash to be considered "survived".
 */
export const SURVIVAL_RUNWAY_MONTHS = 18;

/**
 * Simulate what would happen to a portfolio during a specific historical crash.
 *
 * Applies the crash's actual drawdown % to the BTC portion.
 * Applies 50% of the BTC drawdown to other assets (correlation model).
 * Calculates runway from remaining portfolio value + liquid reserve.
 * survived = runway >= 18 months.
 */
export function simulateHistoricalCrash(
	portfolio: PortfolioInput,
	crash: HistoricalCrash,
): HistoricalCrashResult {
	const btcDrawdownFraction = crash.drawdown / 100;
	const otherAssetsDrawdownFraction = btcDrawdownFraction * 0.5;

	const btcValue = portfolio.totalValueUsd * (portfolio.btcPercentage / 100);
	const otherAssetsValue = portfolio.totalValueUsd - btcValue;

	const btcValueAtTrough = btcValue * (1 - btcDrawdownFraction);
	const otherAssetsValueAtTrough = otherAssetsValue * (1 - otherAssetsDrawdownFraction);

	const portfolioValueAtTrough = btcValueAtTrough + otherAssetsValueAtTrough;

	const btcLoss = btcValue - btcValueAtTrough;
	const otherAssetsLoss = otherAssetsValue - otherAssetsValueAtTrough;
	const totalLoss = btcLoss + otherAssetsLoss;

	// Runway: liquidate everything at trough prices + draw on liquid reserve
	const netPosition = portfolioValueAtTrough + portfolio.liquidReserveUsd;
	const runwayMonths = calculateRunwayMonths(netPosition, portfolio.monthlyBurnUsd);

	const survived = runwayMonths >= SURVIVAL_RUNWAY_MONTHS;

	return {
		crash,
		portfolioValueAtTrough,
		btcLoss,
		otherAssetsLoss,
		totalLoss,
		runwayMonths,
		survived,
	};
}

/**
 * Simulate all historical crashes against a portfolio.
 * Returns results sorted by crash drawdown descending (worst first).
 */
export function simulateAllHistoricalCrashes(portfolio: PortfolioInput): HistoricalCrashResult[] {
	return HISTORICAL_CRASHES.map((crash) => simulateHistoricalCrash(portfolio, crash)).sort(
		(a, b) => b.crash.drawdown - a.crash.drawdown,
	);
}
