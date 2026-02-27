import type { FastifyInstance } from "fastify";
import { DEMO_BTC_PRICE } from "@timecell/engine";

let cachedPrice = { price: DEMO_BTC_PRICE, source: "default", updatedAt: new Date().toISOString() };

async function fetchLivePrice(): Promise<number | null> {
	try {
		const res = await fetch(
			"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
		);
		if (!res.ok) return null;
		const data = await res.json();
		return data?.bitcoin?.usd ?? null;
	} catch {
		return null;
	}
}

export async function priceRoutes(fastify: FastifyInstance) {
	fastify.get("/price", async () => {
		// Try live price, fall back to cached/default
		const live = await fetchLivePrice();
		if (live) {
			cachedPrice = { price: live, source: "coingecko", updatedAt: new Date().toISOString() };
		}
		return cachedPrice;
	});
}
