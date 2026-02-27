import { useEffect, useState } from "react";
import { usePortfolio } from "./hooks/usePortfolio";
import { SurvivalHero } from "./components/SurvivalHero";
import { PortfolioForm } from "./components/PortfolioForm";
import { CrashChart } from "./components/CrashChart";
import { CrashGrid } from "./components/CrashGrid";
import { BtcPriceTicker } from "./components/BtcPriceTicker";
import { TemperatureGauge } from "./components/TemperatureGauge";
import { PositionSizing } from "./components/PositionSizing";
import { ActionPlan } from "./components/ActionPlan";
import { ConvictionLadder } from "./components/ConvictionLadder";
import { InfoPanel } from "./components/InfoPanel";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
	const { portfolio, currencySymbol, result, loading, error, savedAt, loadPortfolio, updatePortfolio } = usePortfolio();
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [temperatureScore, setTemperatureScore] = useState(55);

	useEffect(() => {
		loadPortfolio();
	}, []);

	return (
		<TooltipProvider delayDuration={300}>
		<div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
			{/* Header */}
			<header className="border-b border-slate-800 px-4 sm:px-6 py-4">
				<div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center gap-3">
						<img src="/logo.png" alt="TimeCell" className="h-8 brightness-110" />
						<span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
							v0.2
						</span>
						<BtcPriceTicker fallbackPrice={portfolio.btcPriceUsd} currencySymbol={currencySymbol} />
					</div>
					<span className="text-xs sm:text-sm text-slate-500">Crash Survival Calculator</span>
				</div>
			</header>

			{/* Main content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
				{/* Error banner */}
				{error && (
					<div className="rounded-lg border border-red-500/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
						{error}
					</div>
				)}

				{/* ZONE 1: Hero — Big survival score + ruin test */}
				{result && <SurvivalHero result={result} />}

				{/* Loading skeleton for hero */}
				{!result && loading && (
					<div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-8 animate-pulse">
						<div className="flex items-center gap-10">
							<div>
								<div className="h-4 w-32 bg-slate-700 rounded mb-4" />
								<div className="h-20 w-36 bg-slate-700 rounded" />
							</div>
							<div className="hidden sm:block w-px h-24 bg-slate-700" />
							<div className="flex-1 space-y-4">
								<div className="h-12 w-48 bg-slate-700 rounded" />
								<div className="flex gap-6">
									<div className="h-10 w-28 bg-slate-700 rounded" />
									<div className="h-10 w-28 bg-slate-700 rounded" />
								</div>
							</div>
						</div>
					</div>
				)}

				{/* ZONE 2: Interactive — Sliders + Chart side by side */}
				<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
					<div className="lg:col-span-2">
						<PortfolioForm portfolio={portfolio} onUpdate={updatePortfolio} savedAt={savedAt} currencySymbol={currencySymbol} />
					</div>
					<div className="lg:col-span-3">
						{result && !loading && <CrashChart result={result} currencySymbol={currencySymbol} />}
						{loading && (
							<div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 animate-pulse h-full min-h-[300px]">
								<div className="h-5 w-48 bg-slate-700 rounded mb-6" />
								<div className="h-full bg-slate-700/30 rounded" />
							</div>
						)}
					</div>
				</div>

				{/* ZONE 3: Market Intelligence — Temperature + Position Sizing + Action Plan */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<TemperatureGauge onTemperatureChange={setTemperatureScore} />
					<PositionSizing
						totalValueUsd={portfolio.totalValueUsd}
						currentBtcPct={portfolio.btcPercentage}
						monthlyBurnUsd={portfolio.monthlyBurnUsd}
						liquidReserveUsd={portfolio.liquidReserveUsd}
						btcPriceUsd={portfolio.btcPriceUsd}
						currencySymbol={currencySymbol}
					/>
					<ActionPlan
						btcPercentage={portfolio.btcPercentage}
						ruinTestPassed={result?.ruinTestPassed ?? true}
						runwayMonths={result?.scenarios?.[result.scenarios.length - 1]?.runwayMonths ?? Infinity}
						temperatureScore={temperatureScore}
						liquidReserveUsd={portfolio.liquidReserveUsd}
						monthlyBurnUsd={portfolio.monthlyBurnUsd}
						totalValueUsd={portfolio.totalValueUsd}
					/>
				</div>

				{/* ZONE 4: Crash details — collapsed by default */}
				{result && !loading && (
					<div>
						<button
							type="button"
							onClick={() => setDetailsOpen((o) => !o)}
							className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
						>
							<span className={`inline-block w-3 h-3 border-r-2 border-b-2 border-current transform transition-transform duration-200 ${
								detailsOpen ? "-rotate-[135deg] translate-y-0.5" : "rotate-45 -translate-y-0.5"
							}`} />
							<span>Crash Scenario Details</span>
							<span className="text-xs text-slate-600">({result.scenarios.length} scenarios)</span>
						</button>
						{detailsOpen && <CrashGrid result={result} currencySymbol={currencySymbol} />}
					</div>
				)}

				{/* ZONE 5: Framework — below fold */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<ConvictionLadder btcPercentage={portfolio.btcPercentage} />
					<InfoPanel />
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-800 px-4 sm:px-6 py-4 mt-8 sm:mt-12">
				<div className="max-w-7xl mx-auto text-center text-xs text-slate-600">
					TimeCell — Local-first. Your data stays on your machine.
				</div>
			</footer>
		</div>
		</TooltipProvider>
	);
}
