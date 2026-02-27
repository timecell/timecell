import type { SurvivalResult } from "../hooks/usePortfolio";

function formatMonths(months: number): string {
	if (months === Infinity) return "\u221e";
	if (months > 120) return "120+";
	return `${Math.round(months)}`;
}

function getScoreColor(maxDrawdown: number, ruinPassed: boolean) {
	if (!ruinPassed) return { bg: "from-red-950/80 to-red-900/40", border: "border-red-500/30", text: "text-red-400", glow: "shadow-red-500/20" };
	if (maxDrawdown >= 80) return { bg: "from-emerald-950/80 to-emerald-900/40", border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-emerald-500/20" };
	if (maxDrawdown >= 70) return { bg: "from-emerald-950/60 to-emerald-900/30", border: "border-emerald-500/20", text: "text-emerald-400", glow: "shadow-emerald-500/10" };
	if (maxDrawdown >= 50) return { bg: "from-amber-950/60 to-amber-900/30", border: "border-amber-500/20", text: "text-amber-400", glow: "shadow-amber-500/10" };
	return { bg: "from-red-950/60 to-red-900/30", border: "border-red-500/20", text: "text-red-400", glow: "shadow-red-500/10" };
}

export function SurvivalHero({ result }: { result: SurvivalResult }) {
	const { maxSurvivableDrawdown, ruinTestPassed, scenarios } = result;
	const worstCase = scenarios[scenarios.length - 1]; // 80% drawdown
	const colors = getScoreColor(maxSurvivableDrawdown, ruinTestPassed);

	return (
		<div className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-4 sm:p-5 lg:p-8 transition-all duration-500 shadow-lg ${colors.glow}`}>
			{/* Background decoration */}
			<div className="absolute inset-0 opacity-5">
				<div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl translate-x-1/3 -translate-y-1/3" />
			</div>

			<div className="relative flex flex-col items-center gap-4">
				{/* Survival Score */}
				<div className="text-center flex-shrink-0">
					<p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Max Survivable Crash</p>
					<div className="flex items-baseline gap-1 justify-center">
						<span className={`text-5xl sm:text-6xl font-black tabular-nums tracking-tight ${colors.text} transition-colors duration-500`}>
							{maxSurvivableDrawdown}
						</span>
						<span className={`text-2xl sm:text-3xl font-bold ${colors.text} opacity-70`}>%</span>
					</div>
					<p className="text-xs text-slate-400 mt-1">drawdown before forced selling</p>
				</div>

				{/* Ruin test + key stats */}
				<div className="flex-1 w-full space-y-3">
					{/* Ruin test badge */}
					<div className={`flex items-center gap-2 sm:gap-3 rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${
						ruinTestPassed
							? "bg-emerald-500/10 border border-emerald-500/30"
							: "bg-red-500/10 border border-red-500/30"
					} transition-all duration-500`}>
						<span className={`text-xl sm:text-2xl flex-shrink-0 ${ruinTestPassed ? "text-emerald-400" : "text-red-400"}`}>
							{ruinTestPassed ? "\u2713" : "\u2717"}
						</span>
						<div className="min-w-0">
							<div className={`text-xs sm:text-sm font-bold ${ruinTestPassed ? "text-emerald-400" : "text-red-400"}`}>
								Ruin Test {ruinTestPassed ? "PASSED" : "FAILED"}
							</div>
							<div className="text-[10px] sm:text-xs text-slate-400">
								BTC -80% &amp; assets -40% simultaneously
							</div>
						</div>
					</div>

					{/* Key stats row */}
					<div className="flex gap-4">
						<div className="flex-1">
							<p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Worst-Case Runway</p>
							<p className={`text-lg sm:text-xl font-bold tabular-nums ${
								worstCase.runwayMonths >= 18 ? "text-emerald-400"
								: worstCase.runwayMonths >= 6 ? "text-amber-400"
								: "text-red-400"
							} transition-colors duration-500`}>
								{formatMonths(worstCase.runwayMonths)}
								<span className="text-[10px] sm:text-xs font-normal text-slate-500 ml-1">months</span>
							</p>
						</div>
						<div className="flex-1">
							<p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Survival Threshold</p>
							<p className="text-lg sm:text-xl font-bold text-slate-300">
								18<span className="text-[10px] sm:text-xs font-normal text-slate-500 ml-1">months</span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
