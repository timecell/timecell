import { describe, it, expect } from "vitest";
import { calculatePositionSizing, getConvictionRung } from "./position-sizing.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE = {
	totalValueUsd: 1_000_000,
	currentBtcPct: 20,
	targetBtcPct: 35,
	monthlyBurnUsd: 10_000,
	liquidReserveUsd: 200_000,
	btcPriceUsd: 84_000,
	dcaMonths: 6,
} as const;

// ---------------------------------------------------------------------------
// getConvictionRung
// ---------------------------------------------------------------------------

describe("getConvictionRung", () => {
	it("returns Observer at 0%", () => {
		expect(getConvictionRung(0)).toBe("Observer");
	});

	it("returns Experimenter at 1%", () => {
		expect(getConvictionRung(1)).toBe("Experimenter");
	});

	it("returns Experimenter at 3%", () => {
		expect(getConvictionRung(3)).toBe("Experimenter");
	});

	it("returns Diversifier at 5%", () => {
		expect(getConvictionRung(5)).toBe("Diversifier");
	});

	it("returns High Conviction at 15%", () => {
		expect(getConvictionRung(15)).toBe("High Conviction");
	});

	it("returns Owner-Class at 25%", () => {
		expect(getConvictionRung(25)).toBe("Owner-Class");
	});

	it("returns Single-Asset Core at 50%", () => {
		expect(getConvictionRung(50)).toBe("Single-Asset Core");
	});

	it("returns Single-Asset Core at 75%", () => {
		expect(getConvictionRung(75)).toBe("Single-Asset Core");
	});
});

// ---------------------------------------------------------------------------
// calculatePositionSizing — gap analysis
// ---------------------------------------------------------------------------

describe("position sizing — gap analysis", () => {
	it("calculates current and target BTC USD values", () => {
		const result = calculatePositionSizing(BASE);
		expect(result.currentBtcUsd).toBe(200_000); // 20% of 1M
		expect(result.targetBtcUsd).toBe(350_000); // 35% of 1M
	});

	it("gap is positive when buying more BTC", () => {
		const result = calculatePositionSizing(BASE);
		expect(result.gapUsd).toBe(150_000); // 350K - 200K
		expect(result.gapBtc).toBeCloseTo(150_000 / 84_000, 6);
	});

	it("gap is negative when selling BTC (reducing allocation)", () => {
		const result = calculatePositionSizing({ ...BASE, currentBtcPct: 60, targetBtcPct: 30 });
		expect(result.gapUsd).toBe(-300_000); // 300K - 600K
		expect(result.gapBtc).toBeLessThan(0);
	});

	it("gap is zero when current equals target", () => {
		const result = calculatePositionSizing({ ...BASE, currentBtcPct: 35, targetBtcPct: 35 });
		expect(result.gapUsd).toBe(0);
		expect(result.gapBtc).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// calculatePositionSizing — DCA schedule
// ---------------------------------------------------------------------------

describe("position sizing — DCA schedule", () => {
	it("splits gap evenly over dcaMonths", () => {
		const result = calculatePositionSizing(BASE); // gap = 150K, months = 6
		expect(result.dcaMonthlyUsd).toBeCloseTo(25_000, 2);
	});

	it("uses default 6 months when dcaMonths is omitted", () => {
		const { dcaMonths: _, ...noMonths } = BASE;
		const result = calculatePositionSizing(noMonths);
		expect(result.dcaMonths).toBe(6);
		expect(result.dcaMonthlyUsd).toBeCloseTo(25_000, 2);
	});

	it("handles 12-month DCA", () => {
		const result = calculatePositionSizing({ ...BASE, dcaMonths: 12 });
		expect(result.dcaMonths).toBe(12);
		expect(result.dcaMonthlyUsd).toBeCloseTo(12_500, 2);
	});

	it("dcaMonthlyBtc equals dcaMonthlyUsd / btcPrice", () => {
		const result = calculatePositionSizing(BASE);
		expect(result.dcaMonthlyBtc).toBeCloseTo(result.dcaMonthlyUsd / 84_000, 8);
	});
});

// ---------------------------------------------------------------------------
// calculatePositionSizing — ruin test
// ---------------------------------------------------------------------------

describe("position sizing — post-reallocation ruin test", () => {
	it("safe portfolio with modest BTC target passes ruin test", () => {
		// 35% BTC, 200K reserve, 10K burn — should survive -80% BTC / -40% non-BTC
		const result = calculatePositionSizing(BASE);
		expect(result.postReallocationRuinTest).toBe(true);
		expect(result.postReallocationRunwayMonths).toBeGreaterThan(18);
	});

	it("ruin test fails when target allocation leaves insufficient runway", () => {
		// 100% BTC, zero liquid reserve, tight burn — worst case leaves almost nothing
		const result = calculatePositionSizing({
			totalValueUsd: 100_000,
			currentBtcPct: 50,
			targetBtcPct: 100,
			monthlyBurnUsd: 10_000,
			liquidReserveUsd: 0,
			btcPriceUsd: 84_000,
			dcaMonths: 6,
		});
		// After 80% BTC crash: 100K * 20% = 20K, runway = 2 months → critical
		expect(result.postReallocationRuinTest).toBe(false);
		expect(result.postReallocationRunwayMonths).toBeLessThan(18);
	});
});

// ---------------------------------------------------------------------------
// calculatePositionSizing — conviction rungs
// ---------------------------------------------------------------------------

describe("position sizing — conviction rungs", () => {
	it("labels current and target rungs correctly", () => {
		const result = calculatePositionSizing(BASE); // current 20% → High Conviction, target 35% → Owner-Class
		expect(result.currentConvictionRung).toBe("High Conviction");
		expect(result.convictionRung).toBe("Owner-Class");
	});

	it("same rung when current equals target", () => {
		const result = calculatePositionSizing({ ...BASE, currentBtcPct: 10, targetBtcPct: 10 });
		expect(result.currentConvictionRung).toBe(result.convictionRung);
	});
});
