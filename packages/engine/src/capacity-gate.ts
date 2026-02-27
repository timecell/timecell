// =============================================================================
// Capacity Gate (Framework Part 3, Step 2)
// =============================================================================
// "Your conviction says what you'd LIKE to allocate. Your capacity says what
// you CAN allocate."
//
// Effective Allocation = min(Conviction Rung Max, Risk Capacity Ceiling)
//
// Capacity depends on human capital (age/income), withdrawal horizon,
// and liability schedule. Pure function — no side effects.

// -----------------------------------------------------------------------------
// Conviction rung max allocations (upper bound per rung)
// -----------------------------------------------------------------------------

const CONVICTION_MAX: Record<number, number> = {
	1: 0, // Observer
	2: 3, // Experimenter
	3: 10, // Diversifier
	4: 25, // High Conviction
	5: 50, // Owner-Class
	6: 100, // Single-Asset Core
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CapacityGateInput {
	age: number;
	annualIncome: number;
	withdrawalHorizonYears: number; // when will they need the money?
	totalLiabilitiesAnnual: number; // annual fixed obligations (mortgage, school, etc.)
	totalPortfolioValue: number;
	convictionRung: number; // 1-6 from conviction ladder
}

export interface CapacityGateResult {
	capacityCeiling: number; // max BTC % allowed by capacity (0-100)
	effectiveAllocation: number; // min(conviction rung max, capacity ceiling)
	convictionAllocation: number; // what conviction allows (rung max %)
	binding: "conviction" | "capacity"; // which constraint is tighter
	reasons: string[]; // why capacity is what it is
}

// -----------------------------------------------------------------------------
// Core calculation
// -----------------------------------------------------------------------------

/**
 * Calculate the capacity gate: how much BTC allocation your financial
 * situation actually supports, regardless of conviction.
 *
 * Pure function — no side effects.
 */
export function calculateCapacityGate(input: CapacityGateInput): CapacityGateResult {
	const {
		age,
		annualIncome,
		withdrawalHorizonYears,
		totalLiabilitiesAnnual,
		totalPortfolioValue,
		convictionRung,
	} = input;

	const reasons: string[] = [];

	// --- 1. Human capital score (0-100) ---
	// Young + high income relative to portfolio = high capacity to recover from losses.
	// Income-to-portfolio ratio: how many years of income the portfolio represents.
	// If portfolio is small relative to income, you can rebuild quickly.
	const incomeRatio = totalPortfolioValue > 0 ? annualIncome / totalPortfolioValue : 1;
	// Clamp to [0, 1] — ratio of 1+ means income >= portfolio (high capacity)
	const incomeScore = Math.min(incomeRatio, 1);

	// Age factor: younger = more human capital remaining.
	// Linear from 100% at age 25 to 0% at age 75.
	const ageFactor = Math.max(0, Math.min(1, (75 - age) / 50));

	// Blend: 60% income ratio, 40% age factor
	const humanCapitalScore = incomeScore * 0.6 + ageFactor * 0.4;

	if (ageFactor >= 0.8) {
		reasons.push("Young age provides long recovery horizon");
	} else if (ageFactor <= 0.3) {
		reasons.push("Limited working years reduce recovery capacity");
	}

	if (incomeScore >= 0.5) {
		reasons.push("Strong income relative to portfolio supports higher capacity");
	} else if (incomeScore < 0.2) {
		reasons.push("Portfolio is large relative to income — harder to rebuild from losses");
	}

	// --- 2. Liability drag (0-1, where 0 = max drag, 1 = no drag) ---
	// What fraction of income is consumed by fixed obligations?
	const liabilityRatio = annualIncome > 0 ? totalLiabilitiesAnnual / annualIncome : 1;
	const liabilityFactor = Math.max(0, 1 - liabilityRatio);

	if (liabilityRatio >= 0.6) {
		reasons.push(
			`High liability burden (${Math.round(liabilityRatio * 100)}% of income) creates forced-sale risk`,
		);
	} else if (liabilityRatio >= 0.3) {
		reasons.push(`Moderate liabilities (${Math.round(liabilityRatio * 100)}% of income)`);
	}

	// --- 3. Base capacity ceiling ---
	// Combine human capital and liability drag → raw ceiling as percentage.
	// Max capacity is 100%. The two factors multiply to penalize either being weak.
	let rawCeiling = humanCapitalScore * liabilityFactor * 100;

	// --- 4. Withdrawal horizon constraint (retirement rule) ---
	if (withdrawalHorizonYears < 5) {
		// Under 5 years: Bitcoin only from money genuinely outside retirement math.
		// Cap at 5% — only "play money" should be in BTC.
		rawCeiling = Math.min(rawCeiling, 5);
		reasons.push(
			"Withdrawal needed within 5 years — BTC only from money outside retirement math",
		);
	} else if (withdrawalHorizonYears < 10) {
		// 5-10 years: halve capacity ceiling.
		rawCeiling = rawCeiling * 0.5;
		reasons.push("5-10 year withdrawal horizon — capacity ceiling halved");
	} else {
		reasons.push("10+ year horizon — framework applies normally");
	}

	// Round to nearest integer, clamp to [0, 100]
	const capacityCeiling = Math.round(Math.max(0, Math.min(100, rawCeiling)));

	// --- 5. Effective allocation = min(conviction, capacity) ---
	const rung = Math.max(1, Math.min(6, Math.round(convictionRung)));
	const convictionAllocation = CONVICTION_MAX[rung] ?? 0;
	const effectiveAllocation = Math.min(convictionAllocation, capacityCeiling);
	const binding: "conviction" | "capacity" =
		capacityCeiling <= convictionAllocation ? "capacity" : "conviction";

	return {
		capacityCeiling,
		effectiveAllocation,
		convictionAllocation,
		binding,
		reasons,
	};
}
