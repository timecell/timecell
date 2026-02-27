import type { SurvivalResult } from "../hooks/usePortfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SurvivalSummary({ result }: { result: SurvivalResult }) {
	const { maxSurvivableDrawdown, ruinTestPassed } = result;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				<div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-1">Survival Summary</h3>
						<p className="text-xs sm:text-sm text-slate-300">
							You survive down to a{" "}
							<span
								className={`font-bold text-lg sm:text-xl ${maxSurvivableDrawdown >= 70 ? "text-emerald-400" : maxSurvivableDrawdown >= 50 ? "text-amber-400" : "text-red-400"}`}
							>
								{maxSurvivableDrawdown}%
							</span>{" "}
							crash before needing to sell
						</p>
					</div>

					<Badge
						variant={ruinTestPassed ? "outline" : "destructive"}
						className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg flex-shrink-0 h-auto text-sm ${
							ruinTestPassed
								? "bg-emerald-900/30 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/30"
								: "bg-red-900/30 border-red-500/50 text-red-400 hover:bg-red-900/30"
						}`}
					>
						<span className="text-xl sm:text-2xl">
							{ruinTestPassed ? "\u2713" : "\u2717"}
						</span>
						<div className="text-left">
							<div className={`text-xs sm:text-sm font-bold ${ruinTestPassed ? "text-emerald-400" : "text-red-400"}`}>
								Ruin Test {ruinTestPassed ? "PASSED" : "FAILED"}
							</div>
							<div className="text-xs text-slate-400 font-normal">BTC -80% + Assets -40%</div>
						</div>
					</Badge>
				</div>
			</CardContent>
		</Card>
	);
}
