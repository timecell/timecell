import { describe, it, expect } from "vitest";
import { generateActionPlan, type ActionPlanInput } from "./action-plan.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safe baseline: everything is fine. */
const SAFE: ActionPlanInput = {
	btcPercentage: 15,
	ruinTestPassed: true,
	runwayMonths: 36,
	temperatureScore: 50,
	liquidReserveUsd: 200_000,
	monthlyBurnUsd: 10_000,
	totalValueUsd: 1_000_000,
};

function findByRule(items: ReturnType<typeof generateActionPlan>, rule: string) {
	return items.find((i) => i.rule === rule);
}

// ---------------------------------------------------------------------------
// Red rules
// ---------------------------------------------------------------------------

describe("action plan — red rules", () => {
	it("ruin test failed -> red ruin-test", () => {
		const items = generateActionPlan({ ...SAFE, ruinTestPassed: false });
		const item = findByRule(items, "ruin-test");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("red");
	});

	it("temperature > 75 -> red temperature-extreme-greed", () => {
		const items = generateActionPlan({ ...SAFE, temperatureScore: 80 });
		const item = findByRule(items, "temperature-extreme-greed");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("red");
	});

	it("no liquid reserve -> red no-reserve", () => {
		const items = generateActionPlan({ ...SAFE, liquidReserveUsd: 0 });
		const item = findByRule(items, "no-reserve");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("red");
	});

	it("runway < 18 -> red insufficient-runway with actual months in message", () => {
		const items = generateActionPlan({ ...SAFE, runwayMonths: 12 });
		const item = findByRule(items, "insufficient-runway");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("red");
		expect(item!.message).toContain("12");
	});
});

// ---------------------------------------------------------------------------
// Amber rules
// ---------------------------------------------------------------------------

describe("action plan — amber rules", () => {
	it("btcPercentage >= 25 -> amber conviction-gates", () => {
		const items = generateActionPlan({ ...SAFE, btcPercentage: 30 });
		const item = findByRule(items, "conviction-gates");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("amber");
	});

	it("btcPercentage >= 50 -> amber insurance-needed AND conviction-gates (both fire)", () => {
		const items = generateActionPlan({ ...SAFE, btcPercentage: 55 });
		const insurance = findByRule(items, "insurance-needed");
		const gates = findByRule(items, "conviction-gates");
		expect(insurance).toBeDefined();
		expect(insurance!.severity).toBe("amber");
		expect(gates).toBeDefined();
		expect(gates!.severity).toBe("amber");
	});

	it("temperature < 20 -> amber temperature-extreme-fear", () => {
		const items = generateActionPlan({ ...SAFE, temperatureScore: 10 });
		const item = findByRule(items, "temperature-extreme-fear");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("amber");
	});

	it("temperature 60-75 -> amber temperature-greed", () => {
		const items = generateActionPlan({ ...SAFE, temperatureScore: 65 });
		const item = findByRule(items, "temperature-greed");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("amber");
	});
});

// ---------------------------------------------------------------------------
// Green rules
// ---------------------------------------------------------------------------

describe("action plan — green rules", () => {
	it("ruin test passed + runway >= 18 -> green ruin-test-passed", () => {
		const items = generateActionPlan(SAFE);
		const item = findByRule(items, "ruin-test-passed");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("green");
	});

	it("temperature 20-40 -> green temperature-fear", () => {
		const items = generateActionPlan({ ...SAFE, temperatureScore: 30 });
		const item = findByRule(items, "temperature-fear");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("green");
	});

	it("temperature 40-60 -> green temperature-neutral", () => {
		const items = generateActionPlan({ ...SAFE, temperatureScore: 50 });
		const item = findByRule(items, "temperature-neutral");
		expect(item).toBeDefined();
		expect(item!.severity).toBe("green");
	});
});

// ---------------------------------------------------------------------------
// Ordering & limits
// ---------------------------------------------------------------------------

describe("action plan — ordering and limits", () => {
	it("red items come before amber before green", () => {
		const items = generateActionPlan({
			...SAFE,
			ruinTestPassed: false, // red
			runwayMonths: 10, // red
			btcPercentage: 30, // amber
			temperatureScore: 50, // green neutral
		});

		const severities = items.map((i) => i.severity);
		const redIdx = severities.indexOf("red");
		const amberIdx = severities.indexOf("amber");
		const greenIdx = severities.indexOf("green");

		if (redIdx !== -1 && amberIdx !== -1) expect(redIdx).toBeLessThan(amberIdx);
		if (amberIdx !== -1 && greenIdx !== -1) expect(amberIdx).toBeLessThan(greenIdx);
	});

	it("max 5 items returned even when many rules match", () => {
		// Trigger as many rules as possible
		const items = generateActionPlan({
			btcPercentage: 55, // amber conviction-gates + insurance-needed
			ruinTestPassed: false, // red ruin-test
			runwayMonths: 5, // red insufficient-runway
			temperatureScore: 80, // red temperature-extreme-greed
			liquidReserveUsd: 0, // red no-reserve
			monthlyBurnUsd: 10_000,
			totalValueUsd: 1_000_000,
		});
		expect(items.length).toBeLessThanOrEqual(5);
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("action plan — edge cases", () => {
	it("btcPercentage exactly 25 -> triggers conviction-gates", () => {
		const items = generateActionPlan({ ...SAFE, btcPercentage: 25 });
		const item = findByRule(items, "conviction-gates");
		expect(item).toBeDefined();
	});

	it("btcPercentage exactly 50 -> triggers both conviction-gates AND insurance-needed", () => {
		const items = generateActionPlan({ ...SAFE, btcPercentage: 50 });
		expect(findByRule(items, "conviction-gates")).toBeDefined();
		expect(findByRule(items, "insurance-needed")).toBeDefined();
	});

	it("runwayMonths exactly 18 -> does NOT trigger insufficient-runway", () => {
		const items = generateActionPlan({ ...SAFE, runwayMonths: 18 });
		const item = findByRule(items, "insufficient-runway");
		expect(item).toBeUndefined();
	});

	it("temperatureScore exactly 20 -> triggers fear not extreme-fear", () => {
		const items = generateActionPlan({ ...SAFE, temperatureScore: 20 });
		expect(findByRule(items, "temperature-fear")).toBeDefined();
		expect(findByRule(items, "temperature-extreme-fear")).toBeUndefined();
	});
});
