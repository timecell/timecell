import { describe, it, expect } from "vitest";
import { calculateSleepTest } from "./sleep-test.js";

describe("sleep test", () => {
	it("calculates correct losses with default drawdowns (80% BTC, 40% other)", () => {
		const result = calculateSleepTest({
			totalPortfolioValue: 1_000_000,
			btcPercentage: 50,
		});

		// BTC: 500K * 80% = 400K loss
		expect(result.currentBtcValue).toBe(500_000);
		expect(result.btcLoss).toBe(400_000);

		// Other: 500K * 40% = 200K loss
		expect(result.otherAssetsLoss).toBe(200_000);

		// Total: 600K loss, 400K remaining
		expect(result.totalLoss).toBe(600_000);
		expect(result.postCrashValue).toBe(400_000);
		expect(result.lossPercentage).toBe(60);
	});

	it("handles 100% BTC allocation", () => {
		const result = calculateSleepTest({
			totalPortfolioValue: 500_000,
			btcPercentage: 100,
		});

		expect(result.currentBtcValue).toBe(500_000);
		expect(result.btcLoss).toBe(400_000);
		expect(result.otherAssetsLoss).toBe(0);
		expect(result.totalLoss).toBe(400_000);
		expect(result.postCrashValue).toBe(100_000);
		expect(result.lossPercentage).toBe(80);
	});

	it("handles 0% BTC allocation", () => {
		const result = calculateSleepTest({
			totalPortfolioValue: 500_000,
			btcPercentage: 0,
		});

		expect(result.currentBtcValue).toBe(0);
		expect(result.btcLoss).toBe(0);
		expect(result.otherAssetsLoss).toBe(200_000);
		expect(result.totalLoss).toBe(200_000);
		expect(result.postCrashValue).toBe(300_000);
		expect(result.lossPercentage).toBe(40);
	});

	it("uses custom drawdown percentages", () => {
		const result = calculateSleepTest({
			totalPortfolioValue: 1_000_000,
			btcPercentage: 30,
			btcDrawdown: 50,
			otherAssetsDrawdown: 20,
		});

		// BTC: 300K * 50% = 150K loss
		expect(result.btcLoss).toBe(150_000);

		// Other: 700K * 20% = 140K loss
		expect(result.otherAssetsLoss).toBe(140_000);

		expect(result.totalLoss).toBe(290_000);
		expect(result.postCrashValue).toBe(710_000);
		expect(result.lossPercentage).toBeCloseTo(29);
	});

	it("generates a human-readable message with default drawdown", () => {
		const result = calculateSleepTest({
			totalPortfolioValue: 1_000_000,
			btcPercentage: 50,
		});

		expect(result.message).toContain("80%");
		expect(result.message).toContain("$600,000");
		expect(result.message).toContain("Does your life change?");
	});

	it("generates message with custom drawdown", () => {
		const result = calculateSleepTest({
			totalPortfolioValue: 1_000_000,
			btcPercentage: 50,
			btcDrawdown: 50,
		});

		expect(result.message).toContain("50%");
	});

	it("handles zero portfolio value", () => {
		const result = calculateSleepTest({
			totalPortfolioValue: 0,
			btcPercentage: 50,
		});

		expect(result.totalLoss).toBe(0);
		expect(result.postCrashValue).toBe(0);
		expect(result.lossPercentage).toBe(0);
	});

	it("small BTC allocation has lower loss percentage", () => {
		const small = calculateSleepTest({
			totalPortfolioValue: 1_000_000,
			btcPercentage: 5,
		});
		const large = calculateSleepTest({
			totalPortfolioValue: 1_000_000,
			btcPercentage: 50,
		});

		expect(small.lossPercentage).toBeLessThan(large.lossPercentage);
		expect(small.totalLoss).toBeLessThan(large.totalLoss);
	});
});
