// =============================================================================
// Sleep Test — Framework Part 3, Step 6
// =============================================================================
// "Take your planned allocation. Imagine an 80% drawdown tomorrow.
//  Calculate the dollar loss. Say it out loud. If you flinch: reduce until you don't."

/** Input for the sleep test calculation */
export interface SleepTestInput {
	totalPortfolioValue: number; // total portfolio in USD
	btcPercentage: number; // current or proposed BTC allocation (0-100)
	btcDrawdown?: number; // default 80%
	otherAssetsDrawdown?: number; // default 40% (correlation model)
}

/** Result of the sleep test calculation */
export interface SleepTestResult {
	currentBtcValue: number; // how much BTC you hold now
	btcLoss: number; // dollar loss on BTC position
	otherAssetsLoss: number; // dollar loss on non-BTC
	totalLoss: number; // combined dollar loss
	postCrashValue: number; // portfolio value after crash
	lossPercentage: number; // total loss as % of portfolio (0-100)
	message: string; // human-readable gut-check message
}

const DEFAULT_BTC_DRAWDOWN = 80;
const DEFAULT_OTHER_ASSETS_DRAWDOWN = 40;

/**
 * Calculate the sleep test: what happens to your portfolio in a worst-case crash?
 *
 * Pure function. No side effects.
 *
 * Uses the framework correlation model: non-BTC assets drop at roughly
 * 50% of BTC's drawdown (default 40% when BTC drops 80%).
 */
export function calculateSleepTest(input: SleepTestInput): SleepTestResult {
	const { totalPortfolioValue, btcPercentage } = input;
	const btcDrawdown = input.btcDrawdown ?? DEFAULT_BTC_DRAWDOWN;
	const otherAssetsDrawdown = input.otherAssetsDrawdown ?? DEFAULT_OTHER_ASSETS_DRAWDOWN;

	const btcFraction = btcPercentage / 100;
	const currentBtcValue = totalPortfolioValue * btcFraction;
	const currentOtherValue = totalPortfolioValue - currentBtcValue;

	const btcLoss = currentBtcValue * (btcDrawdown / 100);
	const otherAssetsLoss = currentOtherValue * (otherAssetsDrawdown / 100);
	const totalLoss = btcLoss + otherAssetsLoss;
	const postCrashValue = totalPortfolioValue - totalLoss;
	const lossPercentage = totalPortfolioValue > 0 ? (totalLoss / totalPortfolioValue) * 100 : 0;

	const formattedLoss = formatUsd(totalLoss);
	const message = `If BTC drops ${btcDrawdown}% tomorrow, you lose ${formattedLoss}. Does your life change?`;

	return {
		currentBtcValue,
		btcLoss,
		otherAssetsLoss,
		totalLoss,
		postCrashValue,
		lossPercentage,
		message,
	};
}

/** Format a number as a compact USD string (e.g. $1,250,000) */
function formatUsd(value: number): string {
	return `$${Math.round(value).toLocaleString("en-US")}`;
}
