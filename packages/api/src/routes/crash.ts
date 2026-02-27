import type { FastifyInstance } from "fastify";
import {
	calculateCrashSurvival,
	type PortfolioInput,
	type HedgePosition,
	type CrashSurvivalConfig,
} from "@timecell/engine";

interface CrashSurvivalBody {
	portfolio: PortfolioInput;
	hedgePositions?: HedgePosition[];
	config?: Partial<CrashSurvivalConfig>;
}

export async function crashRoutes(fastify: FastifyInstance) {
	fastify.post<{ Body: CrashSurvivalBody }>("/crash-survival", async (request) => {
		const { portfolio, hedgePositions = [], config = {} } = request.body;
		return calculateCrashSurvival(portfolio, hedgePositions, config);
	});
}
