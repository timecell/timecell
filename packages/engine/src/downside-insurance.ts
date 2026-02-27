// =============================================================================
// Downside Insurance Calculator (Framework Part 6)
// =============================================================================
// Put option budgeting and hedge breakeven calculator.
// Insurance is a cost, not a trade — the goal is improving long-term
// geometric mean CAGR by preventing forced selling during crashes.

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InsuranceInput {
	/** Total value of BTC holdings in USD */
	totalBtcValueUsd: number;
	/** Current BTC price in USD */
	btcPriceUsd: number;
	/** % of BTC value allocated to hedge (e.g. 2 = 2%) */
	hedgeBudgetPct: number;
	/** Put strike as % of current price (e.g. 70 = strike at 70% of current price = 30% OTM) */
	putStrikePct: number;
	/** Put premium as % of notional protected (e.g. 3 = 3% of notional) */
	putCostPct: number;
	/** Months until put expires */
	expiryMonths: number;
}

export interface InsuranceResult {
	/** Hedge budget in USD (hedgeBudgetPct% of totalBtcValue) */
	hedgeBudgetUsd: number;
	/** Notional BTC value protected: budget / (putCostPct/100) */
	notionalProtected: number;
	/** Dollar strike price: btcPrice * putStrikePct/100 */
	putStrikePrice: number;
	/** Total premium cost in USD (= hedgeBudgetUsd) */
	putPremiumUsd: number;
	/** Max portfolio loss WITH insurance in a full crash (BTC -> 0) */
	maxLossWithInsurance: number;
	/** Max portfolio loss WITHOUT insurance in a full crash (BTC -> 0) */
	maxLossWithout: number;
	/** Drawdown % at which hedge payoff exactly equals premium paid */
	breakEvenDrawdown: number;
	/** Hedge payoff if BTC drops 80% */
	payoffAt80pctCrash: number;
	/** hedgeROI: payoff / premium - 1 (at 80% crash scenario) */
	hedgeROI: number;
	/** Monthly cost of maintaining hedge in USD */
	costPerMonth: number;
	/** Annualized cost as % of total BTC portfolio value */
	annualizedCostPct: number;
	/** Payoff at each standard drawdown scenario: 30%, 50%, 70%, 80% */
	payoffScenarios: Array<{ drawdownPct: number; payoffUsd: number; netGainUsd: number }>;
}

// -----------------------------------------------------------------------------
// Core calculation
// -----------------------------------------------------------------------------

/**
 * Calculate downside insurance parameters for put option hedging.
 *
 * Key insight: the hedge budget is fixed (hedgeBudgetPct% of BTC value).
 * That budget divided by the per-unit cost tells you how much notional you protect.
 *
 * Pure function — no side effects.
 */
export function calculateDownsideInsurance(input: InsuranceInput): InsuranceResult {
	const {
		totalBtcValueUsd,
		btcPriceUsd,
		hedgeBudgetPct,
		putStrikePct,
		putCostPct,
		expiryMonths,
	} = input;

	// How many USD we're willing to spend on puts
	const hedgeBudgetUsd = totalBtcValueUsd * (hedgeBudgetPct / 100);

	// Notional value protected: if premium is X% of notional, then
	// notional = budget / (premium rate)
	// e.g. budget=$2000, premium=3% => notional=$66,667
	const putCostRate = putCostPct / 100;
	const notionalProtected = putCostRate > 0 ? hedgeBudgetUsd / putCostRate : 0;

	// Strike price in USD
	const putStrikePrice = btcPriceUsd * (putStrikePct / 100);

	// Total premium = budget (by definition — we spend the full budget)
	const putPremiumUsd = hedgeBudgetUsd;

	// How many BTC-equivalent contracts does the notional cover?
	// notionalProtected / btcPrice = number of "BTC units" under insurance
	const btcUnitsProtected = btcPriceUsd > 0 ? notionalProtected / btcPriceUsd : 0;

	// Payoff at a given crash price:
	// payoff = max(0, strikePrice - crashPrice) * btcUnitsProtected
	function payoffAtCrashPrice(crashPrice: number): number {
		return Math.max(0, putStrikePrice - crashPrice) * btcUnitsProtected;
	}

	// Payoff at 80% crash (BTC drops 80%, remaining price = 20% of current)
	const crashPrice80 = btcPriceUsd * 0.2;
	const payoffAt80pctCrash = payoffAtCrashPrice(crashPrice80);

	// ROI on the hedge at 80% crash scenario
	const hedgeROI = putPremiumUsd > 0 ? payoffAt80pctCrash / putPremiumUsd - 1 : 0;

	// Max loss WITHOUT insurance: lose the entire BTC position
	const maxLossWithout = totalBtcValueUsd;

	// Max loss WITH insurance: lose full position but receive max payoff
	// Max payoff occurs when BTC goes to $0 => strikePrice * btcUnitsProtected
	const maxPutPayoff = putStrikePrice * btcUnitsProtected;
	const maxLossWithInsurance = Math.max(0, totalBtcValueUsd - maxPutPayoff + putPremiumUsd);

	// Break-even drawdown: find the drawdown% where payoff = premium paid
	// payoff = max(0, strike - crashPrice) * btcUnits = premium
	// strike - crashPrice = premium / btcUnits
	// crashPrice = strike - premium / btcUnits
	// drawdown = (currentPrice - crashPrice) / currentPrice
	let breakEvenDrawdown = 0;
	if (btcUnitsProtected > 0) {
		const breakEvenCrashPrice = putStrikePrice - putPremiumUsd / btcUnitsProtected;
		if (breakEvenCrashPrice < btcPriceUsd) {
			breakEvenDrawdown = ((btcPriceUsd - breakEvenCrashPrice) / btcPriceUsd) * 100;
			// Clamp: only meaningful if crash price is above 0 and below strike
			if (breakEvenCrashPrice <= 0) breakEvenDrawdown = 100;
		}
	}

	// Monthly and annualized cost
	const months = Math.max(1, expiryMonths);
	const costPerMonth = putPremiumUsd / months;
	const annualizedCostPct =
		totalBtcValueUsd > 0 ? (putPremiumUsd / months) * 12 / totalBtcValueUsd * 100 : 0;

	// Payoff scenarios at standard drawdown levels
	const STANDARD_DRAWDOWNS = [30, 50, 70, 80];
	const payoffScenarios = STANDARD_DRAWDOWNS.map((drawdownPct) => {
		const crashPrice = btcPriceUsd * (1 - drawdownPct / 100);
		const payoffUsd = payoffAtCrashPrice(crashPrice);
		const netGainUsd = payoffUsd - putPremiumUsd;
		return { drawdownPct, payoffUsd, netGainUsd };
	});

	return {
		hedgeBudgetUsd,
		notionalProtected,
		putStrikePrice,
		putPremiumUsd,
		maxLossWithInsurance,
		maxLossWithout,
		breakEvenDrawdown,
		payoffAt80pctCrash,
		hedgeROI,
		costPerMonth,
		annualizedCostPct,
		payoffScenarios,
	};
}
