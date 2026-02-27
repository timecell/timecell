import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { crashRoutes } from "./routes/crash.js";
import { portfolioRoutes } from "./routes/portfolio.js";
import { priceRoutes } from "./routes/price.js";
import { temperatureRoutes } from "./routes/temperature.js";
import { positionSizingRoutes } from "./routes/position-sizing.js";
import { actionPlanRoutes } from "./routes/action-plan.js";

function findWebDist(): string | null {
	const candidates = [
		// Bundled inside API package (npm published)
		join(dirname(fileURLToPath(import.meta.url)), "web"),
		// Monorepo development (src/)
		join(dirname(fileURLToPath(import.meta.url)), "../../web/dist"),
		// Monorepo development (dist/)
		join(dirname(fileURLToPath(import.meta.url)), "../web"),
	];
	for (const p of candidates) {
		if (existsSync(join(p, "index.html"))) return p;
	}
	return null;
}

export async function buildServer() {
	const fastify = Fastify({ logger: false });

	await fastify.register(cors, { origin: true });

	// API routes
	await fastify.register(crashRoutes, { prefix: "/api" });
	await fastify.register(portfolioRoutes, { prefix: "/api" });
	await fastify.register(priceRoutes, { prefix: "/api" });
	await fastify.register(temperatureRoutes, { prefix: "/api" });
	await fastify.register(positionSizingRoutes, { prefix: "/api" });
	await fastify.register(actionPlanRoutes, { prefix: "/api" });

	// Health check
	fastify.get("/api/health", async () => ({ status: "ok", version: "0.2.0" }));

	// Serve built web dashboard if available
	const webDist = findWebDist();
	if (webDist) {
		await fastify.register(fastifyStatic, { root: webDist, prefix: "/" });
		// SPA fallback: serve index.html for non-API routes
		fastify.setNotFoundHandler(async (req, reply) => {
			if (req.url.startsWith("/api")) {
				return reply.status(404).send({ error: "Not Found", statusCode: 404 });
			}
			return reply.sendFile("index.html");
		});
	} else {
		fastify.get("/", async () => ({
			message: "TimeCell API is running. Build the web dashboard with: npm run build --workspace=@timecell/web",
			health: "/api/health",
		}));
	}

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
