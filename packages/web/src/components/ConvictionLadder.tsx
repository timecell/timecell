import { Card, CardContent } from "@/components/ui/card";

const RUNGS = [
	{ level: 6, name: "Single-Asset Core", range: "50%+", min: 50, max: 100, desc: "Portfolio defined by Bitcoin" },
	{ level: 5, name: "Owner-Class", range: "25-50%", min: 25, max: 50, desc: "Major asset, requires discipline" },
	{ level: 4, name: "High Conviction", range: "10-25%", min: 10, max: 25, desc: "Core holding, conviction-based" },
	{ level: 3, name: "Diversifier", range: "5-10%", min: 5, max: 10, desc: "Meaningful allocation, portfolio diversifier" },
	{ level: 2, name: "Experimenter", range: "1-3%", min: 1, max: 3, desc: "Small position to learn" },
	{ level: 1, name: "Observer", range: "0%", min: 0, max: 0, desc: "Watching from the sidelines" },
] as const;

function getActiveRung(btcPercentage: number): number {
	if (btcPercentage >= 50) return 6;
	if (btcPercentage >= 25) return 5;
	if (btcPercentage >= 10) return 4;
	if (btcPercentage >= 5) return 3;
	if (btcPercentage >= 1) return 2;
	return 1;
}

export function ConvictionLadder({ btcPercentage }: { btcPercentage: number }) {
	const activeLevel = getActiveRung(btcPercentage);
	const showGates = btcPercentage >= 25;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				<h3 className="text-base sm:text-lg font-semibold text-white mb-1">
					Conviction Ladder
				</h3>
				<p className="text-xs text-slate-400 mb-4">
					Your {btcPercentage}% BTC allocation
				</p>

				<div className="space-y-1.5">
					{RUNGS.map((rung) => {
						const isActive = rung.level === activeLevel;
						return (
							<div
								key={rung.level}
								className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
									isActive
										? "bg-orange-500/15 border border-orange-500/40"
										: "bg-slate-800/40 border border-transparent"
								}`}
							>
								{/* Rung number */}
								<div
									className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
										isActive
											? "bg-orange-500 text-white"
											: "bg-slate-700 text-slate-400"
									}`}
								>
									{rung.level}
								</div>

								{/* Rung info */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span
											className={`text-sm font-medium ${
												isActive ? "text-orange-400" : "text-slate-300"
											}`}
										>
											{rung.name}
										</span>
										<span
											className={`text-xs ${
												isActive ? "text-orange-400/70" : "text-slate-500"
											}`}
										>
											{rung.range}
										</span>
									</div>
									<p
										className={`text-xs truncate ${
											isActive ? "text-orange-300/60" : "text-slate-500"
										}`}
									>
										{rung.desc}
									</p>
								</div>

								{/* Active indicator */}
								{isActive && (
									<div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
								)}
							</div>
						);
					})}
				</div>

				{/* Gates warning for 25%+ */}
				{showGates && (
					<div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-900/15 px-3 py-2.5">
						<div className="flex items-start gap-2">
							<span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">!</span>
							<div>
								<p className="text-xs font-medium text-amber-400 mb-1">
									Gates for 25%+ allocation
								</p>
								<p className="text-xs text-amber-300/60 leading-relaxed">
									Multi-cycle experience, 2yr expenses outside BTC, no forced-sale liabilities, written de-risk triggers
								</p>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
