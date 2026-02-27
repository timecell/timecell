import { describe, it, expect } from "vitest";
import { calculateAllocationDrift } from "./allocation-drift.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a standard input where the user holds BTC at a known initial price,
 * with non-BTC assets totalling the remainder of the portfolio.
 *
 * e.g. portfolio $100k, 30% BTC at $50k/BTC → 0.6 BTC, $70k other assets
 */
function makeInput({
	totalPortfolioUsd,
	initialBtcPct,
	initialBtcPrice,
	currentBtcPrice,
}: {
	totalPortfolioUsd: number;
	initialBtcPct: number;
	initialBtcPrice: number;
	currentBtcPrice: number;
}) {
	const initialBtcValue = totalPortfolioUsd * (initialBtcPct / 100);
	const btcHoldings = initialBtcPrice > 0 ? initialBtcValue / initialBtcPrice : 0;
	const otherAssetsValue = totalPortfolioUsd - initialBtcValue;

	return { initialBtcPct, initialBtcPrice, currentBtcPrice, otherAssetsValue, btcHoldings };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("calculateAllocationDrift", () => {
	it("BTC doubles — allocation drifts up, rebalance needed", () => {
		// Portfolio: $100k total, 20% BTC (High Conviction) initially at $50k/BTC
		// BTC holdings: 0.4 BTC; other assets: $80k
		// After BTC doubles to $100k/BTC: BTC = $40k, total = $120k → 33.3% BTC
		// Drifted from 20% to 33.3% = +13.3% — crosses into Owner-Class (25-50%)
		const input = makeInput({
			totalPortfolioUsd: 100_000,
			initialBtcPct: 20,
			initialBtcPrice: 50_000,
			currentBtcPrice: 100_000,
		});

		const result = calculateAllocationDrift(input);

		expect(result.currentBtcPct).toBeCloseTo(33.33, 1);
		expect(result.driftPct).toBeGreaterThan(5); // drifted up > 5%
		expect(result.rebalanceNeeded).toBe(true);
		expect(result.rebalanceAction).toMatch(/Sell/i);
		// Started at High Conviction (20%), now at Owner-Class (33%) — rung changed
		expect(result.rungChanged).toBe(true);
		expect(result.originalRung).toBe("High Conviction");
		expect(result.currentRung).toBe("Owner-Class");
	});

	it("BTC drops 50% — allocation drifts down, rebalance needed", () => {
		// Portfolio: $200k total, 50% BTC initially at $60k/BTC
		// BTC holdings: 1.667 BTC; other assets: $100k
		// After BTC halves to $30k/BTC: BTC = $50k, total = $150k → 33.3% BTC
		const input = makeInput({
			totalPortfolioUsd: 200_000,
			initialBtcPct: 50,
			initialBtcPrice: 60_000,
			currentBtcPrice: 30_000,
		});

		const result = calculateAllocationDrift(input);

		expect(result.currentBtcPct).toBeCloseTo(33.33, 1);
		expect(result.driftPct).toBeLessThan(-5); // drifted down > 5%
		expect(result.rebalanceNeeded).toBe(true);
		expect(result.rebalanceAction).toMatch(/Buy/i);
		// Started at Single-Asset Core (50%), now at Owner-Class (33.3%)
		expect(result.rungChanged).toBe(true);
		expect(result.originalRung).toBe("Single-Asset Core");
		expect(result.currentRung).toBe("Owner-Class");
	});

	it("small price change — within 5% threshold, no rebalance needed", () => {
		// Portfolio: $100k total, 20% BTC initially at $50k/BTC
		// BTC holdings: 0.4 BTC; other assets: $80k
		// After 10% price increase to $55k: BTC = $22k, total = $102k → 21.57% BTC
		// Drift: +1.57% — below 5% threshold, same rung (High Conviction)
		const input = makeInput({
			totalPortfolioUsd: 100_000,
			initialBtcPct: 20,
			initialBtcPrice: 50_000,
			currentBtcPrice: 55_000,
		});

		const result = calculateAllocationDrift(input);

		expect(Math.abs(result.driftPct)).toBeLessThan(5);
		expect(result.rungChanged).toBe(false);
		expect(result.rebalanceNeeded).toBe(false);
		expect(result.rebalanceAction).toContain("on target");
	});

	it("drift crosses rung boundary — triggers rebalance even if drift < 5%", () => {
		// Portfolio: $100k, 11% BTC (just inside High Conviction) at $50k/BTC
		// BTC holdings: 0.22 BTC; other assets: $89k
		// Price drops to $43k: BTC = $9.46k, total = $98.46k → ~9.6% BTC
		// Drift: ~1.4% (under 5%) but crosses from High Conviction (10%+) to Diversifier (5-10%)
		const input = makeInput({
			totalPortfolioUsd: 100_000,
			initialBtcPct: 11,
			initialBtcPrice: 50_000,
			currentBtcPrice: 43_000,
		});

		const result = calculateAllocationDrift(input);

		expect(result.currentBtcPct).toBeLessThan(10); // crossed the 10% threshold
		expect(result.rungChanged).toBe(true);
		expect(result.originalRung).toBe("High Conviction");
		expect(result.currentRung).toBe("Diversifier");
		expect(result.rebalanceNeeded).toBe(true);
	});

	it("edge case: 0 BTC holdings — no drift, stable at 0%", () => {
		const result = calculateAllocationDrift({
			initialBtcPct: 0,
			initialBtcPrice: 50_000,
			currentBtcPrice: 100_000,
			otherAssetsValue: 100_000,
			btcHoldings: 0,
		});

		expect(result.currentBtcPct).toBe(0);
		expect(result.driftPct).toBe(0);
		expect(result.rungChanged).toBe(false);
		expect(result.rebalanceNeeded).toBe(false);
		expect(result.originalRung).toBe("Observer");
		expect(result.currentRung).toBe("Observer");
	});

	it("edge case: zero total portfolio — currentBtcPct is 0, no crash", () => {
		const result = calculateAllocationDrift({
			initialBtcPct: 50,
			initialBtcPrice: 50_000,
			currentBtcPrice: 50_000,
			otherAssetsValue: 0,
			btcHoldings: 0,
		});

		expect(result.currentBtcPct).toBe(0);
		expect(result.rebalanceNeeded).toBe(true); // drifted from 50% to 0% → massive change
	});

	it("rebalance action references correct direction and percentage", () => {
		// BTC rises from 20% to ~40% → should say Sell
		const input = makeInput({
			totalPortfolioUsd: 100_000,
			initialBtcPct: 20,
			initialBtcPrice: 40_000,
			currentBtcPrice: 120_000, // 3x price
		});

		const result = calculateAllocationDrift(input);

		expect(result.rebalanceAction).toMatch(/Sell/i);
		expect(result.rebalanceAction).toContain("20.0%");
	});

	it("price drops substantially — action says Buy to return to target", () => {
		const input = makeInput({
			totalPortfolioUsd: 100_000,
			initialBtcPct: 40,
			initialBtcPrice: 100_000,
			currentBtcPrice: 20_000, // 80% crash
		});

		const result = calculateAllocationDrift(input);

		expect(result.rebalanceAction).toMatch(/Buy/i);
		expect(result.rebalanceAction).toContain("40.0%");
	});
});
