// =============================================================================
// Claude Tool Definitions — Anthropic API tool_use format
// =============================================================================
// Maps 14 TimeCell engine functions as Claude-callable tools.
// resolveToolCall dispatches tool names to engine functions and returns JSON.

import {
	calculateCrashSurvival,
	generateActionPlan,
	calculatePositionSizing,
	ruinTest,
	calculateSleepTest,
	calculateSellingRules,
	calculateDCASummary,
	calculateAllocationDrift,
	simulateAllHistoricalCrashes,
	calculateDownsideInsurance,
	calculateCustodyRisk,
	calculateGeometricMeanCAGR,
	calculateTemperatureAdjustedDCA,
	type PortfolioInput,
	type ActionPlanInput,
	type PositionSizingInput,
	type SleepTestInput,
	type SellingRulesInput,
	type DCASummaryInput,
	type AllocationDriftInput,
	type InsuranceInput,
	type CustodyInput,
	type DCAInput,
} from "@timecell/engine";

// ---------------------------------------------------------------------------
// Tool schema type (Anthropic API format)
// ---------------------------------------------------------------------------

interface ToolDefinition {
	name: string;
	description: string;
	input_schema: {
		type: "object";
		properties: Record<string, { type: string; description: string }>;
		required: string[];
	};
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const TOOLS: ToolDefinition[] = [
	{
		name: "run_crash_survival",
		description:
			"Run crash survival analysis across 30%, 50%, 70%, and 80% drawdown scenarios. Use this when the user wants to know if their portfolio survives a crash.",
		input_schema: {
			type: "object",
			properties: {
				totalValueUsd: { type: "number", description: "Total portfolio value in USD" },
				btcPercentage: { type: "number", description: "BTC allocation as percentage (0-100)" },
				btcPriceUsd: { type: "number", description: "Current BTC price in USD" },
				monthlyBurnUsd: { type: "number", description: "Monthly expenses in USD" },
				liquidReserveUsd: { type: "number", description: "Liquid cash reserve in USD" },
			},
			required: ["totalValueUsd", "btcPercentage", "btcPriceUsd", "monthlyBurnUsd", "liquidReserveUsd"],
		},
	},
	{
		name: "generate_action_plan",
		description:
			"Generate personalized action items based on portfolio state and framework rules. Use this to give the user a prioritized list of what to do next.",
		input_schema: {
			type: "object",
			properties: {
				btcPercentage: { type: "number", description: "BTC allocation as percentage (0-100)" },
				ruinTestPassed: { type: "boolean", description: "Whether the ruin test currently passes" },
				runwayMonths: { type: "number", description: "Months of runway in worst-case crash" },
				temperatureScore: { type: "number", description: "Current market temperature (0-100)" },
				liquidReserveUsd: { type: "number", description: "Liquid cash reserve in USD" },
				monthlyBurnUsd: { type: "number", description: "Monthly expenses in USD" },
				totalValueUsd: { type: "number", description: "Total portfolio value in USD" },
			},
			required: [
				"btcPercentage",
				"ruinTestPassed",
				"runwayMonths",
				"temperatureScore",
				"liquidReserveUsd",
				"monthlyBurnUsd",
				"totalValueUsd",
			],
		},
	},
	{
		name: "check_temperature",
		description:
			"Check the current Bitcoin market temperature (0-100 score with zone). Use this when the user asks about market conditions or timing.",
		input_schema: {
			type: "object",
			properties: {},
			required: [],
		},
	},
	{
		name: "calculate_position_sizing",
		description:
			"Get position sizing recommendation: gap analysis, DCA schedule, and post-reallocation ruin test. Use this when the user asks how much BTC to buy or their target allocation.",
		input_schema: {
			type: "object",
			properties: {
				totalValueUsd: { type: "number", description: "Total portfolio value in USD" },
				currentBtcPct: { type: "number", description: "Current BTC allocation percentage (0-100)" },
				targetBtcPct: { type: "number", description: "Target BTC allocation percentage (0-100). Use the conviction ladder to determine: Observer 0%, Experimenter 1-3%, Diversifier 5-10%, High Conviction 10-25%, Owner-Class 25-50%, Single-Asset Core 50%+." },
				monthlyBurnUsd: { type: "number", description: "Monthly expenses in USD" },
				liquidReserveUsd: { type: "number", description: "Liquid cash reserve in USD" },
				btcPriceUsd: { type: "number", description: "Current BTC price in USD" },
			},
			required: ["totalValueUsd", "currentBtcPct", "targetBtcPct", "monthlyBurnUsd", "liquidReserveUsd", "btcPriceUsd"],
		},
	},
	{
		name: "run_ruin_test",
		description:
			"Test if portfolio survives the worst case: BTC -80% and other assets -40% simultaneously. Use this to check if the user passes the framework's ruin test.",
		input_schema: {
			type: "object",
			properties: {
				totalValueUsd: { type: "number", description: "Total portfolio value in USD" },
				btcPercentage: { type: "number", description: "BTC allocation as percentage (0-100)" },
				btcPriceUsd: { type: "number", description: "Current BTC price in USD" },
				monthlyBurnUsd: { type: "number", description: "Monthly expenses in USD" },
				liquidReserveUsd: { type: "number", description: "Liquid cash reserve in USD" },
			},
			required: ["totalValueUsd", "btcPercentage", "btcPriceUsd", "monthlyBurnUsd", "liquidReserveUsd"],
		},
	},
	{
		name: "run_sleep_test",
		description:
			"Check loss tolerance: calculate the dollar loss if BTC drops 80% tomorrow. Use this when discussing risk tolerance or the sleep test.",
		input_schema: {
			type: "object",
			properties: {
				totalPortfolioValue: { type: "number", description: "Total portfolio value in USD" },
				btcPercentage: { type: "number", description: "BTC allocation as percentage (0-100)" },
			},
			required: ["totalPortfolioValue", "btcPercentage"],
		},
	},
	{
		name: "get_selling_rules",
		description:
			"Get the temperature-based selling schedule showing when and how much to sell. Use this when the user asks about taking profits or selling strategy.",
		input_schema: {
			type: "object",
			properties: {
				temperatureScore: { type: "number", description: "Current market temperature (0-100)" },
				btcPercentage: { type: "number", description: "BTC allocation as percentage (0-100)" },
				totalValueUsd: { type: "number", description: "Total portfolio value in USD" },
				btcPriceUsd: { type: "number", description: "Current BTC price in USD" },
			},
			required: ["temperatureScore", "btcPercentage", "totalValueUsd", "btcPriceUsd"],
		},
	},
	{
		name: "get_dca_recommendation",
		description:
			"Get DCA strategy recommendation adjusted for current market temperature. Use this when the user asks about dollar cost averaging or how much to buy monthly.",
		input_schema: {
			type: "object",
			properties: {
				currentBtcPrice: { type: "number", description: "Current BTC price in USD" },
				temperatureScore: { type: "number", description: "Current market temperature (0-100)" },
				monthlyAmount: { type: "number", description: "Base monthly DCA amount in USD" },
			},
			required: ["currentBtcPrice", "temperatureScore", "monthlyAmount"],
		},
	},
	{
		name: "calculate_allocation_drift",
		description:
			"Detect when BTC price movement has caused portfolio allocation to drift from the user's target. Use this when discussing rebalancing or checking if allocation has shifted.",
		input_schema: {
			type: "object",
			properties: {
				initialBtcPct: { type: "number", description: "BTC % when user last set their allocation" },
				initialBtcPrice: { type: "number", description: "BTC price when allocation was set" },
				currentBtcPrice: { type: "number", description: "Current BTC price in USD" },
				otherAssetsValue: { type: "number", description: "Non-BTC portfolio value in USD (assumed stable)" },
				btcHoldings: { type: "number", description: "Amount of BTC held (in BTC units, not USD)" },
			},
			required: ["initialBtcPct", "initialBtcPrice", "currentBtcPrice", "otherAssetsValue", "btcHoldings"],
		},
	},
	{
		name: "simulate_historical_crashes",
		description:
			"Simulate how the user's portfolio would have performed in real historical Bitcoin crashes (Mt. Gox 2014, ICO Bust 2018, COVID 2020, LUNA/FTX 2022). Use this when the user asks about past crashes or wants historical context.",
		input_schema: {
			type: "object",
			properties: {
				totalValueUsd: { type: "number", description: "Total portfolio value in USD" },
				btcPercentage: { type: "number", description: "BTC allocation as percentage (0-100)" },
				btcPriceUsd: { type: "number", description: "Current BTC price in USD" },
				monthlyBurnUsd: { type: "number", description: "Monthly expenses in USD" },
				liquidReserveUsd: { type: "number", description: "Liquid cash reserve in USD" },
			},
			required: ["totalValueUsd", "btcPercentage", "btcPriceUsd", "monthlyBurnUsd", "liquidReserveUsd"],
		},
	},
	{
		name: "calculate_downside_insurance",
		description:
			"Calculate put option hedge costs and payoffs for downside insurance. Use this when the user asks about hedging, insurance, or protecting their BTC position.",
		input_schema: {
			type: "object",
			properties: {
				totalBtcValueUsd: { type: "number", description: "Total value of BTC holdings in USD" },
				btcPriceUsd: { type: "number", description: "Current BTC price in USD" },
				hedgeBudgetPct: { type: "number", description: "% of BTC value allocated to hedge budget (e.g. 2 means 2%)" },
				putStrikePct: { type: "number", description: "Put strike as % of current price (e.g. 70 = 30% out-of-the-money)" },
				putCostPct: { type: "number", description: "Put premium as % of notional protected (e.g. 3 means 3%)" },
				expiryMonths: { type: "number", description: "Months until put option expires" },
			},
			required: ["totalBtcValueUsd", "btcPriceUsd", "hedgeBudgetPct", "putStrikePct", "putCostPct", "expiryMonths"],
		},
	},
	{
		name: "calculate_custody_risk",
		description:
			"Assess exchange vs self-custody risk for BTC holdings. Use this when the user asks about custody, exchange risk, or where to store their Bitcoin.",
		input_schema: {
			type: "object",
			properties: {
				totalBtcValueUsd: { type: "number", description: "Total USD value of BTC holdings" },
				exchangePct: { type: "number", description: "Percentage of BTC held on exchanges (0-100)" },
				btcPriceUsd: { type: "number", description: "Current BTC price in USD" },
			},
			required: ["totalBtcValueUsd", "exchangePct", "btcPriceUsd"],
		},
	},
	{
		name: "calculate_geometric_cagr",
		description:
			"Compare hedged vs unhedged long-term CAGR using geometric mean analysis (Spitznagel method). Use this when discussing whether insurance improves long-term returns.",
		input_schema: {
			type: "object",
			properties: {
				normalReturn: { type: "number", description: "Annual return in non-crash years (e.g. 0.30 for 30%)" },
				annualCost: { type: "number", description: "Annual hedge cost as decimal (e.g. 0.03 for 3%)" },
				crashMagnitude: { type: "number", description: "Crash loss as decimal (e.g. 0.80 for 80% crash)" },
				recoveryOfLoss: { type: "number", description: "Fraction of loss recovered by hedge (e.g. 0.50 for 50% recovery)" },
				cycleLength: { type: "number", description: "Years per crash cycle (e.g. 4 for Bitcoin's 4-year cycle)" },
			},
			required: ["normalReturn", "annualCost", "crashMagnitude", "recoveryOfLoss", "cycleLength"],
		},
	},
	{
		name: "calculate_temperature_dca",
		description:
			"Calculate a temperature-adjusted DCA schedule that buys more in fear zones and less in greed zones. Use this when the user asks about DCA strategy with market timing.",
		input_schema: {
			type: "object",
			properties: {
				monthlyAmountUsd: { type: "number", description: "Base monthly DCA amount in USD" },
				months: { type: "number", description: "Number of months to simulate (default 12)" },
				currentBtcPriceUsd: { type: "number", description: "Current BTC price in USD" },
				temperatureScore: { type: "number", description: "Current market temperature (0-100)" },
			},
			required: ["monthlyAmountUsd", "months", "currentBtcPriceUsd", "temperatureScore"],
		},
	},
];

// ---------------------------------------------------------------------------
// Tool call resolver — dispatches to engine functions
// ---------------------------------------------------------------------------

export async function resolveToolCall(
	name: string,
	input: Record<string, unknown>,
): Promise<string> {
	try {
		return await resolveToolCallInner(name, input);
	} catch (err) {
		return JSON.stringify({
			error: `Tool "${name}" failed: ${err instanceof Error ? err.message : "Unknown error"}`,
		});
	}
}

async function resolveToolCallInner(
	name: string,
	input: Record<string, unknown>,
): Promise<string> {
	switch (name) {
		case "run_crash_survival": {
			const portfolio: PortfolioInput = {
				totalValueUsd: input.totalValueUsd as number,
				btcPercentage: input.btcPercentage as number,
				btcPriceUsd: input.btcPriceUsd as number,
				monthlyBurnUsd: input.monthlyBurnUsd as number,
				liquidReserveUsd: input.liquidReserveUsd as number,
			};
			const result = calculateCrashSurvival(portfolio);
			return JSON.stringify(result);
		}

		case "generate_action_plan": {
			const planInput: ActionPlanInput = {
				btcPercentage: input.btcPercentage as number,
				ruinTestPassed: input.ruinTestPassed as boolean,
				runwayMonths: input.runwayMonths as number,
				temperatureScore: input.temperatureScore as number,
				liquidReserveUsd: input.liquidReserveUsd as number,
				monthlyBurnUsd: input.monthlyBurnUsd as number,
				totalValueUsd: input.totalValueUsd as number,
			};
			const result = generateActionPlan(planInput);
			return JSON.stringify(result);
		}

		case "check_temperature": {
			try {
				const res = await fetch("/api/temperature");
				if (!res.ok) throw new Error("API returned " + res.status);
				const data = await res.json();
				return JSON.stringify(data);
			} catch {
				return JSON.stringify({
					error: "Temperature API unavailable (standalone mode). Use the temperature score from the system prompt context, or ask the user for their estimate (0-100). Check Fear & Greed Index as a proxy.",
				});
			}
		}

		case "calculate_position_sizing": {
			const sizingInput: PositionSizingInput = {
				totalValueUsd: input.totalValueUsd as number,
				currentBtcPct: input.currentBtcPct as number,
				targetBtcPct: input.targetBtcPct as number,
				monthlyBurnUsd: input.monthlyBurnUsd as number,
				liquidReserveUsd: input.liquidReserveUsd as number,
				btcPriceUsd: input.btcPriceUsd as number,
			};
			const result = calculatePositionSizing(sizingInput);
			return JSON.stringify(result);
		}

		case "run_ruin_test": {
			const portfolio: PortfolioInput = {
				totalValueUsd: input.totalValueUsd as number,
				btcPercentage: input.btcPercentage as number,
				btcPriceUsd: input.btcPriceUsd as number,
				monthlyBurnUsd: input.monthlyBurnUsd as number,
				liquidReserveUsd: input.liquidReserveUsd as number,
			};
			const result = ruinTest(portfolio);
			return JSON.stringify(result);
		}

		case "run_sleep_test": {
			const sleepInput: SleepTestInput = {
				totalPortfolioValue: input.totalPortfolioValue as number,
				btcPercentage: input.btcPercentage as number,
			};
			const result = calculateSleepTest(sleepInput);
			return JSON.stringify(result);
		}

		case "get_selling_rules": {
			const sellingInput: SellingRulesInput = {
				temperatureScore: input.temperatureScore as number,
				btcPercentage: input.btcPercentage as number,
				totalBtcValueUsd: (input.totalValueUsd as number) * ((input.btcPercentage as number) / 100),
				btcPriceUsd: input.btcPriceUsd as number,
			};
			const result = calculateSellingRules(sellingInput);
			return JSON.stringify(result);
		}

		case "get_dca_recommendation": {
			const dcaInput: DCASummaryInput = {
				monthlyInvestmentUsd: input.monthlyAmount as number,
				totalMonths: 12,
				temperatureScore: input.temperatureScore as number,
				btcPriceUsd: input.currentBtcPrice as number,
				mode: "temperature-adjusted",
			};
			const result = calculateDCASummary(dcaInput);
			return JSON.stringify(result);
		}

		case "calculate_allocation_drift": {
			const driftInput: AllocationDriftInput = {
				initialBtcPct: input.initialBtcPct as number,
				initialBtcPrice: input.initialBtcPrice as number,
				currentBtcPrice: input.currentBtcPrice as number,
				otherAssetsValue: input.otherAssetsValue as number,
				btcHoldings: input.btcHoldings as number,
			};
			const result = calculateAllocationDrift(driftInput);
			return JSON.stringify(result);
		}

		case "simulate_historical_crashes": {
			const portfolio: PortfolioInput = {
				totalValueUsd: input.totalValueUsd as number,
				btcPercentage: input.btcPercentage as number,
				btcPriceUsd: input.btcPriceUsd as number,
				monthlyBurnUsd: input.monthlyBurnUsd as number,
				liquidReserveUsd: input.liquidReserveUsd as number,
			};
			const result = simulateAllHistoricalCrashes(portfolio);
			return JSON.stringify(result);
		}

		case "calculate_downside_insurance": {
			const insuranceInput: InsuranceInput = {
				totalBtcValueUsd: input.totalBtcValueUsd as number,
				btcPriceUsd: input.btcPriceUsd as number,
				hedgeBudgetPct: input.hedgeBudgetPct as number,
				putStrikePct: input.putStrikePct as number,
				putCostPct: input.putCostPct as number,
				expiryMonths: input.expiryMonths as number,
			};
			const result = calculateDownsideInsurance(insuranceInput);
			return JSON.stringify(result);
		}

		case "calculate_custody_risk": {
			const custodyInput: CustodyInput = {
				totalBtcValueUsd: input.totalBtcValueUsd as number,
				exchangePct: input.exchangePct as number,
				btcPriceUsd: input.btcPriceUsd as number,
			};
			const result = calculateCustodyRisk(custodyInput);
			return JSON.stringify(result);
		}

		case "calculate_geometric_cagr": {
			const result = calculateGeometricMeanCAGR(
				input.normalReturn as number,
				input.annualCost as number,
				input.crashMagnitude as number,
				input.recoveryOfLoss as number,
				input.cycleLength as number,
			);
			return JSON.stringify(result);
		}

		case "calculate_temperature_dca": {
			const dcaInput: DCAInput = {
				monthlyInvestmentUsd: input.monthlyAmountUsd as number,
				totalMonths: input.months as number,
				btcPriceUsd: input.currentBtcPriceUsd as number,
				mode: "temperature-adjusted",
			};
			const result = calculateTemperatureAdjustedDCA(dcaInput, input.temperatureScore as number);
			return JSON.stringify(result);
		}

		default:
			return JSON.stringify({ error: `Unknown tool: ${name}` });
	}
}
