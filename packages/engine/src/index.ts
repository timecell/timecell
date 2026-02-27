// =============================================================================
// @timecell/engine — Public API
// =============================================================================

export type {
	PortfolioInput,
	HedgePosition,
	CrashScenario,
	SurvivalResult,
	CrashSurvivalConfig,
	GeometricMeanResult,
} from "./types.js";

export { calculateCrashSurvival, calculatePriceScenarios, DEFAULT_CONFIG } from "./crash-survival.js";
export { calculateRunwayMonths } from "./runway.js";
export { ruinTest } from "./ruin-test.js";
export { calculateGeometricMeanCAGR, calculateGeometricBreakeven } from "./geometric-mean.js";
export { DEMO_PORTFOLIO, DEMO_HEDGE_POSITIONS, DEMO_BTC_PRICE } from "./fixtures/demo-portfolio.js";
export type { TemperatureResult, TemperatureZone } from "./temperature.js";
export { calculateTemperature, scoreToZone, normalizeMvrv, normalizeRhodl } from "./temperature.js";
export {
	calculatePositionSizing,
	getConvictionRung,
} from "./position-sizing.js";
export type { PositionSizingInput, PositionSizingResult } from "./position-sizing.js";
export { generateActionPlan } from "./action-plan.js";
export type { ActionPlanInput, ActionItem, ActionSeverity } from "./action-plan.js";
export { calculateSleepTest } from "./sleep-test.js";
export type { SleepTestInput, SleepTestResult } from "./sleep-test.js";
export { calculateCapacityGate } from "./capacity-gate.js";
export type { CapacityGateInput, CapacityGateResult } from "./capacity-gate.js";
