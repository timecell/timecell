import { describe, it, expect } from "vitest";
import { calculateCapacityGate } from "./capacity-gate.js";
import type { CapacityGateInput } from "./capacity-gate.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE: CapacityGateInput = {
	age: 35,
	annualIncome: 200_000,
	withdrawalHorizonYears: 20,
	totalLiabilitiesAnnual: 40_000,
	totalPortfolioValue: 500_000,
	convictionRung: 4, // High Conviction → 25%
};

// ---------------------------------------------------------------------------
// Human capital (age + income)
// ---------------------------------------------------------------------------

describe("capacity gate — human capital", () => {
	it("young high-earner with small portfolio gets high capacity", () => {
		const result = calculateCapacityGate({
			...BASE,
			age: 28,
			annualIncome: 300_000,
			totalPortfolioValue: 200_000,
			totalLiabilitiesAnnual: 0,
			convictionRung: 6, // don't let conviction be the binding constraint
		});
		// Income ratio 1.5 → clamped to 1, age factor (75-28)/50 = 0.94
		// humanCapital = 1*0.6 + 0.94*0.4 = 0.976
		// liability factor = 1 (no liabilities)
		// raw = 97.6 → 98
		expect(result.capacityCeiling).toBeGreaterThanOrEqual(90);
	});

	it("older person near retirement gets lower capacity", () => {
		const result = calculateCapacityGate({
			...BASE,
			age: 65,
			annualIncome: 80_000,
			totalPortfolioValue: 2_000_000,
			totalLiabilitiesAnnual: 0,
			convictionRung: 6,
		});
		// Income ratio 0.04, age factor (75-65)/50 = 0.2
		// humanCapital = 0.04*0.6 + 0.2*0.4 = 0.024+0.08 = 0.104
		// raw = 10.4 → 10
		expect(result.capacityCeiling).toBeLessThanOrEqual(15);
	});

	it("age 75+ yields zero age factor", () => {
		const result = calculateCapacityGate({
			...BASE,
			age: 80,
			annualIncome: 50_000,
			totalPortfolioValue: 1_000_000,
			totalLiabilitiesAnnual: 0,
			convictionRung: 6,
		});
		// age factor = 0, income ratio = 0.05
		// humanCapital = 0.05*0.6 + 0*0.4 = 0.03
		// raw = 3
		expect(result.capacityCeiling).toBeLessThanOrEqual(5);
	});
});

// ---------------------------------------------------------------------------
// Liability drag
// ---------------------------------------------------------------------------

describe("capacity gate — liability drag", () => {
	it("high liabilities reduce capacity significantly", () => {
		const highLiab = calculateCapacityGate({
			...BASE,
			totalLiabilitiesAnnual: 160_000, // 80% of income
			convictionRung: 6,
		});
		const lowLiab = calculateCapacityGate({
			...BASE,
			totalLiabilitiesAnnual: 20_000, // 10% of income
			convictionRung: 6,
		});
		expect(highLiab.capacityCeiling).toBeLessThan(lowLiab.capacityCeiling);
	});

	it("liabilities equal to income yield zero capacity", () => {
		const result = calculateCapacityGate({
			...BASE,
			totalLiabilitiesAnnual: 200_000, // 100% of income
			convictionRung: 6,
		});
		expect(result.capacityCeiling).toBe(0);
	});

	it("provides reason for high liability burden", () => {
		const result = calculateCapacityGate({
			...BASE,
			totalLiabilitiesAnnual: 140_000, // 70%
			convictionRung: 4,
		});
		expect(result.reasons.some((r) => r.includes("liability burden"))).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Withdrawal horizon (retirement constraint)
// ---------------------------------------------------------------------------

describe("capacity gate — withdrawal horizon", () => {
	it("10+ years applies framework normally", () => {
		const result = calculateCapacityGate({ ...BASE, withdrawalHorizonYears: 15 });
		expect(result.reasons.some((r) => r.includes("framework applies normally"))).toBe(true);
	});

	it("5-10 years halves the capacity ceiling", () => {
		const normal = calculateCapacityGate({ ...BASE, withdrawalHorizonYears: 15, convictionRung: 6 });
		const halved = calculateCapacityGate({ ...BASE, withdrawalHorizonYears: 7, convictionRung: 6 });
		// The halved ceiling should be roughly half of normal
		expect(halved.capacityCeiling).toBeLessThanOrEqual(Math.round(normal.capacityCeiling / 2) + 1);
		expect(halved.reasons.some((r) => r.includes("halved"))).toBe(true);
	});

	it("under 5 years caps at 5%", () => {
		const result = calculateCapacityGate({
			...BASE,
			withdrawalHorizonYears: 3,
			convictionRung: 6,
		});
		expect(result.capacityCeiling).toBeLessThanOrEqual(5);
		expect(result.reasons.some((r) => r.includes("within 5 years"))).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Conviction vs capacity binding
// ---------------------------------------------------------------------------

describe("capacity gate — binding constraint", () => {
	it("conviction binds when capacity ceiling is higher", () => {
		// Young, high income, low liabilities, long horizon → high capacity
		// But rung 2 (Experimenter) only allows 3%
		const result = calculateCapacityGate({
			...BASE,
			convictionRung: 2,
		});
		expect(result.binding).toBe("conviction");
		expect(result.effectiveAllocation).toBe(3); // Experimenter max
		expect(result.convictionAllocation).toBe(3);
	});

	it("capacity binds when conviction ceiling is higher", () => {
		// Older, low income, high liabilities → low capacity
		// But rung 6 (Single-Asset Core) allows 100%
		const result = calculateCapacityGate({
			age: 65,
			annualIncome: 60_000,
			withdrawalHorizonYears: 7, // halved
			totalLiabilitiesAnnual: 30_000,
			totalPortfolioValue: 2_000_000,
			convictionRung: 6,
		});
		expect(result.binding).toBe("capacity");
		expect(result.effectiveAllocation).toBeLessThan(100);
		expect(result.convictionAllocation).toBe(100);
	});

	it("effective allocation is min of conviction and capacity", () => {
		const result = calculateCapacityGate(BASE); // rung 4 → 25%
		expect(result.effectiveAllocation).toBe(
			Math.min(result.convictionAllocation, result.capacityCeiling),
		);
	});
});

// ---------------------------------------------------------------------------
// Conviction rung mapping
// ---------------------------------------------------------------------------

describe("capacity gate — conviction rung max allocations", () => {
	it.each([
		[1, 0],
		[2, 3],
		[3, 10],
		[4, 25],
		[5, 50],
		[6, 100],
	])("rung %i maps to %i%% max", (rung, expected) => {
		const result = calculateCapacityGate({
			...BASE,
			convictionRung: rung,
			// Ensure capacity doesn't bind for high rungs
			age: 25,
			annualIncome: 500_000,
			totalPortfolioValue: 100_000,
			totalLiabilitiesAnnual: 0,
			withdrawalHorizonYears: 30,
		});
		expect(result.convictionAllocation).toBe(expected);
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("capacity gate — edge cases", () => {
	it("zero income yields capacity based on age only", () => {
		const result = calculateCapacityGate({
			...BASE,
			annualIncome: 0,
			totalLiabilitiesAnnual: 0,
			convictionRung: 6,
		});
		// income ratio = 0, liability factor = 1 (0/0 → liabilityRatio=1 → factor=0)
		// With zero income, liabilityRatio = totalLiab/annualIncome → guarded as 1
		// So liabilityFactor = 0, ceiling = 0
		expect(result.capacityCeiling).toBe(0);
	});

	it("zero portfolio value handles gracefully", () => {
		const result = calculateCapacityGate({
			...BASE,
			totalPortfolioValue: 0,
			convictionRung: 4,
		});
		// income ratio = annualIncome/0 → guarded as 1
		expect(result.capacityCeiling).toBeGreaterThan(0);
	});

	it("rung clamped to 1-6 range", () => {
		const low = calculateCapacityGate({ ...BASE, convictionRung: 0 });
		const high = calculateCapacityGate({ ...BASE, convictionRung: 9 });
		expect(low.convictionAllocation).toBe(0); // clamped to rung 1
		expect(high.convictionAllocation).toBe(100); // clamped to rung 6
	});

	it("capacity ceiling is always 0-100", () => {
		const result = calculateCapacityGate({
			...BASE,
			age: 20,
			annualIncome: 10_000_000,
			totalPortfolioValue: 1_000,
			totalLiabilitiesAnnual: 0,
			withdrawalHorizonYears: 50,
			convictionRung: 6,
		});
		expect(result.capacityCeiling).toBeLessThanOrEqual(100);
		expect(result.capacityCeiling).toBeGreaterThanOrEqual(0);
	});

	it("reasons array is never empty", () => {
		const result = calculateCapacityGate(BASE);
		expect(result.reasons.length).toBeGreaterThan(0);
	});
});
