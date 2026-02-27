import type {
	PortfolioInput,
	HedgePosition,
	CrashScenario,
	SurvivalResult,
	CrashSurvivalConfig,
} from "./types.js";
import { calculateRunwayMonths } from "./runway.js";

// =============================================================================
// Crash Survival Calculator
// =============================================================================

/** Default configuration — all values overridable */
export const DEFAULT_CONFIG: CrashSurvivalConfig = {
	drawdowns: [30, 50, 70, 80],
	nonBtcCorrelation: 0.5,
	runwayWarningMonths: 24,
	runwayCriticalMonths: 18,
};

/**
 * Calculate crash survival across multiple drawdown scenarios.
 *
 * For each scenario:
 * - BTC drops by drawdownPct%
 * - Non-BTC assets drop by drawdownPct * config.nonBtcCorrelation
 * - Hedge payoff = sum of max(0, strike - crashPrice) * quantity for each position
 * - Runway = (portfolio after crash + hedge payoff + liquid reserve) / monthly burn
 * - Survival status based on runway vs config thresholds
 */
export function calculateCrashSurvival(
	portfolio: PortfolioInput,
	hedgePositions: HedgePosition[] = [],
	config: Partial<CrashSurvivalConfig> = {},
): SurvivalResult {
	const cfg = { ...DEFAULT_CONFIG, ...config };
	const btcValue = portfolio.totalValueUsd * (portfolio.btcPercentage / 100);
	const nonBtcValue = portfolio.totalValueUsd - btcValue;

	const scenarios = cfg.drawdowns.map((drawdownPct) =>
		calculateScenario(portfolio, btcValue, nonBtcValue, drawdownPct, hedgePositions, cfg),
	);

	// Find max survivable drawdown (highest where status is not critical)
	const survivable = scenarios.filter((s) => s.survivalStatus !== "critical");
	const maxSurvivableDrawdown =
		survivable.length > 0 ? Math.max(...survivable.map((s) => s.drawdownPct)) : 0;

	// Ruin test: survive highest drawdown scenario
	const worstScenario = scenarios[scenarios.length - 1];
	const ruinTestPassed = worstScenario ? worstScenario.survivalStatus !== "critical" : false;

	return {
		portfolio,
		scenarios,
		maxSurvivableDrawdown,
		ruinTestPassed,
	};
}

function calculateScenario(
	portfolio: PortfolioInput,
	btcValue: number,
	nonBtcValue: number,
	drawdownPct: number,
	hedgePositions: HedgePosition[],
	config: CrashSurvivalConfig,
): CrashScenario {
	const btcDrawdown = drawdownPct / 100;
	const nonBtcDrawdown = btcDrawdown * config.nonBtcCorrelation;

	const btcPriceAtCrash = portfolio.btcPriceUsd * (1 - btcDrawdown);
	const btcValueAfterCrash = btcValue * (1 - btcDrawdown);
	const nonBtcValueAfterCrash = nonBtcValue * (1 - nonBtcDrawdown);
	const portfolioValueAfterCrash = btcValueAfterCrash + nonBtcValueAfterCrash;

	// Hedge payoff: intrinsic value of puts
	let hedgePayoff = 0;
	for (const pos of hedgePositions) {
		hedgePayoff += Math.max(0, pos.strikeUsd - btcPriceAtCrash) * pos.quantityBtc;
	}

	const netPosition = portfolioValueAfterCrash + hedgePayoff + portfolio.liquidReserveUsd;

	// Runway: net position / monthly burn — how many months you can sustain
	// by liquidating everything (portfolio after crash + hedge payoff + liquid reserve)
	const runwayMonths = calculateRunwayMonths(netPosition, portfolio.monthlyBurnUsd);

	// Survival status
	let survivalStatus: CrashScenario["survivalStatus"];
	if (runwayMonths >= config.runwayWarningMonths) {
		survivalStatus = "safe";
	} else if (runwayMonths >= config.runwayCriticalMonths) {
		survivalStatus = "warning";
	} else {
		survivalStatus = "critical";
	}

	return {
		drawdownPct,
		btcPriceAtCrash,
		btcValueAfterCrash,
		nonBtcValueAfterCrash,
		portfolioValueAfterCrash,
		hedgePayoff,
		netPosition,
		runwayMonths,
		survivalStatus,
	};
}

/**
 * Calculate hedge payoff at various BTC price multipliers.
 */
export function calculatePriceScenarios(
	hedgePositions: HedgePosition[],
	totalBtcHoldings: number,
	currentBtcPrice: number,
	multipliers: number[] = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4],
) {
	const currentPortfolioValue = totalBtcHoldings * currentBtcPrice;

	return multipliers.map((m) => {
		const btcPrice =
			m === 1.0 ? currentBtcPrice : Math.round((currentBtcPrice * m) / 5000) * 5000;

		const portfolioValue = totalBtcHoldings * btcPrice;
		let hedgePayoff = 0;
		for (const p of hedgePositions) {
			hedgePayoff += Math.max(0, p.strikeUsd - btcPrice) * p.quantityBtc;
		}
		const netValue = portfolioValue + hedgePayoff;
		const portfolioLoss = currentPortfolioValue - portfolioValue;
		const protectionPct = portfolioLoss > 0 ? hedgePayoff / portfolioLoss : 0;
		const changePct = ((btcPrice - currentBtcPrice) / currentBtcPrice) * 100;

		return { btcPrice, portfolioValue, hedgePayoff, netValue, protectionPct, changePct };
	});
}
