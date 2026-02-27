import Fastify from "fastify";
import cors from "@fastify/cors";
import { crashRoutes } from "./routes/crash.js";
import { portfolioRoutes } from "./routes/portfolio.js";
import { priceRoutes } from "./routes/price.js";

export async function buildServer() {
	const fastify = Fastify({ logger: true });

	await fastify.register(cors, { origin: true });

	// API routes
	await fastify.register(crashRoutes, { prefix: "/api" });
	await fastify.register(portfolioRoutes, { prefix: "/api" });
	await fastify.register(priceRoutes, { prefix: "/api" });

	// Health check
	fastify.get("/api/health", async () => ({ status: "ok", version: "0.1.0" }));

	return fastify;
}

// Direct execution (dev mode)
const isDirectRun =
	process.argv[1]?.endsWith("src/server.ts") ||
	process.argv[1]?.endsWith("dist/server.js");
if (isDirectRun) {
	buildServer().then(async (server) => {
		try {
			await server.listen({ port: 3737, host: "0.0.0.0" });
			console.log("TimeCell API running on http://localhost:3737");
		} catch (err) {
			server.log.error(err);
			process.exit(1);
		}
	});
}
