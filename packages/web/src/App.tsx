import { useEffect } from "react";
import { usePortfolio } from "./hooks/usePortfolio";
import { PortfolioForm } from "./components/PortfolioForm";
import { CrashGrid } from "./components/CrashGrid";
import { SurvivalSummary } from "./components/SurvivalSummary";

export default function App() {
	const { portfolio, result, loading, loadPortfolio, updatePortfolio } = usePortfolio();

	useEffect(() => {
		loadPortfolio();
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
			{/* Header */}
			<header className="border-b border-slate-800 px-6 py-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-bold tracking-tight">
							<span className="text-orange-500">Time</span>Cell
						</h1>
						<span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
							v0.1.0
						</span>
					</div>
					<span className="text-sm text-slate-500">Crash Survival Calculator</span>
				</div>
			</header>

			{/* Main content */}
			<main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
				{/* Portfolio form + quick stats */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-1">
						<PortfolioForm portfolio={portfolio} onUpdate={updatePortfolio} />
					</div>

					<div className="lg:col-span-2 space-y-6">
						{/* Survival summary */}
						{result && <SurvivalSummary result={result} />}

						{/* Crash scenario cards */}
						{loading && (
							<div className="text-center text-slate-400 py-12">Calculating...</div>
						)}
						{result && !loading && <CrashGrid result={result} />}
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-800 px-6 py-4 mt-12">
				<div className="max-w-7xl mx-auto text-center text-xs text-slate-600">
					TimeCell — Local-first. Your data stays on your machine.
				</div>
			</footer>
		</div>
	);
}
