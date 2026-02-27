import { describe, expect, it } from "vitest";
import { calculateDownsideInsurance } from "./downside-insurance.js";
import type { InsuranceInput } from "./downside-insurance.js";

// ---------------------------------------------------------------------------
// Baseline: $100K BTC, 2% budget, 70% strike, 3% premium, 6-month expiry
// ---------------------------------------------------------------------------

const BASELINE: InsuranceInput = {
	totalBtcValueUsd: 100_000,
	btcPriceUsd: 100_000,
	hedgeBudgetPct: 2,
	putStrikePct: 70,
	putCostPct: 3,
	expiryMonths: 6,
};

describe("calculateDownsideInsurance — baseline", () => {
	const r = calculateDownsideInsurance(BASELINE);

	it("hedge budget = 2% of totalBtcValue", () => {
		expect(r.hedgeBudgetUsd).toBeCloseTo(2_000, 1);
	});

	it("premium equals hedge budget", () => {
		expect(r.putPremiumUsd).toBeCloseTo(r.hedgeBudgetUsd, 1);
	});

	it("notional protected = budget / putCostPct", () => {
		// 2000 / 0.03 ≈ 66,666.67
		expect(r.notionalProtected).toBeCloseTo(66_666.67, 0);
	});

	it("put strike price = btcPrice * 70%", () => {
		expect(r.putStrikePrice).toBeCloseTo(70_000, 1);
	});

	it("monthly cost = premium / expiryMonths", () => {
		expect(r.costPerMonth).toBeCloseTo(2_000 / 6, 1);
	});

	it("annualized cost % is reasonable (< 5% for standard params)", () => {
		// annualizedCost = (2000/6) * 12 / 100000 * 100 = 4%
		expect(r.annualizedCostPct).toBeCloseTo(4, 1);
		expect(r.annualizedCostPct).toBeLessThan(5);
	});

	it("maxLossWithout = totalBtcValue", () => {
		expect(r.maxLossWithout).toBeCloseTo(100_000, 1);
	});

	it("maxLossWithInsurance < maxLossWithout", () => {
		expect(r.maxLossWithInsurance).toBeLessThan(r.maxLossWithout);
	});

	it("payoffScenarios has 4 entries (30/50/70/80%)", () => {
		expect(r.payoffScenarios).toHaveLength(4);
		expect(r.payoffScenarios.map((s) => s.drawdownPct)).toEqual([30, 50, 70, 80]);
	});
});

// ---------------------------------------------------------------------------
// Payoff at various crash levels
// ---------------------------------------------------------------------------

describe("calculateDownsideInsurance — payoff at crash levels", () => {
	const r = calculateDownsideInsurance(BASELINE);

	it("no payoff at 30% crash (BTC -> $70K = strike price, barely ITM at exact strike)", () => {
		// At 30% crash: crashPrice = $70K = strikePrice => payoff = 0
		const s30 = r.payoffScenarios.find((s) => s.drawdownPct === 30)!;
		expect(s30.payoffUsd).toBeCloseTo(0, 0);
	});

	it("positive payoff at 50% crash (BTC -> $50K, well below $70K strike)", () => {
		const s50 = r.payoffScenarios.find((s) => s.drawdownPct === 50)!;
		// payoff = (70K - 50K) * (66666/100K) = 20K * 0.6667 = 13,333
		expect(s50.payoffUsd).toBeGreaterThan(0);
		expect(s50.payoffUsd).toBeCloseTo(13_333, 0);
	});

	it("large payoff at 70% crash (BTC -> $30K)", () => {
		const s70 = r.payoffScenarios.find((s) => s.drawdownPct === 70)!;
		// payoff = (70K - 30K) * 0.6667 = 26,667
		expect(s70.payoffUsd).toBeCloseTo(26_667, 0);
	});

	it("payoffAt80pctCrash matches scenario entry", () => {
		const s80 = r.payoffScenarios.find((s) => s.drawdownPct === 80)!;
		expect(r.payoffAt80pctCrash).toBeCloseTo(s80.payoffUsd, 1);
	});

	it("payoffAt80pctCrash is substantial (BTC -> $20K)", () => {
		// payoff = (70K - 20K) * 0.6667 = 33,333
		expect(r.payoffAt80pctCrash).toBeCloseTo(33_333, 0);
	});

	it("hedgeROI at 80% crash is strongly positive", () => {
		// 33,333 / 2,000 - 1 = 15.67x
		expect(r.hedgeROI).toBeCloseTo(15.67, 1);
	});
});

// ---------------------------------------------------------------------------
// Break-even drawdown calculation
// ---------------------------------------------------------------------------

describe("calculateDownsideInsurance — breakEvenDrawdown", () => {
	it("breakEvenDrawdown is between strike and 100%", () => {
		const r = calculateDownsideInsurance(BASELINE);
		// Must exceed 30% (the strike OTM level) to be in-the-money enough
		expect(r.breakEvenDrawdown).toBeGreaterThan(30);
		expect(r.breakEvenDrawdown).toBeLessThan(100);
	});

	it("at break-even drawdown, payoff ≈ premium paid", () => {
		const r = calculateDownsideInsurance(BASELINE);
		// Compute payoff at breakEven crash price
		const breakEvenCrashPrice = BASELINE.btcPriceUsd * (1 - r.breakEvenDrawdown / 100);
		const btcUnitsProtected = r.notionalProtected / BASELINE.btcPriceUsd;
		const payoff = Math.max(0, r.putStrikePrice - breakEvenCrashPrice) * btcUnitsProtected;
		expect(payoff).toBeCloseTo(r.putPremiumUsd, 0);
	});

	it("break-even drawdown is independent of budget size (both scale linearly)", () => {
		const tight = calculateDownsideInsurance({ ...BASELINE, hedgeBudgetPct: 1 });
		const normal = calculateDownsideInsurance(BASELINE);
		// Budget and notional scale together, so break-even drawdown stays the same
		expect(tight.breakEvenDrawdown).toBeCloseTo(normal.breakEvenDrawdown, 1);
	});
});

// ---------------------------------------------------------------------------
// Large portfolio ($10M+)
// ---------------------------------------------------------------------------

describe("calculateDownsideInsurance — large portfolio", () => {
	const large: InsuranceInput = {
		totalBtcValueUsd: 10_000_000,
		btcPriceUsd: 100_000,
		hedgeBudgetPct: 2,
		putStrikePct: 70,
		putCostPct: 3,
		expiryMonths: 12,
	};
	const r = calculateDownsideInsurance(large);

	it("scales linearly with portfolio size", () => {
		expect(r.hedgeBudgetUsd).toBeCloseTo(200_000, 0);
		expect(r.notionalProtected).toBeCloseTo(6_666_667, 0);
	});

	it("annualized cost % is same regardless of size", () => {
		// 12-month expiry: annualized = (200K/12)*12 / 10M * 100 = 2%
		expect(r.annualizedCostPct).toBeCloseTo(2, 1);
	});

	it("payoffAt80pctCrash is massive but proportional", () => {
		// (70K - 20K) * (6666667 / 100K) = 50K * 66.67 = 3,333,333
		expect(r.payoffAt80pctCrash).toBeCloseTo(3_333_333, -3);
	});

	it("costPerMonth = premium / 12 months", () => {
		expect(r.costPerMonth).toBeCloseTo(200_000 / 12, 0);
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("calculateDownsideInsurance — edge cases", () => {
	it("zero budget produces zero payoff", () => {
		const r = calculateDownsideInsurance({ ...BASELINE, hedgeBudgetPct: 0 });
		expect(r.hedgeBudgetUsd).toBe(0);
		expect(r.notionalProtected).toBe(0);
		expect(r.payoffAt80pctCrash).toBe(0);
	});

	it("deep OTM strike (50%) produces less payoff at shallow crashes", () => {
		const deep = calculateDownsideInsurance({ ...BASELINE, putStrikePct: 50 });
		const normal = calculateDownsideInsurance(BASELINE);
		// At 50% crash, deep OTM put (50% strike) barely in the money; normal (70% strike) pays well
		const deep50 = deep.payoffScenarios.find((s) => s.drawdownPct === 50)!;
		const norm50 = normal.payoffScenarios.find((s) => s.drawdownPct === 50)!;
		expect(deep50.payoffUsd).toBeLessThan(norm50.payoffUsd);
	});

	it("near ATM strike (90%) protects even shallow crashes but costs more per unit", () => {
		const nearAtm = calculateDownsideInsurance({ ...BASELINE, putStrikePct: 90 });
		const s30 = nearAtm.payoffScenarios.find((s) => s.drawdownPct === 30)!;
		// 30% crash => price = 70K, strike = 90K => ITM
		expect(s30.payoffUsd).toBeGreaterThan(0);
	});

	it("12-month expiry halves annualized cost vs 6-month", () => {
		const six = calculateDownsideInsurance({ ...BASELINE, expiryMonths: 6 });
		const twelve = calculateDownsideInsurance({ ...BASELINE, expiryMonths: 12 });
		// Same premium, but spread over 12 months vs 6 => annualized is halved
		expect(twelve.annualizedCostPct).toBeCloseTo(six.annualizedCostPct / 2, 1);
	});
});
