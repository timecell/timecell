import type { FastifyInstance } from "fastify";
import { DEMO_PORTFOLIO, DEMO_HEDGE_POSITIONS, type PortfolioInput, type HedgePosition } from "@timecell/engine";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".timecell");
const PORTFOLIO_PATH = join(CONFIG_DIR, "portfolio.json");

interface SavedPortfolio {
	portfolio: PortfolioInput;
	hedgePositions: HedgePosition[];
}

async function loadPortfolio(): Promise<SavedPortfolio> {
	try {
		const data = await readFile(PORTFOLIO_PATH, "utf-8");
		return JSON.parse(data);
	} catch {
		return { portfolio: DEMO_PORTFOLIO, hedgePositions: DEMO_HEDGE_POSITIONS };
	}
}

async function savePortfolio(data: SavedPortfolio): Promise<void> {
	await mkdir(CONFIG_DIR, { recursive: true });
	await writeFile(PORTFOLIO_PATH, JSON.stringify(data, null, 2));
}

export async function portfolioRoutes(fastify: FastifyInstance) {
	fastify.get("/portfolio", async () => {
		return loadPortfolio();
	});

	fastify.post<{ Body: SavedPortfolio }>("/portfolio", async (request) => {
		await savePortfolio(request.body);
		return { saved: true };
	});
}
