// =============================================================================
// Temperature — Composite Bitcoin cycle position score (v3.0)
// =============================================================================
// Score: MVRV (60%) + RHODL (40%), normalized to 0–100
// MVRV: z-score normalized using mean=1.73, std=1.36 → standard normal CDF
// RHODL: log-scale normalized between 120–30,541
// Zones: 6-tier (Extreme Fear / Fear / Neutral / Caution / Greed / Extreme Greed)

export type TemperatureZone =
	| "Extreme Fear"
	| "Fear"
	| "Neutral"
	| "Caution"
	| "Greed"
	| "Extreme Greed";

export interface TemperatureResult {
	score: number;
	zone: TemperatureZone;
	mvrvScore: number;
	rhodlScore: number;
	mvrv: number;
	rhodl: number;
}

// ---------------------------------------------------------------------------
// Normalization constants (from btc_temp_config_v3.json)
// ---------------------------------------------------------------------------

const MVRV_MEAN = 1.73;
const MVRV_STD = 1.36;
const RHODL_MIN = 120;
const RHODL_MAX = 30_541;

// ---------------------------------------------------------------------------
// Math helpers — pure functions, zero dependencies
// ---------------------------------------------------------------------------

/**
 * Standard normal CDF approximation using the error function.
 * Uses Abramowitz & Stegun erf approximation (formula 7.1.26).
 * Maximum error: |ε| < 1.5 × 10⁻⁷
 */
function normCdf(z: number): number {
	const a1 = 0.254829592;
	const a2 = -0.284496736;
	const a3 = 1.421413741;
	const a4 = -1.453152027;
	const a5 = 1.061405429;
	const p = 0.3275911;

	const sign = z >= 0 ? 1 : -1;
	const absZ = Math.abs(z) / Math.SQRT2;

	const t = 1.0 / (1.0 + p * absZ);
	const y =
		1.0 -
		(((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ));

	return 0.5 * (1.0 + sign * y);
}

/**
 * Normalize MVRV using z-score → standard normal CDF.
 * Returns a 0–100 score.
 */
export function normalizeMvrv(mvrv: number): number {
	const z = (mvrv - MVRV_MEAN) / MVRV_STD;
	return normCdf(z) * 100;
}

/**
 * Normalize RHODL using log₁₀ scale between RHODL_MIN and RHODL_MAX.
 * Returns a 0–100 score, clamped.
 */
export function normalizeRhodl(rhodl: number): number {
	if (rhodl <= RHODL_MIN) return 0;
	if (rhodl >= RHODL_MAX) return 100;

	const logVal = Math.log10(rhodl);
	const logMin = Math.log10(RHODL_MIN);
	const logMax = Math.log10(RHODL_MAX);

	return ((logVal - logMin) / (logMax - logMin)) * 100;
}

// ---------------------------------------------------------------------------
// Temperature calculation
// ---------------------------------------------------------------------------

/**
 * Derive a 0–100 temperature score from raw MVRV and RHODL values.
 *
 * v3.0 formula:
 *   MVRV score  = normCdf((mvrv − 1.73) / 1.36) × 100
 *   RHODL score = log₁₀ normalization between 120 and 30,541
 *   Temperature = MVRV score × 0.60 + RHODL score × 0.40
 */
export function calculateTemperature(mvrv: number, rhodl: number): TemperatureResult {
	const mvrvScore = normalizeMvrv(mvrv);
	const rhodlScore = normalizeRhodl(rhodl);

	const raw = mvrvScore * 0.6 + rhodlScore * 0.4;
	const score = Math.round(Math.max(0, Math.min(100, raw)));

	const zone = scoreToZone(score);

	return { score, zone, mvrvScore: Math.round(mvrvScore * 10) / 10, rhodlScore: Math.round(rhodlScore * 10) / 10, mvrv, rhodl };
}

// ---------------------------------------------------------------------------
// Zone mapping — 6-tier system matching production
// ---------------------------------------------------------------------------

export function scoreToZone(score: number): TemperatureZone {
	if (score < 30) return "Extreme Fear";
	if (score < 50) return "Fear";
	if (score < 60) return "Neutral";
	if (score < 70) return "Caution";
	if (score < 80) return "Greed";
	return "Extreme Greed";
}
