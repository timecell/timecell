// =============================================================================
// Temperature — Composite Bitcoin cycle position score
// =============================================================================
// Score: MVRV (60%) + RHODL (40%), normalized to 0–100
// Zones: Extreme Fear / Fear / Neutral / Greed / Extreme Greed

export interface TemperatureResult {
	score: number;
	zone: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
	mvrv: number;
	rhodl: number;
}

/**
 * Derive a 0–100 temperature score from raw MVRV and RHODL ratios.
 *
 * Normalization ranges (approximate historical bounds):
 *   MVRV:  0.5 → 0,  4.5 → 100
 *   RHODL: 0.5 → 0,  4.5 → 100  (RHODL ratio uses similar scale)
 *
 * Weighted composite: 60% MVRV + 40% RHODL, clamped to [0, 100].
 */
export function calculateTemperature(mvrv: number, rhodl: number): TemperatureResult {
	const MVRV_MIN = 0.5;
	const MVRV_MAX = 4.5;
	const RHODL_MIN = 0.5;
	const RHODL_MAX = 4.5;

	const mvrvNorm = Math.max(0, Math.min(100, ((mvrv - MVRV_MIN) / (MVRV_MAX - MVRV_MIN)) * 100));
	const rhodlNorm = Math.max(0, Math.min(100, ((rhodl - RHODL_MIN) / (RHODL_MAX - RHODL_MIN)) * 100));

	const score = Math.round(mvrvNorm * 0.6 + rhodlNorm * 0.4);

	const zone = scoreToZone(score);

	return { score, zone, mvrv, rhodl };
}

export function scoreToZone(score: number): TemperatureResult["zone"] {
	if (score < 20) return "Extreme Fear";
	if (score < 40) return "Fear";
	if (score < 60) return "Neutral";
	if (score < 75) return "Greed";
	return "Extreme Greed";
}
