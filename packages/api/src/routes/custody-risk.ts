import type { FastifyInstance } from "fastify";
import { calculateCustodyRisk, type CustodyInput } from "@timecell/engine";

export async function custodyRiskRoutes(fastify: FastifyInstance) {
	fastify.post<{ Body: CustodyInput }>("/custody-risk", async (request) => {
		return calculateCustodyRisk(request.body);
	});
}
