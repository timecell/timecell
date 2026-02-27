// =============================================================================
// Core Types for TimeCell Engine
// =============================================================================

/** User's portfolio configuration */
export interface PortfolioInput {
	totalValueUsd: number;
	btcPercentage: number; // 0-100
	monthlyBurnUsd: number;
	liquidReserveUsd: number;
	btcPriceUsd: number;
}

/** Optional hedge position (put option) */
export interface HedgePosition {
	strikeUsd: number;
	quantityBtc: number;
	expiryDate?: string;
}

/** Result for a single crash scenario */
export interface CrashScenario {
	drawdownPct: number; // e.g. 30, 50, 70, 80
	btcPriceAtCrash: number;
	btcValueAfterCrash: number;
	nonBtcValueAfterCrash: number;
	portfolioValueAfterCrash: number;
	hedgePayoff: number;
	netPosition: number;
	runwayMonths: number;
	survivalStatus: "safe" | "warning" | "critical";
}

/** Full survival analysis result */
export interface SurvivalResult {
	portfolio: PortfolioInput;
	scenarios: CrashScenario[];
	maxSurvivableDrawdown: number; // highest drawdown % where status != critical
	ruinTestPassed: boolean; // survives -80% BTC / -40% non-BTC
}

/** Configuration for crash survival calculations */
export interface CrashSurvivalConfig {
	drawdowns: number[]; // e.g. [30, 50, 70, 80]
	nonBtcCorrelation: number; // how much non-BTC drops relative to BTC (0-1)
	runwayWarningMonths: number; // threshold for "warning" status
	runwayCriticalMonths: number; // threshold for "critical" status
}

/** Geometric mean CAGR comparison (hedged vs unhedged) */
export interface GeometricMeanResult {
	unhedgedCAGR: number;
	hedgedCAGR: number;
	improvement: number;
	isPositiveEV: boolean;
	assumptions: {
		normalReturn: number;
		crashMagnitude: number;
		cycleLength: number;
		annualCost: number;
		recoveryPercent: number;
	};
}
