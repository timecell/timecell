// =============================================================================
// Runway Calculator
// =============================================================================

/**
 * Calculate runway in months: how long can you sustain current burn
 * from available liquidity without selling assets.
 */
export function calculateRunwayMonths(
	availableLiquidity: number,
	monthlyBurn: number,
): number {
	if (monthlyBurn <= 0) return Infinity;
	if (availableLiquidity <= 0) return 0;
	return availableLiquidity / monthlyBurn;
}
