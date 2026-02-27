import type { FastifyInstance } from "fastify";
import { calculatePositionSizing, type PositionSizingInput } from "@timecell/engine";

export async function positionSizingRoutes(fastify: FastifyInstance) {
	fastify.post<{ Body: PositionSizingInput }>("/position-sizing", async (request) => {
		return calculatePositionSizing(request.body);
	});
}
