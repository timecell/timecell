import type { FastifyInstance } from "fastify";
import { calculateTemperature } from "@timecell/engine";

// ---------------------------------------------------------------------------
// Mock data — will be replaced with live MVRV/RHODL feeds in a future release.
// MVRV ~1.8 and RHODL ~1.6 are representative of mid-cycle neutral territory.
// ---------------------------------------------------------------------------
const MOCK_MVRV = 1.8;
const MOCK_RHODL = 1.6;

export async function temperatureRoutes(fastify: FastifyInstance) {
	fastify.get("/temperature", async () => {
		const result = calculateTemperature(MOCK_MVRV, MOCK_RHODL);
		return {
			...result,
			dataSource: "mock",
			note: "Live MVRV/RHODL feeds coming soon",
		};
	});
}
