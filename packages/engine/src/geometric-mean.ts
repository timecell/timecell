import type { GeometricMeanResult } from "./types.js";

// =============================================================================
// Geometric Mean CAGR (Spitznagel Safe Haven Framework)
// =============================================================================

/**
 * Compare hedged vs unhedged CAGR over a crash cycle.
 *
 * Model: (n-1) good years at normalReturn, then 1 crash year.
 * Hedge costs annualCost each year but recovers a fraction of crash loss.
 *
 * Ported from open-fo calculateGeometricMeanCAGR.
 */
export function calculateGeometricMeanCAGR(
	normalReturn: number,
	annualCost: number,
	crashMagnitude: number,
	recoveryOfLoss: number,
	cycleLength: number,
): GeometricMeanResult {
	const recoveryValue = recoveryOfLoss * crashMagnitude;

	// Unhedged: (n-1) normal years then one crash year
	const unhedgedGrowth =
		Math.pow(1 + normalReturn, cycleLength - 1) * (1 - crashMagnitude);
	const unhedgedCAGR = Math.pow(unhedgedGrowth, 1 / cycleLength) - 1;

	// Hedged: (n-1) normal years minus cost, then crash year with recovery
	const hedgedGrowth =
		Math.pow(1 + normalReturn - annualCost, cycleLength - 1) *
		(1 - crashMagnitude + recoveryValue);
	const hedgedCAGR = Math.pow(hedgedGrowth, 1 / cycleLength) - 1;

	const improvement = hedgedCAGR - unhedgedCAGR;

	return {
		unhedgedCAGR,
		hedgedCAGR,
		improvement,
		isPositiveEV: improvement > 0,
		assumptions: {
			normalReturn,
			crashMagnitude,
			cycleLength,
			annualCost,
			recoveryPercent: recoveryOfLoss,
		},
	};
}

/**
 * Find the max cycle length where hedge improves CAGR (break-even point).
 * Lower = better (crash only needs to happen once every N years to justify hedge).
 *
 * Ported from open-fo calculateGeometricBreakeven.
 */
export function calculateGeometricBreakeven(
	annualCost: number,
	recoveryOfLoss: number,
	crashMagnitude = 0.5,
	normalReturn = 0.15,
): { breakEvenYears: number | null; annualProbability: number | null } {
	if (annualCost <= 0) {
		return { breakEvenYears: 1, annualProbability: 100 };
	}

	let lo = 2;
	let hi = 200;

	const atMin = calculateGeometricMeanCAGR(normalReturn, annualCost, crashMagnitude, recoveryOfLoss, lo);
	if (atMin.improvement <= 0) {
		return { breakEvenYears: null, annualProbability: null };
	}

	const atMax = calculateGeometricMeanCAGR(normalReturn, annualCost, crashMagnitude, recoveryOfLoss, hi);
	if (atMax.improvement > 0) {
		return { breakEvenYears: 200, annualProbability: 0.5 };
	}

	for (let i = 0; i < 50; i++) {
		const mid = (lo + hi) / 2;
		const result = calculateGeometricMeanCAGR(normalReturn, annualCost, crashMagnitude, recoveryOfLoss, mid);
		if (result.improvement > 0) {
			lo = mid;
		} else {
			hi = mid;
		}
	}

	const breakEvenYears = Math.round(lo);
	return {
		breakEvenYears,
		annualProbability: breakEvenYears > 0 ? (1 / breakEvenYears) * 100 : null,
	};
}
