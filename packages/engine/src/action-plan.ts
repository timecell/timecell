// =============================================================================
// Action Plan Engine (Framework-Driven Priorities)
// =============================================================================
// Evaluates portfolio state against the Bitcoin Investing Framework rules and
// returns a prioritised list of actionable items (red / amber / green).

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionPlanInput {
	btcPercentage: number;
	ruinTestPassed: boolean;
	runwayMonths: number;
	temperatureScore: number; // 0-100
	liquidReserveUsd: number;
	monthlyBurnUsd: number;
	totalValueUsd: number;
}

export type ActionSeverity = "red" | "amber" | "green";

export interface ActionItem {
	severity: ActionSeverity;
	message: string;
	rule: string; // which framework rule triggered this
}

// ---------------------------------------------------------------------------
// Severity sort order
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<ActionSeverity, number> = {
	red: 0,
	amber: 1,
	green: 2,
};

// ---------------------------------------------------------------------------
// Rule evaluator
// ---------------------------------------------------------------------------

export function generateActionPlan(input: ActionPlanInput): ActionItem[] {
	const {
		btcPercentage,
		ruinTestPassed,
		runwayMonths,
		temperatureScore,
		liquidReserveUsd,
	} = input;

	const items: ActionItem[] = [];

	// ---- Red (act now) ----

	if (!ruinTestPassed) {
		items.push({
			severity: "red",
			message:
				"Reduce BTC allocation until ruin test passes. Your portfolio does not survive an 80% crash.",
			rule: "ruin-test",
		});
	}

	if (temperatureScore > 75) {
		items.push({
			severity: "red",
			message:
				"Extreme greed zone. Stop buying. Consider activating selling rules.",
			rule: "temperature-extreme-greed",
		});
	}

	if (liquidReserveUsd <= 0) {
		items.push({
			severity: "red",
			message:
				"No liquid reserve. Build a safety net: 2+ years of expenses outside BTC.",
			rule: "no-reserve",
		});
	}

	if (runwayMonths < 18) {
		items.push({
			severity: "red",
			message: `Insufficient runway (${runwayMonths === Infinity ? "unlimited" : Math.round(runwayMonths)} months). Need 18+ months. Increase liquid reserve or reduce BTC allocation.`,
			rule: "insufficient-runway",
		});
	}

	// ---- Amber (consider) ----

	if (btcPercentage >= 25) {
		items.push({
			severity: "amber",
			message: `At ${btcPercentage}% BTC, conviction gates should be checked: multi-cycle experience, 2yr expenses outside BTC, no forced-sale liabilities.`,
			rule: "conviction-gates",
		});
	}

	if (btcPercentage >= 50) {
		items.push({
			severity: "amber",
			message: `Downside insurance recommended at ${btcPercentage}% allocation (Framework Part 6).`,
			rule: "insurance-needed",
		});
	}

	if (temperatureScore < 20) {
		items.push({
			severity: "amber",
			message:
				"Extreme fear zone. Historically the best time to accumulate. Consider lump sum if conviction is high.",
			rule: "temperature-extreme-fear",
		});
	}

	if (temperatureScore >= 60 && temperatureScore <= 75) {
		items.push({
			severity: "amber",
			message:
				"Greed zone. Slow down buying. Review your risk management and de-risk triggers.",
			rule: "temperature-greed",
		});
	}

	// ---- Green (on track) ----

	if (ruinTestPassed && runwayMonths >= 18) {
		items.push({
			severity: "green",
			message: `Ruin test passed. You survive the worst-case crash with ${runwayMonths === Infinity ? "unlimited" : Math.round(runwayMonths)} months runway.`,
			rule: "ruin-test-passed",
		});
	}

	if (temperatureScore >= 20 && temperatureScore < 40) {
		items.push({
			severity: "green",
			message: "Fear zone. Good time to DCA aggressively.",
			rule: "temperature-fear",
		});
	}

	if (temperatureScore >= 40 && temperatureScore < 60) {
		items.push({
			severity: "green",
			message: "Neutral zone. Continue DCA at normal pace.",
			rule: "temperature-neutral",
		});
	}

	// ---- Sort: red first, then amber, then green ----
	items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

	// ---- Limit to 5 items (truncate greens first, then ambers) ----
	if (items.length > 5) {
		// Count by severity
		const reds = items.filter((i) => i.severity === "red");
		const ambers = items.filter((i) => i.severity === "amber");
		const greens = items.filter((i) => i.severity === "green");

		// Trim greens first, then ambers if still over
		const budget = 5;
		const redCount = reds.length;
		const amberBudget = Math.min(ambers.length, budget - redCount);
		const greenBudget = Math.min(greens.length, budget - redCount - amberBudget);

		return [
			...reds.slice(0, budget),
			...ambers.slice(0, amberBudget),
			...greens.slice(0, greenBudget),
		].slice(0, 5);
	}

	return items;
}
