import type { FastifyInstance } from "fastify";
import { generateActionPlan, type ActionPlanInput } from "@timecell/engine";

function validateActionPlanInput(body: unknown): { valid: true; data: ActionPlanInput } | { valid: false; error: string } {
	if (!body || typeof body !== "object") {
		return { valid: false, error: "Request body must be a JSON object" };
	}

	const b = body as Record<string, unknown>;

	// btcPercentage: number 0-100
	if (typeof b.btcPercentage !== "number" || b.btcPercentage < 0 || b.btcPercentage > 100) {
		return { valid: false, error: "btcPercentage must be a number between 0 and 100" };
	}

	// ruinTestPassed: boolean
	if (typeof b.ruinTestPassed !== "boolean") {
		return { valid: false, error: "ruinTestPassed must be a boolean" };
	}

	// runwayMonths: number >= 0 (Infinity is allowed)
	if (typeof b.runwayMonths !== "number" || b.runwayMonths < 0) {
		return { valid: false, error: "runwayMonths must be a number >= 0" };
	}

	// temperatureScore: number 0-100
	if (typeof b.temperatureScore !== "number" || b.temperatureScore < 0 || b.temperatureScore > 100) {
		return { valid: false, error: "temperatureScore must be a number between 0 and 100" };
	}

	// liquidReserveUsd: number >= 0
	if (typeof b.liquidReserveUsd !== "number" || b.liquidReserveUsd < 0) {
		return { valid: false, error: "liquidReserveUsd must be a number >= 0" };
	}

	// monthlyBurnUsd: number >= 0
	if (typeof b.monthlyBurnUsd !== "number" || b.monthlyBurnUsd < 0) {
		return { valid: false, error: "monthlyBurnUsd must be a number >= 0" };
	}

	// totalValueUsd: number >= 0
	if (typeof b.totalValueUsd !== "number" || b.totalValueUsd < 0) {
		return { valid: false, error: "totalValueUsd must be a number >= 0" };
	}

	return {
		valid: true,
		data: {
			btcPercentage: b.btcPercentage,
			ruinTestPassed: b.ruinTestPassed,
			runwayMonths: b.runwayMonths,
			temperatureScore: b.temperatureScore,
			liquidReserveUsd: b.liquidReserveUsd,
			monthlyBurnUsd: b.monthlyBurnUsd,
			totalValueUsd: b.totalValueUsd,
		},
	};
}

export async function actionPlanRoutes(fastify: FastifyInstance) {
	fastify.post<{ Body: ActionPlanInput }>("/action-plan", async (request, reply) => {
		const validation = validateActionPlanInput(request.body);
		if (!validation.valid) {
			reply.status(400).send({ error: validation.error });
			return;
		}
		return generateActionPlan(validation.data);
	});
}
