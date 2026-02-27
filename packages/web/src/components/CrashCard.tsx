import type { CrashScenario } from "../hooks/usePortfolio";

function formatUsd(value: number): string {
	if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
	return `$${value.toFixed(0)}`;
}

function formatMonths(months: number): string {
	if (months === Infinity) return "\u221e";
	if (months > 120) return "120mo+";
	return `${months.toFixed(0)}mo`;
}

/**
 * Get visual severity style based on drawdown percentage.
 * Even if the survival status is "safe", deeper drawdowns get warmer colors
 * to communicate relative risk at a glance.
 */
function getSeverityStyle(scenario: CrashScenario) {
	// If not safe, use status-based styling
	if (scenario.survivalStatus === "critical") {
		return {
			bg: "bg-red-900/30",
			border: "border-red-500/50",
			badge: "bg-red-500",
			badgeText: "text-black",
			text: "text-red-400",
			label: "CRITICAL",
		};
	}
	if (scenario.survivalStatus === "warning") {
		return {
			bg: "bg-amber-900/30",
			border: "border-amber-500/50",
			badge: "bg-amber-500",
			badgeText: "text-black",
			text: "text-amber-400",
			label: "WARNING",
		};
	}

	// Safe status — apply gradient severity based on drawdown depth
	if (scenario.drawdownPct <= 30) {
		return {
			bg: "bg-emerald-900/30",
			border: "border-emerald-500/50",
			badge: "bg-emerald-500",
			badgeText: "text-black",
			text: "text-emerald-400",
			label: "SAFE",
		};
	}
	if (scenario.drawdownPct <= 50) {
		return {
			bg: "bg-emerald-900/20",
			border: "border-emerald-500/30",
			badge: "bg-emerald-600",
			badgeText: "text-black",
			text: "text-emerald-400",
			label: "SAFE",
		};
	}
	if (scenario.drawdownPct <= 70) {
		return {
			bg: "bg-amber-900/15",
			border: "border-amber-500/30",
			badge: "bg-amber-500",
			badgeText: "text-black",
			text: "text-amber-400",
			label: "SAFE",
		};
	}
	// 80%+
	return {
		bg: "bg-orange-900/20",
		border: "border-orange-500/30",
		badge: "bg-orange-500",
		badgeText: "text-black",
		text: "text-orange-400",
		label: "SAFE",
	};
}

export function CrashCard({ scenario }: { scenario: CrashScenario }) {
	const style = getSeverityStyle(scenario);

	return (
		<div
			className={`rounded-xl border ${style.border} ${style.bg} p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`}
		>
			<div className="flex items-center justify-between mb-4">
				<span className="text-2xl font-bold text-white">-{scenario.drawdownPct}%</span>
				<span
					className={`${style.badge} ${style.badgeText} text-xs font-bold px-2.5 py-1 rounded-full`}
				>
					{style.label}
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
					<span className={`font-mono text-sm ${style.text}`}>
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
					<span className={`font-mono text-sm font-bold ${style.text}`}>
						{formatMonths(scenario.runwayMonths)}
					</span>
				</div>
			</div>
		</div>
	);
}
