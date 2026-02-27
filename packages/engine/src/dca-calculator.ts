// =============================================================================
// DCA Calculator — Framework Part 4
// =============================================================================
// Dollar Cost Averaging simulation using a deterministic sinusoidal cycle
// model (no randomness). Models BTC's 4-year halving cycle.
//
// Temperature-adjusted DCA: buy more in fear zones, less or pause in greed.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DCAInput {
	monthlyAmount: number; // USD per month
	months: number; // How many months to DCA
	currentBtcPrice: number; // Starting BTC price
	annualGrowthRate?: number; // Expected annual BTC growth (default 0.30 = 30%)
	volatility?: number; // Price cycle amplitude factor (default 0.6 = 60%)
}

export interface DCAResult {
	totalInvested: number;
	totalBtcAccumulated: number;
	averageCostBasis: number;
	currentValue: number;
	returnPct: number;
	schedule: DCAMonth[];
}

export interface DCAMonth {
	month: number;
	invested: number; // Cumulative invested USD
	btcPrice: number; // Simulated BTC price that month
	btcBought: number; // BTC bought that month
	totalBtc: number; // Cumulative BTC held
	totalValue: number; // Current value of holdings at that month's price
	costBasis: number; // Average cost basis (USD/BTC)
}

// ---------------------------------------------------------------------------
// Price model
// ---------------------------------------------------------------------------

/**
 * Deterministic BTC price model using a sinusoidal 4-year halving cycle.
 *
 * Formula:
 *   trend   = startPrice * (1 + monthlyGrowthRate) ^ month
 *   cycle   = sin(2π * month / 48) * volatility * trend
 *   price   = trend + cycle   (clamped to minimum $1)
 *
 * The 48-month cycle (4 years) models the BTC halving cycle.
 * Volatility controls the amplitude of the sine wave relative to trend.
 */
function simulatePrice(
	startPrice: number,
	month: number,
	monthlyGrowthRate: number,
	volatility: number,
): number {
	const trend = startPrice * (1 + monthlyGrowthRate) ** month;
	const cycle = Math.sin((2 * Math.PI * month) / 48) * volatility * trend;
	return Math.max(1, trend + cycle);
}

// ---------------------------------------------------------------------------
// Multiplier by temperature zone
// ---------------------------------------------------------------------------

/**
 * Returns the spend multiplier for temperature-adjusted DCA.
 *
 * Temperature zones:
 *   < 30  — Extreme Fear / Fear: buy 2x (max opportunity)
 *   30-60 — Neutral: buy 1x (normal)
 *   60-80 — Greed / Caution: buy 0.5x (reduce)
 *   > 80  — Extreme Greed: buy 0x (pause — wait for better prices)
 */
function temperatureMultiplier(temperatureScore: number): number {
	if (temperatureScore < 30) return 2;
	if (temperatureScore < 60) return 1;
	if (temperatureScore < 80) return 0.5;
	return 0;
}

// ---------------------------------------------------------------------------
// Core calculation — flat DCA
// ---------------------------------------------------------------------------

const DEFAULT_ANNUAL_GROWTH_RATE = 0.3;
const DEFAULT_VOLATILITY = 0.6;

/**
 * Calculate a flat DCA schedule: same amount every month, deterministic
 * sinusoidal price model.
 *
 * Pure function — no side effects, no randomness.
 */
export function calculateDCA(input: DCAInput): DCAResult {
	const { monthlyAmount, months, currentBtcPrice } = input;
	const annualGrowthRate = input.annualGrowthRate ?? DEFAULT_ANNUAL_GROWTH_RATE;
	const volatility = input.volatility ?? DEFAULT_VOLATILITY;

	// Guard: trivial inputs
	if (monthlyAmount <= 0 || months <= 0 || currentBtcPrice <= 0) {
		return {
			totalInvested: 0,
			totalBtcAccumulated: 0,
			averageCostBasis: 0,
			currentValue: 0,
			returnPct: 0,
			schedule: [],
		};
	}

	const monthlyGrowthRate = (1 + annualGrowthRate) ** (1 / 12) - 1;

	const schedule: DCAMonth[] = [];
	let cumulativeInvested = 0;
	let cumulativeBtc = 0;

	for (let m = 1; m <= months; m++) {
		const btcPrice = simulatePrice(currentBtcPrice, m, monthlyGrowthRate, volatility);
		const btcBought = monthlyAmount / btcPrice;

		cumulativeInvested += monthlyAmount;
		cumulativeBtc += btcBought;

		const totalValue = cumulativeBtc * btcPrice;
		const costBasis = cumulativeBtc > 0 ? cumulativeInvested / cumulativeBtc : 0;

		schedule.push({
			month: m,
			invested: cumulativeInvested,
			btcPrice,
			btcBought,
			totalBtc: cumulativeBtc,
			totalValue,
			costBasis,
		});
	}

	const last = schedule[schedule.length - 1];
	const totalInvested = last?.invested ?? 0;
	const totalBtcAccumulated = last?.totalBtc ?? 0;
	const currentValue = last?.totalValue ?? 0;
	const averageCostBasis = last?.costBasis ?? 0;
	const returnPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

	return {
		totalInvested,
		totalBtcAccumulated,
		averageCostBasis,
		currentValue,
		returnPct,
		schedule,
	};
}

// ---------------------------------------------------------------------------
// DCA Summary — Framework Part 4 snapshot calculator
// ---------------------------------------------------------------------------
// Lightweight single-temperature snapshot. Unlike the full schedule above,
// this answers: "Given my current temperature, what should I invest monthly,
// and how does that compare to flat DCA?"

export interface DCASummaryInput {
	monthlyInvestmentUsd: number; // base monthly amount in USD
	totalMonths: number; // investment horizon in months
	temperatureScore: number; // 0-100, current market temperature
	btcPriceUsd: number; // current BTC price in USD
	mode: "flat" | "temperature-adjusted";
}

export interface DCASummaryResult {
	totalInvestedUsd: number; // total USD invested over horizon
	estimatedBtcAccumulated: number; // BTC accumulated at current price (simple approx.)
	adjustedMonthlyAmount: number; // monthly amount for current temperature
	flatMonthlyAmount: number; // base monthly amount unchanged
	temperatureMultiplier: number; // multiplier applied to flat amount
	annualBudgetFlat: number; // flat annual spend (flatMonthly * 12)
	annualBudgetAdjusted: number; // temperature-adjusted annual spend (adjustedMonthly * 12)
	savingsVsFlat: number; // flatAnnual - adjustedAnnual (positive = spending less in greed; negative = spending more in fear)
}

/**
 * Returns the DCA spend multiplier for a given temperature score.
 *
 * Framework Part 4 zones:
 *   0-20  Extreme Fear  → 2.0x (double down)
 *   20-40 Fear          → 1.5x (buy more)
 *   40-60 Neutral       → 1.0x (normal DCA)
 *   60-75 Greed         → 0.5x (reduce)
 *   75-100 Extreme Greed → 0x  (stop buying)
 */
export function getDCASummaryMultiplier(temperatureScore: number): number {
	const t = Math.max(0, Math.min(100, temperatureScore));
	if (t < 20) return 2.0;
	if (t < 40) return 1.5;
	if (t < 60) return 1.0;
	if (t < 75) return 0.5;
	return 0.0;
}

/**
 * Snapshot DCA calculator — answers what the user's monthly buy amount is
 * at the current temperature, and how it compares to flat DCA over the horizon.
 *
 * Pure function — no randomness, no schedule simulation.
 */
export function calculateDCASummary(input: DCASummaryInput): DCASummaryResult {
	const { monthlyInvestmentUsd, totalMonths, temperatureScore, btcPriceUsd, mode } = input;

	const safeMonthly = Math.max(0, monthlyInvestmentUsd);
	const safeMonths = Math.max(0, Math.round(totalMonths));
	const safePrice = btcPriceUsd > 0 ? btcPriceUsd : 1;

	const multiplier = getDCASummaryMultiplier(temperatureScore);
	const adjustedMonthlyAmount = safeMonthly * multiplier;

	const totalInvestedUsd =
		mode === "flat" ? safeMonthly * safeMonths : adjustedMonthlyAmount * safeMonths;

	const estimatedBtcAccumulated = totalInvestedUsd / safePrice;

	const annualBudgetFlat = safeMonthly * 12;
	const annualBudgetAdjusted = adjustedMonthlyAmount * 12;

	// positive = spending less than flat (greed zone saves money)
	// negative = spending more than flat (fear zone buys aggressively)
	// Formula: flat - adjusted → positive when adjusted < flat (greed), negative when adjusted > flat (fear)
	const savingsVsFlat = annualBudgetFlat - annualBudgetAdjusted;

	return {
		totalInvestedUsd,
		estimatedBtcAccumulated,
		adjustedMonthlyAmount,
		flatMonthlyAmount: safeMonthly,
		temperatureMultiplier: multiplier,
		annualBudgetFlat,
		annualBudgetAdjusted,
		savingsVsFlat,
	};
}

// ---------------------------------------------------------------------------
// Temperature-adjusted DCA
// ---------------------------------------------------------------------------

/**
 * Calculate temperature-adjusted DCA: monthly spend is scaled by
 * the current temperature score, buying more in fear zones and pausing
 * in extreme greed.
 *
 * The temperature score is treated as fixed for the simulation
 * (it represents the current market condition, not a dynamic one).
 *
 * Pure function — no side effects.
 */
export function calculateTemperatureAdjustedDCA(
	input: DCAInput,
	temperatureScore: number,
): DCAResult {
	const { monthlyAmount, months, currentBtcPrice } = input;
	const annualGrowthRate = input.annualGrowthRate ?? DEFAULT_ANNUAL_GROWTH_RATE;
	const volatility = input.volatility ?? DEFAULT_VOLATILITY;

	if (months <= 0 || currentBtcPrice <= 0) {
		return {
			totalInvested: 0,
			totalBtcAccumulated: 0,
			averageCostBasis: 0,
			currentValue: 0,
			returnPct: 0,
			schedule: [],
		};
	}

	const monthlyGrowthRate = (1 + annualGrowthRate) ** (1 / 12) - 1;

	// We want to keep total invested comparable to flat DCA.
	// Instead of multiplying without limit, we simulate a dynamic temperature
	// that evolves over the sinusoidal cycle. The cycle naturally produces
	// fear/neutral/greed phases over the 48-month period.
	//
	// The temperature-adjusted multiplier is derived from the cycle position:
	// When price is below trend (bottom of sine) → fear-like → buy more
	// When price is above trend (top of sine) → greed-like → buy less
	//
	// We encode this as a cycle-aware temperature that shifts with the price cycle.

	const schedule: DCAMonth[] = [];
	let cumulativeInvested = 0;
	let cumulativeBtc = 0;

	for (let m = 1; m <= months; m++) {
		const btcPrice = simulatePrice(currentBtcPrice, m, monthlyGrowthRate, volatility);

		// Dynamic temperature: starts at user's current temperature score,
		// then oscillates with the price cycle (lower when price below trend = fear).
		// The cycle factor swings ±40 points around the base temperature.
		const cycleFactor = -Math.sin((2 * Math.PI * m) / 48) * 40;
		const dynamicTemp = Math.max(0, Math.min(100, temperatureScore + cycleFactor));

		const multiplier = temperatureMultiplier(dynamicTemp);
		const spendThisMonth = monthlyAmount * multiplier;

		const btcBought = spendThisMonth > 0 ? spendThisMonth / btcPrice : 0;

		cumulativeInvested += spendThisMonth;
		cumulativeBtc += btcBought;

		const totalValue = cumulativeBtc * btcPrice;
		const costBasis = cumulativeBtc > 0 ? cumulativeInvested / cumulativeBtc : 0;

		schedule.push({
			month: m,
			invested: cumulativeInvested,
			btcPrice,
			btcBought,
			totalBtc: cumulativeBtc,
			totalValue,
			costBasis,
		});
	}

	const last = schedule[schedule.length - 1];
	const totalInvested = last?.invested ?? 0;
	const totalBtcAccumulated = last?.totalBtc ?? 0;
	const currentValue = last?.totalValue ?? 0;
	const averageCostBasis = last?.costBasis ?? 0;
	const returnPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

	return {
		totalInvested,
		totalBtcAccumulated,
		averageCostBasis,
		currentValue,
		returnPct,
		schedule,
	};
}
