import { useEffect } from "react";
import { usePortfolio } from "./hooks/usePortfolio";
import { PortfolioForm } from "./components/PortfolioForm";
import { CrashChart } from "./components/CrashChart";
import { CrashGrid } from "./components/CrashGrid";
import { SurvivalSummary } from "./components/SurvivalSummary";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
	const { portfolio, result, loading, error, loadPortfolio, updatePortfolio } = usePortfolio();

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
						<h1 className="text-lg sm:text-xl font-bold tracking-tight">
							<span className="text-orange-500">Time</span>Cell
						</h1>
						<span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
							v0.1.0
						</span>
					</div>
					<span className="text-xs sm:text-sm text-slate-500">Crash Survival Calculator</span>
				</div>
			</header>

			{/* Main content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
				{/* Portfolio form + quick stats */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
					<div className="lg:col-span-1">
						<PortfolioForm portfolio={portfolio} onUpdate={updatePortfolio} />
					</div>

					<div className="lg:col-span-2 space-y-6">
						{/* Error banner */}
						{error && (
							<div className="rounded-lg border border-red-500/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
								{error}
							</div>
						)}

						{/* Survival summary */}
						{result && <SurvivalSummary result={result} />}

						{/* Portfolio value chart */}
						{result && !loading && <CrashChart result={result} />}

						{/* Crash scenario cards */}
						{loading && (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
								{[30, 50, 70, 80].map((pct) => (
									<div key={pct} className="rounded-xl border border-slate-700 bg-slate-800/30 p-5 animate-pulse">
										<div className="h-6 w-16 bg-slate-700 rounded mb-4" />
										<div className="space-y-3">
											<div className="h-4 bg-slate-700/50 rounded" />
											<div className="h-4 bg-slate-700/50 rounded w-3/4" />
											<div className="h-4 bg-slate-700/50 rounded w-1/2" />
										</div>
									</div>
								))}
							</div>
						)}
						{result && !loading && <CrashGrid result={result} />}
					</div>
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
