// =============================================================================
// Selling Rules Engine (Framework Part 5)
// =============================================================================
// Temperature-based selling schedule. Each tier is cumulative — as temperature
// rises through thresholds, progressively more of the BTC position is sold.
// Dollar and BTC amounts are calculated at the current BTC price.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SellingRulesInput {
	temperatureScore: number; // 0-100
	btcPercentage: number; // 0-100 — what % of total portfolio is BTC
	totalBtcValueUsd: number; // current total BTC position value in USD
	btcPriceUsd: number; // current BTC price in USD
}

export interface SellingSchedule {
	temperatureThreshold: number; // temperature at which this tier fires
	label: string; // zone name (e.g. "Caution")
	action: string; // human-readable action description
	sellPct: number; // % of original BTC position to sell at this tier
	sellAmountUsd: number; // USD value to sell at this tier
	sellBtc: number; // BTC to sell at this tier
	remainingBtcPct: number; // % of original BTC position remaining after this tier
	triggered: boolean; // true if current temperature >= threshold
}

export interface SellingRulesResult {
	schedule: SellingSchedule[];
	currentlyTriggered: SellingSchedule[]; // tiers where temperature >= threshold
	totalSellIfAllTriggered: number; // USD if all tiers fire
	remainingBtcAfterAll: number; // USD remaining in BTC after all tiers
}

// ---------------------------------------------------------------------------
// Default selling schedule tiers (cumulative sell percentages)
// Each tier sells an additional slice of the ORIGINAL position size.
// ---------------------------------------------------------------------------

interface TierDefinition {
	temperatureThreshold: number;
	label: string;
	action: string;
	sellPct: number; // % of original BTC position this tier sells
}

const DEFAULT_TIERS: TierDefinition[] = [
	{
		temperatureThreshold: 70,
		label: "Caution",
		action: "Sell 5% of BTC position",
		sellPct: 5,
	},
	{
		temperatureThreshold: 75,
		label: "Getting Hot",
		action: "Sell additional 10%",
		sellPct: 10,
	},
	{
		temperatureThreshold: 80,
		label: "Extreme Greed",
		action: "Sell additional 15%",
		sellPct: 15,
	},
	{
		temperatureThreshold: 85,
		label: "Peak Zone",
		action: "Sell additional 20%",
		sellPct: 20,
	},
	{
		temperatureThreshold: 90,
		label: "Euphoria",
		action: "Sell additional 25%",
		sellPct: 25,
	},
	{
		temperatureThreshold: 95,
		label: "Blow-Off Top",
		action: "Sell all remaining",
		sellPct: 25, // whatever is left (25% of original in the default schedule)
	},
];

// ---------------------------------------------------------------------------
// Pure calculation function
// ---------------------------------------------------------------------------

export function calculateSellingRules(input: SellingRulesInput): SellingRulesResult {
	const { temperatureScore, totalBtcValueUsd, btcPriceUsd } = input;

	// Guard: avoid division by zero
	const safePrice = btcPriceUsd > 0 ? btcPriceUsd : 1;

	let cumulativeSoldPct = 0;

	const schedule: SellingSchedule[] = DEFAULT_TIERS.map((tier) => {
		const sellAmountUsd = (tier.sellPct / 100) * totalBtcValueUsd;
		const sellBtc = sellAmountUsd / safePrice;
		cumulativeSoldPct += tier.sellPct;
		const remainingBtcPct = Math.max(0, 100 - cumulativeSoldPct);

		return {
			temperatureThreshold: tier.temperatureThreshold,
			label: tier.label,
			action: tier.action,
			sellPct: tier.sellPct,
			sellAmountUsd,
			sellBtc,
			remainingBtcPct,
			triggered: temperatureScore >= tier.temperatureThreshold,
		};
	});

	const currentlyTriggered = schedule.filter((s) => s.triggered);

	// Total USD sold if all tiers triggered
	const totalSellIfAllTriggered = schedule.reduce((sum, s) => sum + s.sellAmountUsd, 0);

	// Remaining BTC value after all tiers
	const remainingBtcAfterAll = Math.max(0, totalBtcValueUsd - totalSellIfAllTriggered);

	return {
		schedule,
		currentlyTriggered,
		totalSellIfAllTriggered,
		remainingBtcAfterAll,
	};
}
