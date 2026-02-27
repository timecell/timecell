// =============================================================================
// Claude Tool Definitions — Anthropic API tool_use format
// =============================================================================
// Maps 8 TimeCell engine functions as Claude-callable tools.
// resolveToolCall dispatches tool names to engine functions and returns JSON.

import {
	calculateCrashSurvival,
	generateActionPlan,
	calculatePositionSizing,
	ruinTest,
	calculateSleepTest,
	calculateSellingRules,
	calculateDCASummary,
	type PortfolioInput,
	type ActionPlanInput,
	type PositionSizingInput,
	type SleepTestInput,
	type SellingRulesInput,
	type DCASummaryInput,
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
				monthlyBurnUsd: { type: "number", description: "Monthly expenses in USD" },
				liquidReserveUsd: { type: "number", description: "Liquid cash reserve in USD" },
				btcPriceUsd: { type: "number", description: "Current BTC price in USD" },
			},
			required: ["totalValueUsd", "currentBtcPct", "monthlyBurnUsd", "liquidReserveUsd", "btcPriceUsd"],
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
];

// ---------------------------------------------------------------------------
// Tool call resolver — dispatches to engine functions
// ---------------------------------------------------------------------------

export async function resolveToolCall(
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
				if (!res.ok) {
					return JSON.stringify({ error: "Temperature API unavailable. Try again later." });
				}
				const data = await res.json();
				return JSON.stringify(data);
			} catch {
				return JSON.stringify({ error: "Failed to fetch temperature data. API may be offline." });
			}
		}

		case "calculate_position_sizing": {
			const sizingInput: PositionSizingInput = {
				totalValueUsd: input.totalValueUsd as number,
				currentBtcPct: input.currentBtcPct as number,
				targetBtcPct: input.currentBtcPct as number, // default target = current (engine needs it)
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

		default:
			return JSON.stringify({ error: `Unknown tool: ${name}` });
	}
}
