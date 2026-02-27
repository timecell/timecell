import { describe, it, expect } from "vitest";
import {
	HISTORICAL_CRASHES,
	SURVIVAL_RUNWAY_MONTHS,
	simulateHistoricalCrash,
	simulateAllHistoricalCrashes,
} from "./historical-crashes.js";
import type { PortfolioInput } from "./types.js";

// Well-capitalised portfolio — 40% BTC, $2M total, $25K/mo burn, $300K liquid
const HEALTHY_PORTFOLIO: PortfolioInput = {
	totalValueUsd: 2_000_000,
	btcPercentage: 40,
	monthlyBurnUsd: 25_000,
	liquidReserveUsd: 300_000,
	btcPriceUsd: 85_000,
};

// Fragile portfolio — 80% BTC, $500K total, $20K/mo burn, $10K liquid
const FRAGILE_PORTFOLIO: PortfolioInput = {
	totalValueUsd: 500_000,
	btcPercentage: 80,
	monthlyBurnUsd: 20_000,
	liquidReserveUsd: 10_000,
	btcPriceUsd: 85_000,
};

// Pure BTC portfolio — 100% in BTC
const BTC_ONLY_PORTFOLIO: PortfolioInput = {
	totalValueUsd: 1_000_000,
	btcPercentage: 100,
	monthlyBurnUsd: 10_000,
	liquidReserveUsd: 0,
	btcPriceUsd: 85_000,
};

describe("HISTORICAL_CRASHES constant", () => {
	it("contains exactly 4 crashes", () => {
		expect(HISTORICAL_CRASHES).toHaveLength(4);
	});

	it("each crash has required fields", () => {
		for (const crash of HISTORICAL_CRASHES) {
			expect(crash.name).toBeTruthy();
			expect(crash.peakDate).toMatch(/^\d{4}-\d{2}$/);
			expect(crash.troughDate).toMatch(/^\d{4}-\d{2}$/);
			expect(crash.peakPrice).toBeGreaterThan(0);
			expect(crash.troughPrice).toBeGreaterThan(0);
			expect(crash.drawdown).toBeGreaterThan(0);
			expect(crash.drawdown).toBeLessThan(100);
			expect(crash.recoveryMonths).toBeGreaterThan(0);
		}
	});

	it("trough price is always below peak price", () => {
		for (const crash of HISTORICAL_CRASHES) {
			expect(crash.troughPrice).toBeLessThan(crash.peakPrice);
		}
	});

	it("has the four named crashes", () => {
		const names = HISTORICAL_CRASHES.map((c) => c.name);
		expect(names).toContain("2014 Mt. Gox");
		expect(names).toContain("2018 ICO Bust");
		expect(names).toContain("2022 LUNA/FTX");
		expect(names).toContain("COVID 2020");
	});
});

describe("simulateHistoricalCrash — math", () => {
	it("applies BTC drawdown correctly", () => {
		const crash = HISTORICAL_CRASHES.find((c) => c.name === "2022 LUNA/FTX")!;
		// drawdown = 77.5%
		const result = simulateHistoricalCrash(HEALTHY_PORTFOLIO, crash);

		const btcValue = HEALTHY_PORTFOLIO.totalValueUsd * (HEALTHY_PORTFOLIO.btcPercentage / 100);
		// 40% of $2M = $800K in BTC
		const expectedBtcValueAtTrough = btcValue * (1 - 0.775);
		expect(result.btcLoss).toBeCloseTo(btcValue - expectedBtcValueAtTrough, 2);
	});

	it("applies 50% correlation to non-BTC assets", () => {
		const crash = HISTORICAL_CRASHES.find((c) => c.name === "2022 LUNA/FTX")!;
		const result = simulateHistoricalCrash(HEALTHY_PORTFOLIO, crash);

		const nonBtcValue = HEALTHY_PORTFOLIO.totalValueUsd * (1 - HEALTHY_PORTFOLIO.btcPercentage / 100);
		const expectedNonBtcLoss = nonBtcValue * (0.775 * 0.5);
		expect(result.otherAssetsLoss).toBeCloseTo(expectedNonBtcLoss, 2);
	});

	it("totalLoss = btcLoss + otherAssetsLoss", () => {
		const crash = HISTORICAL_CRASHES[0];
		const result = simulateHistoricalCrash(HEALTHY_PORTFOLIO, crash);
		expect(result.totalLoss).toBeCloseTo(result.btcLoss + result.otherAssetsLoss, 4);
	});

	it("portfolioValueAtTrough = totalValueUsd - totalLoss", () => {
		const crash = HISTORICAL_CRASHES[0];
		const result = simulateHistoricalCrash(HEALTHY_PORTFOLIO, crash);
		expect(result.portfolioValueAtTrough).toBeCloseTo(
			HEALTHY_PORTFOLIO.totalValueUsd - result.totalLoss,
			4,
		);
	});

	it("runway includes liquid reserve", () => {
		const crash = HISTORICAL_CRASHES.find((c) => c.name === "2014 Mt. Gox")!;
		const result = simulateHistoricalCrash(HEALTHY_PORTFOLIO, crash);

		const netPosition = result.portfolioValueAtTrough + HEALTHY_PORTFOLIO.liquidReserveUsd;
		const expectedRunway = netPosition / HEALTHY_PORTFOLIO.monthlyBurnUsd;
		expect(result.runwayMonths).toBeCloseTo(expectedRunway, 4);
	});
});

describe("simulateHistoricalCrash — survival outcomes", () => {
	it("healthy portfolio survives COVID 2020 crash", () => {
		const crash = HISTORICAL_CRASHES.find((c) => c.name === "COVID 2020")!;
		const result = simulateHistoricalCrash(HEALTHY_PORTFOLIO, crash);
		expect(result.survived).toBe(true);
		expect(result.runwayMonths).toBeGreaterThanOrEqual(SURVIVAL_RUNWAY_MONTHS);
	});

	it("fragile portfolio does not survive 2014 Mt. Gox crash", () => {
		const crash = HISTORICAL_CRASHES.find((c) => c.name === "2014 Mt. Gox")!;
		// 85.2% drawdown on 80% BTC portfolio with almost no liquid reserve
		// btcValue = 400K, btcAtTrough = 400K * 0.148 = 59.2K
		// nonBtcValue = 100K, nonBtcAtTrough = 100K * (1 - 0.426) = 57.4K
		// portfolioAtTrough = 116.6K, liquid = 10K, net = 126.6K, runway = 6.3 months
		const result = simulateHistoricalCrash(FRAGILE_PORTFOLIO, crash);
		expect(result.survived).toBe(false);
		expect(result.runwayMonths).toBeLessThan(SURVIVAL_RUNWAY_MONTHS);
	});

	it("zero monthly burn always survives (infinite runway)", () => {
		const noBurnPortfolio: PortfolioInput = {
			...HEALTHY_PORTFOLIO,
			monthlyBurnUsd: 0,
		};
		const crash = HISTORICAL_CRASHES[0];
		const result = simulateHistoricalCrash(noBurnPortfolio, crash);
		expect(result.runwayMonths).toBe(Infinity);
		expect(result.survived).toBe(true);
	});
});

describe("simulateHistoricalCrash — pure BTC portfolio", () => {
	it("100% BTC has zero other assets loss", () => {
		const crash = HISTORICAL_CRASHES.find((c) => c.name === "2018 ICO Bust")!;
		const result = simulateHistoricalCrash(BTC_ONLY_PORTFOLIO, crash);
		expect(result.otherAssetsLoss).toBe(0);
	});

	it("100% BTC portfolio has higher totalLoss than 50% BTC portfolio", () => {
		const crash = HISTORICAL_CRASHES.find((c) => c.name === "2018 ICO Bust")!;
		const mixedPortfolio: PortfolioInput = {
			...BTC_ONLY_PORTFOLIO,
			btcPercentage: 50,
		};
		const pureBtcResult = simulateHistoricalCrash(BTC_ONLY_PORTFOLIO, crash);
		const mixedResult = simulateHistoricalCrash(mixedPortfolio, crash);
		expect(pureBtcResult.totalLoss).toBeGreaterThan(mixedResult.totalLoss);
	});

	it("100% BTC portfolio runway is lower than diversified portfolio at same crash", () => {
		const crash = HISTORICAL_CRASHES.find((c) => c.name === "2014 Mt. Gox")!;
		const diversified: PortfolioInput = {
			...BTC_ONLY_PORTFOLIO,
			btcPercentage: 40,
			liquidReserveUsd: 0,
		};
		const pureBtcResult = simulateHistoricalCrash(BTC_ONLY_PORTFOLIO, crash);
		const diversifiedResult = simulateHistoricalCrash(diversified, crash);
		expect(pureBtcResult.runwayMonths).toBeLessThan(diversifiedResult.runwayMonths);
	});
});

describe("simulateAllHistoricalCrashes", () => {
	it("returns 4 results for 4 crashes", () => {
		const results = simulateAllHistoricalCrashes(HEALTHY_PORTFOLIO);
		expect(results).toHaveLength(4);
	});

	it("results are sorted by drawdown descending (worst first)", () => {
		const results = simulateAllHistoricalCrashes(HEALTHY_PORTFOLIO);
		for (let i = 0; i < results.length - 1; i++) {
			expect(results[i].crash.drawdown).toBeGreaterThanOrEqual(results[i + 1].crash.drawdown);
		}
	});

	it("healthy portfolio survives all 4 crashes", () => {
		const results = simulateAllHistoricalCrashes(HEALTHY_PORTFOLIO);
		const survivedCount = results.filter((r) => r.survived).length;
		expect(survivedCount).toBe(4);
	});

	it("fragile portfolio fails at least the worst crash", () => {
		const results = simulateAllHistoricalCrashes(FRAGILE_PORTFOLIO);
		// The worst crash (85.2% drawdown) should not be survived
		const worstCrash = results[0]; // sorted by drawdown desc
		expect(worstCrash.survived).toBe(false);
	});
});
