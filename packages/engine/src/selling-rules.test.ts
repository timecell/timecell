import { describe, expect, it } from "vitest";
import { calculateSellingRules } from "./selling-rules.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeInput(
	temperatureScore: number,
	opts: { totalBtcValueUsd?: number; btcPriceUsd?: number; btcPercentage?: number } = {},
) {
	return {
		temperatureScore,
		totalBtcValueUsd: opts.totalBtcValueUsd ?? 100_000,
		btcPriceUsd: opts.btcPriceUsd ?? 100_000,
		btcPercentage: opts.btcPercentage ?? 50,
	};
}

// ---------------------------------------------------------------------------
// Temperature = 50 — nothing triggered
// ---------------------------------------------------------------------------

describe("calculateSellingRules — temperature 50 (nothing triggered)", () => {
	const result = calculateSellingRules(makeInput(50));

	it("returns 6 schedule entries", () => {
		expect(result.schedule).toHaveLength(6);
	});

	it("no tiers are triggered", () => {
		expect(result.currentlyTriggered).toHaveLength(0);
	});

	it("every schedule entry has triggered = false", () => {
		for (const entry of result.schedule) {
			expect(entry.triggered).toBe(false);
		}
	});

	it("schedule thresholds are in ascending order", () => {
		const thresholds = result.schedule.map((s) => s.temperatureThreshold);
		expect(thresholds).toEqual([70, 75, 80, 85, 90, 95]);
	});
});

// ---------------------------------------------------------------------------
// Temperature = 75 — first two tiers triggered (70 and 75)
// ---------------------------------------------------------------------------

describe("calculateSellingRules — temperature 75 (first two triggered)", () => {
	const input = makeInput(75, { totalBtcValueUsd: 100_000, btcPriceUsd: 100_000 });
	const result = calculateSellingRules(input);

	it("exactly 2 tiers triggered", () => {
		expect(result.currentlyTriggered).toHaveLength(2);
	});

	it("triggered thresholds are 70 and 75", () => {
		const triggered = result.currentlyTriggered.map((s) => s.temperatureThreshold);
		expect(triggered).toEqual([70, 75]);
	});

	it("tier at 70 sells 5% = $5,000", () => {
		const tier70 = result.schedule.find((s) => s.temperatureThreshold === 70)!;
		expect(tier70.sellAmountUsd).toBeCloseTo(5_000, 0);
	});

	it("tier at 75 sells additional 10% = $10,000", () => {
		const tier75 = result.schedule.find((s) => s.temperatureThreshold === 75)!;
		expect(tier75.sellAmountUsd).toBeCloseTo(10_000, 0);
	});

	it("tier at 70 sells 0.05 BTC at $100k price", () => {
		const tier70 = result.schedule.find((s) => s.temperatureThreshold === 70)!;
		expect(tier70.sellBtc).toBeCloseTo(0.05, 4);
	});

	it("remaining BTC% after tier 75 is 85%", () => {
		const tier75 = result.schedule.find((s) => s.temperatureThreshold === 75)!;
		expect(tier75.remainingBtcPct).toBe(85);
	});

	it("tier at 80 is NOT triggered", () => {
		const tier80 = result.schedule.find((s) => s.temperatureThreshold === 80)!;
		expect(tier80.triggered).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Temperature = 95 — all tiers triggered
// ---------------------------------------------------------------------------

describe("calculateSellingRules — temperature 95 (all triggered)", () => {
	const input = makeInput(95, { totalBtcValueUsd: 200_000, btcPriceUsd: 50_000 });
	const result = calculateSellingRules(input);

	it("all 6 tiers triggered", () => {
		expect(result.currentlyTriggered).toHaveLength(6);
	});

	it("all schedule entries have triggered = true", () => {
		for (const entry of result.schedule) {
			expect(entry.triggered).toBe(true);
		}
	});

	it("total sell if all triggered sums the individual tier amounts", () => {
		const sumFromSchedule = result.schedule.reduce((s, e) => s + e.sellAmountUsd, 0);
		expect(result.totalSellIfAllTriggered).toBeCloseTo(sumFromSchedule, 0);
	});

	it("remaining BTC after all is non-negative", () => {
		expect(result.remainingBtcAfterAll).toBeGreaterThanOrEqual(0);
	});
});

// ---------------------------------------------------------------------------
// Dollar amount correctness
// ---------------------------------------------------------------------------

describe("calculateSellingRules — dollar amounts", () => {
	it("sell amounts use the original BTC value, not progressive remainder", () => {
		// Each tier sells X% of the ORIGINAL position, not the post-sell remainder
		const input = makeInput(99, { totalBtcValueUsd: 50_000, btcPriceUsd: 80_000 });
		const result = calculateSellingRules(input);

		// Tier at 70: 5% of $50,000 = $2,500
		const tier70 = result.schedule.find((s) => s.temperatureThreshold === 70)!;
		expect(tier70.sellAmountUsd).toBeCloseTo(2_500, 0);

		// Tier at 75: 10% of $50,000 = $5,000
		const tier75 = result.schedule.find((s) => s.temperatureThreshold === 75)!;
		expect(tier75.sellAmountUsd).toBeCloseTo(5_000, 0);

		// Tier at 80: 15% of $50,000 = $7,500
		const tier80 = result.schedule.find((s) => s.temperatureThreshold === 80)!;
		expect(tier80.sellAmountUsd).toBeCloseTo(7_500, 0);
	});

	it("BTC amounts = sellAmountUsd / btcPriceUsd", () => {
		const input = makeInput(99, { totalBtcValueUsd: 100_000, btcPriceUsd: 50_000 });
		const result = calculateSellingRules(input);
		for (const entry of result.schedule) {
			expect(entry.sellBtc).toBeCloseTo(entry.sellAmountUsd / 50_000, 6);
		}
	});

	it("handles zero btcPriceUsd gracefully (no crash)", () => {
		const input = makeInput(80, { totalBtcValueUsd: 100_000, btcPriceUsd: 0 });
		expect(() => calculateSellingRules(input)).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// 100% BTC portfolio
// ---------------------------------------------------------------------------

describe("calculateSellingRules — 100% BTC portfolio", () => {
	const input = makeInput(85, {
		btcPercentage: 100,
		totalBtcValueUsd: 500_000,
		btcPriceUsd: 100_000,
	});
	const result = calculateSellingRules(input);

	it("4 tiers triggered (70, 75, 80, 85)", () => {
		expect(result.currentlyTriggered).toHaveLength(4);
	});

	it("tier at 85 sells 20% = $100,000", () => {
		const tier85 = result.schedule.find((s) => s.temperatureThreshold === 85)!;
		expect(tier85.sellAmountUsd).toBeCloseTo(100_000, 0);
	});

	it("remaining BTC% after tier 85 is 50%", () => {
		const tier85 = result.schedule.find((s) => s.temperatureThreshold === 85)!;
		expect(tier85.remainingBtcPct).toBe(50);
	});

	it("totalSellIfAllTriggered is less than or equal to totalBtcValueUsd", () => {
		expect(result.totalSellIfAllTriggered).toBeLessThanOrEqual(input.totalBtcValueUsd);
	});
});
