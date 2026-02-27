// =============================================================================
// Custody Risk (Framework Part 7)
// =============================================================================
// Tracks what BTC is on exchange vs cold storage.
// Exchange BTC carries counterparty risk (hacks, insolvency, freezes).
// Self-custody BTC is yours unconditionally.

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CustodyInput {
	/** Total USD value of BTC holdings */
	totalBtcValueUsd: number;
	/** Percentage of BTC held on exchanges (0–100) */
	exchangePct: number;
	/** Current BTC price in USD */
	btcPriceUsd: number;
}

export type CustodyRiskLevel = "low" | "moderate" | "high" | "critical";

export interface CustodyResult {
	/** USD value of BTC on exchanges */
	exchangeValueUsd: number;
	/** USD value of BTC in self-custody */
	selfCustodyValueUsd: number;
	/** BTC amount on exchanges */
	exchangeBtc: number;
	/** BTC amount in self-custody */
	selfCustodyBtc: number;
	/** Risk classification based on exchange percentage */
	riskLevel: CustodyRiskLevel;
	/** Actionable recommendation based on risk level */
	recommendation: string;
	/** Dollar amount at risk from exchange failure */
	exchangeRiskExposure: number;
}

// -----------------------------------------------------------------------------
// Risk thresholds
// <10%   → Low
// 10–30% → Moderate
// 30–60% → High
// >60%   → Critical
// -----------------------------------------------------------------------------

function classifyRisk(exchangePct: number): CustodyRiskLevel {
	if (exchangePct < 10) return "low";
	if (exchangePct < 30) return "moderate";
	if (exchangePct < 60) return "high";
	return "critical";
}

function buildRecommendation(riskLevel: CustodyRiskLevel, exchangePct: number): string {
	switch (riskLevel) {
		case "low":
			return "Good custody hygiene. Less than 10% on exchange minimises counterparty risk. Keep only what you need for active trading.";
		case "moderate":
			return `${exchangePct.toFixed(0)}% on exchange is manageable but elevated. Move excess to cold storage — aim for under 10% on exchange.`;
		case "high":
			return `${exchangePct.toFixed(0)}% on exchange is high-risk. Exchange failures (FTX, Mt. Gox) can be total losses. Withdraw to hardware wallet urgently.`;
		case "critical":
			return `${exchangePct.toFixed(0)}% on exchange is critical. "Not your keys, not your coins." This level of exchange exposure can be catastrophic if an exchange fails. Withdraw immediately.`;
	}
}

// -----------------------------------------------------------------------------
// Core calculation
// -----------------------------------------------------------------------------

/**
 * Calculate custody risk profile: exchange vs self-custody split,
 * risk level, and actionable recommendation.
 *
 * Pure function — no side effects.
 */
export function calculateCustodyRisk(input: CustodyInput): CustodyResult {
	const { totalBtcValueUsd, exchangePct, btcPriceUsd } = input;

	// Clamp exchange percentage to valid range
	const clampedPct = Math.max(0, Math.min(100, exchangePct));

	// Dollar split
	const exchangeValueUsd = totalBtcValueUsd * (clampedPct / 100);
	const selfCustodyValueUsd = totalBtcValueUsd - exchangeValueUsd;

	// BTC amounts
	const exchangeBtc = btcPriceUsd > 0 ? exchangeValueUsd / btcPriceUsd : 0;
	const selfCustodyBtc = btcPriceUsd > 0 ? selfCustodyValueUsd / btcPriceUsd : 0;

	// Risk classification
	const riskLevel = classifyRisk(clampedPct);

	// Recommendation
	const recommendation = buildRecommendation(riskLevel, clampedPct);

	// Full exchange value is the exposure — exchange failure = total loss of that portion
	const exchangeRiskExposure = exchangeValueUsd;

	return {
		exchangeValueUsd,
		selfCustodyValueUsd,
		exchangeBtc,
		selfCustodyBtc,
		riskLevel,
		recommendation,
		exchangeRiskExposure,
	};
}
