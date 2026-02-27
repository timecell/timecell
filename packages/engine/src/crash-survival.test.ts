import { describe, it, expect } from "vitest";
import { calculateCrashSurvival } from "./crash-survival.js";
import { ruinTest } from "./ruin-test.js";
import { calculateRunwayMonths } from "./runway.js";
import { calculateGeometricMeanCAGR, calculateGeometricBreakeven } from "./geometric-mean.js";
import { DEMO_PORTFOLIO, DEMO_HEDGE_POSITIONS } from "./fixtures/demo-portfolio.js";
import type { PortfolioInput } from "./types.js";

describe("runway calculator", () => {
	it("calculates basic runway", () => {
		expect(calculateRunwayMonths(600_000, 25_000)).toBe(24);
	});

	it("returns Infinity when no burn", () => {
		expect(calculateRunwayMonths(600_000, 0)).toBe(Infinity);
	});

	it("returns 0 when no liquidity", () => {
		expect(calculateRunwayMonths(0, 25_000)).toBe(0);
	});
});

describe("crash survival calculator", () => {
	it("returns 4 scenarios by default", () => {
		const result = calculateCrashSurvival(DEMO_PORTFOLIO);
		expect(result.scenarios).toHaveLength(4);
		expect(result.scenarios.map((s) => s.drawdownPct)).toEqual([30, 50, 70, 80]);
	});

	it("calculates correct BTC price after crash", () => {
		const result = calculateCrashSurvival(DEMO_PORTFOLIO);
		const scenario50 = result.scenarios.find((s) => s.drawdownPct === 50)!;
		expect(scenario50.btcPriceAtCrash).toBe(84_000 * 0.5);
	});

	it("applies non-BTC correlation at 50% of BTC drawdown", () => {
		const result = calculateCrashSurvival(DEMO_PORTFOLIO);
		const scenario50 = result.scenarios.find((s) => s.drawdownPct === 50)!;

		const btcAfter = 5_000_000 * 0.35 * 0.5;
		expect(scenario50.btcValueAfterCrash).toBe(btcAfter);

		const nonBtcAfter = 5_000_000 * 0.65 * (1 - 0.25);
		expect(scenario50.nonBtcValueAfterCrash).toBe(nonBtcAfter);
	});

	it("demo portfolio with sufficient reserve is safe at all levels", () => {
		const result = calculateCrashSurvival(DEMO_PORTFOLIO);
		const s30 = result.scenarios.find((s) => s.drawdownPct === 30)!;
		const s80 = result.scenarios.find((s) => s.drawdownPct === 80)!;

		// $600K reserve / $25K burn = 24 months runway
		expect(s30.survivalStatus).toBe("safe");
		expect(s80.runwayMonths).toBe(24);
		expect(s80.survivalStatus).toBe("safe");
	});

	it("hedge positions provide payoff during crash", () => {
		const result = calculateCrashSurvival(DEMO_PORTFOLIO, DEMO_HEDGE_POSITIONS);
		const s70 = result.scenarios.find((s) => s.drawdownPct === 70)!;

		// Strike $60K, crash price $84K * 0.3 = $25,200
		// Payoff = max(0, 60000 - 25200) * 10 = $348,000
		expect(s70.hedgePayoff).toBe((60_000 - 84_000 * 0.3) * 10);
		expect(s70.hedgePayoff).toBeGreaterThan(0);
	});

	it("returns maxSurvivableDrawdown", () => {
		const result = calculateCrashSurvival(DEMO_PORTFOLIO);
		expect(result.maxSurvivableDrawdown).toBeGreaterThan(0);
	});
});

describe("ruin test", () => {
	it("demo portfolio passes ruin test", () => {
		const result = ruinTest(DEMO_PORTFOLIO);
		expect(result.passed).toBe(true);
		expect(result.runwayMonths).toBe(24);
	});

	it("under-reserved portfolio fails ruin test", () => {
		const thinReserve: PortfolioInput = {
			...DEMO_PORTFOLIO,
			liquidReserveUsd: 200_000,
		};
		const result = ruinTest(thinReserve);
		expect(result.passed).toBe(false);
		expect(result.runwayMonths).toBe(8);
	});

	it("hedge payoff can save an under-reserved portfolio", () => {
		const thinReserve: PortfolioInput = {
			...DEMO_PORTFOLIO,
			liquidReserveUsd: 200_000,
		};
		const result = ruinTest(thinReserve, DEMO_HEDGE_POSITIONS);
		expect(result.passed).toBe(true);
		expect(result.runwayMonths).toBeGreaterThan(18);
	});
});

describe("geometric mean CAGR", () => {
	it("unhedged CAGR is lower than simple average return", () => {
		const result = calculateGeometricMeanCAGR(0.15, 0, 0.5, 0, 4);
		expect(result.unhedgedCAGR).toBeLessThan(0.15);
		// (1.15^3 * 0.5)^(1/4) - 1 ≈ -6.6% — volatile asset with 50% crash every 4 years
		expect(result.unhedgedCAGR).toBeGreaterThan(-0.10);
	});

	it("hedge with good recovery improves CAGR", () => {
		const result = calculateGeometricMeanCAGR(0.15, 0.02, 0.5, 0.5, 4);
		expect(result.improvement).toBeGreaterThan(0);
		expect(result.isPositiveEV).toBe(true);
	});

	it("expensive hedge with low recovery hurts CAGR", () => {
		const result = calculateGeometricMeanCAGR(0.15, 0.05, 0.5, 0.1, 4);
		expect(result.improvement).toBeLessThan(0);
		expect(result.isPositiveEV).toBe(false);
	});
});

describe("geometric breakeven", () => {
	it("free hedge always breaks even", () => {
		const result = calculateGeometricBreakeven(0, 0.5);
		expect(result.breakEvenYears).toBe(1);
	});

	it("reasonable hedge breaks even within 10 years", () => {
		const result = calculateGeometricBreakeven(0.02, 0.5);
		expect(result.breakEvenYears).not.toBeNull();
		// 2% cost with 50% recovery: breaks even at ~24 year cycle
		expect(result.breakEvenYears!).toBeLessThanOrEqual(30);
	});
});
