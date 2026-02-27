import { useState, useCallback, useRef } from "react";
import {
	calculateLocally,
	loadPortfolioFromStorage,
	savePortfolioToStorage,
	fetchBtcPrice,
} from "../lib/engine-standalone";

const API_BASE = "/api";

export interface PortfolioInput {
	totalValueUsd: number;
	btcPercentage: number;
	monthlyBurnUsd: number;
	liquidReserveUsd: number;
	btcPriceUsd: number;
}

export interface HedgePosition {
	strikeUsd: number;
	quantityBtc: number;
	expiryDate?: string;
}

export interface CrashScenario {
	drawdownPct: number;
	btcPriceAtCrash: number;
	btcValueAfterCrash: number;
	nonBtcValueAfterCrash: number;
	portfolioValueAfterCrash: number;
	hedgePayoff: number;
	netPosition: number;
	runwayMonths: number;
	survivalStatus: "safe" | "warning" | "critical";
}

export interface SurvivalResult {
	portfolio: PortfolioInput;
	scenarios: CrashScenario[];
	maxSurvivableDrawdown: number;
	ruinTestPassed: boolean;
}

// ---------------------------------------------------------------------------
// Mode detection: standalone (static site) vs API (CLI-served)
// ---------------------------------------------------------------------------

function detectStandalone(): boolean {
	// Explicit env flag set during Vercel build
	if (import.meta.env.VITE_STANDALONE === "true") return true;
	// Path-based detection (/app/ prefix means hosted static site)
	if (typeof window !== "undefined" && window.location.pathname.startsWith("/app")) return true;
	return false;
}

export function usePortfolio() {
	const [portfolio, setPortfolio] = useState<PortfolioInput>({
		totalValueUsd: 5_000_000,
		btcPercentage: 35,
		monthlyBurnUsd: 25_000,
		liquidReserveUsd: 600_000,
		btcPriceUsd: 67_000,
	});
	const [hedgePositions, setHedgePositions] = useState<HedgePosition[]>([]);
	const [currencySymbol, setCurrencySymbol] = useState("$");
	const [result, setResult] = useState<SurvivalResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savedAt, setSavedAt] = useState<number | null>(null);

	// Track whether we're in standalone mode. Once detected, stays sticky.
	const standaloneRef = useRef<boolean | null>(null);

	function isStandalone(): boolean {
		if (standaloneRef.current !== null) return standaloneRef.current;
		standaloneRef.current = detectStandalone();
		return standaloneRef.current;
	}

	// ---------------------------------------------------------------------------
	// Standalone calculate (engine imported directly)
	// ---------------------------------------------------------------------------
	const calculateStandalone = useCallback((p: PortfolioInput, h: HedgePosition[]) => {
		setLoading(true);
		setError(null);
		try {
			const data = calculateLocally(p, h);
			setResult(data as SurvivalResult);
		} catch (err) {
			console.error("Engine calculation error:", err);
			setError("Calculation failed. Please check your inputs.");
		} finally {
			setLoading(false);
		}
	}, []);

	// ---------------------------------------------------------------------------
	// API calculate (existing fetch-based flow)
	// ---------------------------------------------------------------------------
	const calculateApi = useCallback(async (p: PortfolioInput, h: HedgePosition[]) => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${API_BASE}/crash-survival`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ portfolio: p, hedgePositions: h }),
			});
			if (!res.ok) throw new Error(`API returned ${res.status}`);
			const data: SurvivalResult = await res.json();
			setResult(data);
		} catch (err) {
			console.error("API call failed, falling back to standalone:", err);
			// Fallback: switch to standalone mode permanently
			standaloneRef.current = true;
			calculateStandalone(p, h);
		} finally {
			setLoading(false);
		}
	}, [calculateStandalone]);

	// ---------------------------------------------------------------------------
	// Unified calculate
	// ---------------------------------------------------------------------------
	const calculate = useCallback(
		async (p: PortfolioInput, h: HedgePosition[]) => {
			if (isStandalone()) {
				calculateStandalone(p, h);
			} else {
				await calculateApi(p, h);
			}
		},
		[calculateStandalone, calculateApi],
	);

	// ---------------------------------------------------------------------------
	// Load portfolio (localStorage or API)
	// ---------------------------------------------------------------------------
	const loadPortfolio = useCallback(async () => {
		if (isStandalone()) {
			const saved = loadPortfolioFromStorage();
			// Try to get a fresh BTC price
			const btcPrice = await fetchBtcPrice();
			const p = { ...saved.portfolio, btcPriceUsd: btcPrice };
			setPortfolio(p);
			setHedgePositions(saved.hedgePositions || []);
			if (saved.currency?.symbol) setCurrencySymbol(saved.currency.symbol);
			calculateStandalone(p, saved.hedgePositions || []);
		} else {
			try {
				const res = await fetch(`${API_BASE}/portfolio`);
				const data = await res.json();
				setPortfolio(data.portfolio);
				setHedgePositions(data.hedgePositions || []);
				if (data.currency?.symbol) setCurrencySymbol(data.currency.symbol);
				await calculate(data.portfolio, data.hedgePositions || []);
			} catch {
				// API unavailable — switch to standalone
				standaloneRef.current = true;
				const saved = loadPortfolioFromStorage();
				const btcPrice = await fetchBtcPrice();
				const p = { ...saved.portfolio, btcPriceUsd: btcPrice };
				setPortfolio(p);
				setHedgePositions(saved.hedgePositions || []);
				if (saved.currency?.symbol) setCurrencySymbol(saved.currency.symbol);
				calculateStandalone(p, saved.hedgePositions || []);
			}
		}
	}, [calculate, calculateStandalone]);

	// ---------------------------------------------------------------------------
	// Update portfolio
	// ---------------------------------------------------------------------------
	const updatePortfolio = useCallback(
		async (updates: Partial<PortfolioInput>) => {
			const updated = { ...portfolio, ...updates };
			setPortfolio(updated);
			await calculate(updated, hedgePositions);
			setSavedAt(Date.now());

			// Persist to localStorage in standalone mode
			if (isStandalone()) {
				savePortfolioToStorage({
					portfolio: updated,
					hedgePositions,
					currency: { code: "USD", symbol: currencySymbol },
				});
			}
		},
		[portfolio, hedgePositions, currencySymbol, calculate],
	);

	return {
		portfolio,
		hedgePositions,
		currencySymbol,
		result,
		loading,
		error,
		savedAt,
		loadPortfolio,
		updatePortfolio,
		setHedgePositions,
		calculate,
	};
}
