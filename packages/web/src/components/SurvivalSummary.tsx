import type { SurvivalResult } from "../hooks/usePortfolio";

export function SurvivalSummary({ result }: { result: SurvivalResult }) {
	const { maxSurvivableDrawdown, ruinTestPassed } = result;

	return (
		<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h3 className="text-lg font-semibold text-white mb-1">Survival Summary</h3>
					<p className="text-slate-300">
						You survive down to a{" "}
						<span
							className={`font-bold text-xl ${maxSurvivableDrawdown >= 70 ? "text-emerald-400" : maxSurvivableDrawdown >= 50 ? "text-amber-400" : "text-red-400"}`}
						>
							{maxSurvivableDrawdown}%
						</span>{" "}
						crash before needing to sell
					</p>
				</div>

				<div
					className={`flex items-center gap-2 px-4 py-2 rounded-lg ${ruinTestPassed ? "bg-emerald-900/30 border border-emerald-500/50" : "bg-red-900/30 border border-red-500/50"}`}
				>
					<span className={`text-2xl ${ruinTestPassed ? "" : ""}`}>
						{ruinTestPassed ? "✓" : "✗"}
					</span>
					<div>
						<div
							className={`text-sm font-bold ${ruinTestPassed ? "text-emerald-400" : "text-red-400"}`}
						>
							Ruin Test {ruinTestPassed ? "PASSED" : "FAILED"}
						</div>
						<div className="text-xs text-slate-400">BTC -80% + Assets -40%</div>
					</div>
				</div>
			</div>
		</div>
	);
}
