import { useState, useCallback } from "react";

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

export function usePortfolio() {
	const [portfolio, setPortfolio] = useState<PortfolioInput>({
		totalValueUsd: 5_000_000,
		btcPercentage: 35,
		monthlyBurnUsd: 25_000,
		liquidReserveUsd: 600_000,
		btcPriceUsd: 84_000,
	});
	const [hedgePositions, setHedgePositions] = useState<HedgePosition[]>([]);
	const [result, setResult] = useState<SurvivalResult | null>(null);
	const [loading, setLoading] = useState(false);

	const calculate = useCallback(async (p: PortfolioInput, h: HedgePosition[]) => {
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/crash-survival`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ portfolio: p, hedgePositions: h }),
			});
			const data: SurvivalResult = await res.json();
			setResult(data);
		} catch (err) {
			console.error("Failed to calculate:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	const loadPortfolio = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE}/portfolio`);
			const data = await res.json();
			setPortfolio(data.portfolio);
			setHedgePositions(data.hedgePositions || []);
			await calculate(data.portfolio, data.hedgePositions || []);
		} catch {
			// Use defaults and calculate
			await calculate(portfolio, hedgePositions);
		}
	}, [calculate]);

	const updatePortfolio = useCallback(
		async (updates: Partial<PortfolioInput>) => {
			const updated = { ...portfolio, ...updates };
			setPortfolio(updated);
			await calculate(updated, hedgePositions);
		},
		[portfolio, hedgePositions, calculate],
	);

	return {
		portfolio,
		hedgePositions,
		result,
		loading,
		loadPortfolio,
		updatePortfolio,
		setHedgePositions,
		calculate,
	};
}
