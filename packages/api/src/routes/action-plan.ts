import type { FastifyInstance } from "fastify";
import { generateActionPlan, type ActionPlanInput } from "@timecell/engine";

export async function actionPlanRoutes(fastify: FastifyInstance) {
	fastify.post<{ Body: ActionPlanInput }>("/action-plan", async (request) => {
		return generateActionPlan(request.body);
	});
}
