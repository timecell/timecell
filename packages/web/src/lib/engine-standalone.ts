// =============================================================================
// Standalone Engine Adapter
// Imports engine directly (no API server needed) for static site deployment.
// Handles BTC price fetching and localStorage persistence.
// =============================================================================

import {
	calculateCrashSurvival,
	DEMO_PORTFOLIO,
	DEMO_HEDGE_POSITIONS,
	DEMO_BTC_PRICE,
	type PortfolioInput,
	type HedgePosition,
	type SurvivalResult,
} from "@timecell/engine";

const STORAGE_KEY = "timecell:portfolio";

interface SavedPortfolio {
	portfolio: PortfolioInput;
	hedgePositions: HedgePosition[];
	currency?: { code: string; symbol: string };
}

// ---------------------------------------------------------------------------
// BTC Price
// ---------------------------------------------------------------------------

let cachedBtcPrice: number | null = null;

export async function fetchBtcPrice(): Promise<number> {
	if (cachedBtcPrice) return cachedBtcPrice;
	try {
		const res = await fetch(
			"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
		);
		if (!res.ok) return DEMO_BTC_PRICE;
		const data = await res.json();
		const price = data?.bitcoin?.usd;
		if (typeof price === "number" && price > 0) {
			cachedBtcPrice = price;
			return price;
		}
		return DEMO_BTC_PRICE;
	} catch {
		return DEMO_BTC_PRICE;
	}
}

// ---------------------------------------------------------------------------
// LocalStorage Persistence
// ---------------------------------------------------------------------------

export function loadPortfolioFromStorage(): SavedPortfolio {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw) as SavedPortfolio;
	} catch {
		// corrupted data — fall through to defaults
	}
	return { portfolio: DEMO_PORTFOLIO, hedgePositions: DEMO_HEDGE_POSITIONS };
}

export function savePortfolioToStorage(data: SavedPortfolio): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		// localStorage full or unavailable — silently ignore
	}
}

// ---------------------------------------------------------------------------
// Calculation (direct engine call)
// ---------------------------------------------------------------------------

export function calculateLocally(
	portfolio: PortfolioInput,
	hedgePositions: HedgePosition[],
): SurvivalResult {
	return calculateCrashSurvival(portfolio, hedgePositions);
}
