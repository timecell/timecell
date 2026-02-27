import { useState, useEffect, useRef, useCallback } from "react";

export interface BtcPriceState {
	price: number | null;
	loading: boolean;
	lastUpdated: Date | null;
	source: "api" | "coingecko" | null;
}

const REFRESH_INTERVAL_MS = 60_000;
const API_PRICE_URL = "/api/price";
const COINGECKO_URL =
	"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

async function fetchFromApi(): Promise<{ price: number; source: "api" } | null> {
	try {
		const res = await fetch(API_PRICE_URL);
		if (!res.ok) return null;
		const ct = res.headers.get("content-type") ?? "";
		if (!ct.includes("application/json")) return null;
		const data = await res.json();
		const price = typeof data?.price === "number" ? data.price : null;
		if (!price) return null;
		return { price, source: "api" };
	} catch {
		return null;
	}
}

async function fetchFromCoinGecko(): Promise<{ price: number; source: "coingecko" } | null> {
	try {
		const res = await fetch(COINGECKO_URL);
		if (!res.ok) return null;
		const data = await res.json();
		const price = data?.bitcoin?.usd ?? null;
		if (!price) return null;
		return { price, source: "coingecko" as const };
	} catch {
		return null;
	}
}

export function useBtcPrice(fallbackPrice?: number): BtcPriceState {
	const [state, setState] = useState<BtcPriceState>({
		price: fallbackPrice ?? null,
		loading: true,
		lastUpdated: null,
		source: null,
	});

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const refresh = useCallback(async () => {
		// Try local API first; if unavailable (Vercel / standalone) fall back to CoinGecko direct
		const result = (await fetchFromApi()) ?? (await fetchFromCoinGecko());

		setState((prev) => ({
			price: result?.price ?? prev.price ?? fallbackPrice ?? null,
			loading: false,
			lastUpdated: result ? new Date() : prev.lastUpdated,
			source: result?.source ?? prev.source,
		}));
	}, [fallbackPrice]);

	useEffect(() => {
		// Kick off immediately on mount
		refresh();

		// Then refresh every 60 seconds
		intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);

		return () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
			}
		};
	}, [refresh]);

	return state;
}
