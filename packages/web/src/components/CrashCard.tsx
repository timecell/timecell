import type { CrashScenario } from "../hooks/usePortfolio";

function formatUsd(value: number): string {
	if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
	return `$${value.toFixed(0)}`;
}

function formatMonths(months: number): string {
	if (months === Infinity) return "∞";
	return `${months.toFixed(0)}mo`;
}

const STATUS_COLORS = {
	safe: {
		bg: "bg-emerald-900/30",
		border: "border-emerald-500/50",
		badge: "bg-emerald-500",
		text: "text-emerald-400",
		label: "SAFE",
	},
	warning: {
		bg: "bg-amber-900/30",
		border: "border-amber-500/50",
		badge: "bg-amber-500",
		text: "text-amber-400",
		label: "WARNING",
	},
	critical: {
		bg: "bg-red-900/30",
		border: "border-red-500/50",
		badge: "bg-red-500",
		text: "text-red-400",
		label: "CRITICAL",
	},
};

export function CrashCard({ scenario }: { scenario: CrashScenario }) {
	const status = STATUS_COLORS[scenario.survivalStatus];

	return (
		<div className={`rounded-xl border ${status.border} ${status.bg} p-5`}>
			<div className="flex items-center justify-between mb-4">
				<span className="text-2xl font-bold text-white">-{scenario.drawdownPct}%</span>
				<span
					className={`${status.badge} text-black text-xs font-bold px-2.5 py-1 rounded-full`}
				>
					{status.label}
				</span>
			</div>

			<div className="space-y-3">
				<div className="flex justify-between">
					<span className="text-slate-400 text-sm">BTC Price</span>
					<span className="text-white font-mono text-sm">
						{formatUsd(scenario.btcPriceAtCrash)}
					</span>
				</div>
				<div className="flex justify-between">
					<span className="text-slate-400 text-sm">Portfolio Value</span>
					<span className={`font-mono text-sm ${status.text}`}>
						{formatUsd(scenario.portfolioValueAfterCrash)}
					</span>
				</div>
				{scenario.hedgePayoff > 0 && (
					<div className="flex justify-between">
						<span className="text-slate-400 text-sm">Hedge Payoff</span>
						<span className="text-emerald-400 font-mono text-sm">
							+{formatUsd(scenario.hedgePayoff)}
						</span>
					</div>
				)}
				<div className="flex justify-between">
					<span className="text-slate-400 text-sm">Net Position</span>
					<span className="text-white font-mono text-sm font-bold">
						{formatUsd(scenario.netPosition)}
					</span>
				</div>
				<div className="border-t border-slate-700 pt-3 flex justify-between">
					<span className="text-slate-400 text-sm">Runway</span>
					<span className={`font-mono text-sm font-bold ${status.text}`}>
						{formatMonths(scenario.runwayMonths)}
					</span>
				</div>
			</div>
		</div>
	);
}
