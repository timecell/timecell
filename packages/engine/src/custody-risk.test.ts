// =============================================================================
// Custody Risk Tests
// =============================================================================

import { describe, expect, it } from "vitest";
import { calculateCustodyRisk } from "./custody-risk.js";

const BTC_PRICE = 100_000;
const TOTAL_BTC_USD = 500_000; // 5 BTC at $100k

// ---------------------------------------------------------------------------
// Risk level thresholds
// ---------------------------------------------------------------------------

describe("risk level classification", () => {
	it("returns 'low' when exchange % is 0", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 0,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("low");
	});

	it("returns 'low' when exchange % is 9 (just under 10%)", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 9,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("low");
	});

	it("returns 'moderate' at exactly 10%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 10,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("moderate");
	});

	it("returns 'moderate' at 20%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 20,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("moderate");
	});

	it("returns 'moderate' at 29% (just under 30%)", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 29,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("moderate");
	});

	it("returns 'high' at exactly 30%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 30,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("high");
	});

	it("returns 'high' at 50%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 50,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("high");
	});

	it("returns 'high' at 59% (just under 60%)", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 59,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("high");
	});

	it("returns 'critical' at exactly 60%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 60,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("critical");
	});

	it("returns 'critical' at 100%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 100,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.riskLevel).toBe("critical");
	});
});

// ---------------------------------------------------------------------------
// Dollar calculations
// ---------------------------------------------------------------------------

describe("dollar calculations", () => {
	it("splits USD correctly at 50%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 50,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.exchangeValueUsd).toBe(250_000);
		expect(result.selfCustodyValueUsd).toBe(250_000);
	});

	it("splits USD correctly at 20%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 20,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.exchangeValueUsd).toBe(100_000);
		expect(result.selfCustodyValueUsd).toBe(400_000);
	});

	it("exchange + self-custody always sums to total", () => {
		for (const pct of [0, 15, 35, 65, 100]) {
			const result = calculateCustodyRisk({
				totalBtcValueUsd: TOTAL_BTC_USD,
				exchangePct: pct,
				btcPriceUsd: BTC_PRICE,
			});
			expect(result.exchangeValueUsd + result.selfCustodyValueUsd).toBeCloseTo(
				TOTAL_BTC_USD,
				6,
			);
		}
	});

	it("exchangeRiskExposure equals exchangeValueUsd", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 40,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.exchangeRiskExposure).toBe(result.exchangeValueUsd);
	});
});

// ---------------------------------------------------------------------------
// BTC calculations
// ---------------------------------------------------------------------------

describe("BTC calculations", () => {
	it("calculates BTC amounts correctly at 50%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 50,
			btcPriceUsd: BTC_PRICE,
		});
		// 500k / 100k = 5 BTC total → 2.5 each
		expect(result.exchangeBtc).toBeCloseTo(2.5, 6);
		expect(result.selfCustodyBtc).toBeCloseTo(2.5, 6);
	});

	it("exchangeBtc + selfCustodyBtc equals total BTC", () => {
		const totalBtc = TOTAL_BTC_USD / BTC_PRICE;
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 30,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.exchangeBtc + result.selfCustodyBtc).toBeCloseTo(totalBtc, 6);
	});
});

// ---------------------------------------------------------------------------
// Recommendations vary by risk level
// ---------------------------------------------------------------------------

describe("recommendations", () => {
	it("returns a recommendation string for each risk level", () => {
		const levels = [5, 20, 45, 75];
		const recommendations = levels.map((pct) =>
			calculateCustodyRisk({ totalBtcValueUsd: TOTAL_BTC_USD, exchangePct: pct, btcPriceUsd: BTC_PRICE }).recommendation,
		);
		// All four should be non-empty and different
		expect(recommendations.every((r) => r.length > 0)).toBe(true);
		const unique = new Set(recommendations);
		expect(unique.size).toBe(4);
	});

	it("low risk recommendation mentions 10%", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 5,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.recommendation.toLowerCase()).toMatch(/10%|under 10/);
	});

	it("critical risk recommendation mentions keys", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 75,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.recommendation.toLowerCase()).toContain("keys");
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
	it("handles 0% on exchange", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 0,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.exchangeValueUsd).toBe(0);
		expect(result.exchangeBtc).toBe(0);
		expect(result.selfCustodyValueUsd).toBe(TOTAL_BTC_USD);
		expect(result.riskLevel).toBe("low");
	});

	it("handles 100% on exchange", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 100,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.exchangeValueUsd).toBe(TOTAL_BTC_USD);
		expect(result.selfCustodyValueUsd).toBe(0);
		expect(result.selfCustodyBtc).toBe(0);
		expect(result.riskLevel).toBe("critical");
	});

	it("handles zero BTC price without throwing", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 50,
			btcPriceUsd: 0,
		});
		expect(result.exchangeBtc).toBe(0);
		expect(result.selfCustodyBtc).toBe(0);
		// Dollar values should still work
		expect(result.exchangeValueUsd).toBe(250_000);
	});

	it("clamps exchange % above 100 to 100", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: 150,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.exchangeValueUsd).toBe(TOTAL_BTC_USD);
		expect(result.selfCustodyValueUsd).toBe(0);
	});

	it("clamps exchange % below 0 to 0", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: TOTAL_BTC_USD,
			exchangePct: -10,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.exchangeValueUsd).toBe(0);
		expect(result.selfCustodyValueUsd).toBe(TOTAL_BTC_USD);
	});

	it("handles zero total BTC value", () => {
		const result = calculateCustodyRisk({
			totalBtcValueUsd: 0,
			exchangePct: 50,
			btcPriceUsd: BTC_PRICE,
		});
		expect(result.exchangeValueUsd).toBe(0);
		expect(result.selfCustodyValueUsd).toBe(0);
		expect(result.exchangeBtc).toBe(0);
		expect(result.selfCustodyBtc).toBe(0);
	});
});
