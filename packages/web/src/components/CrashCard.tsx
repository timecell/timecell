import type { CrashScenario } from "../hooks/usePortfolio";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";

function formatCurrency(value: number, symbol = "$"): string {
	if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
	return `${symbol}${value.toFixed(0)}`;
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
			badgeVariant: "destructive" as const,
			badgeClass: "bg-red-500 text-black hover:bg-red-500",
			text: "text-red-400",
			label: "CRITICAL",
		};
	}
	if (scenario.survivalStatus === "warning") {
		return {
			bg: "bg-amber-900/30",
			border: "border-amber-500/50",
			badgeVariant: "secondary" as const,
			badgeClass: "bg-amber-500 text-black hover:bg-amber-500",
			text: "text-amber-400",
			label: "WARNING",
		};
	}

	// Safe status — apply gradient severity based on drawdown depth
	if (scenario.drawdownPct <= 30) {
		return {
			bg: "bg-emerald-900/30",
			border: "border-emerald-500/50",
			badgeVariant: "outline" as const,
			badgeClass: "bg-emerald-500 text-black border-emerald-500 hover:bg-emerald-500",
			text: "text-emerald-400",
			label: "SAFE",
		};
	}
	if (scenario.drawdownPct <= 50) {
		return {
			bg: "bg-emerald-900/20",
			border: "border-emerald-500/30",
			badgeVariant: "outline" as const,
			badgeClass: "bg-emerald-600 text-black border-emerald-600 hover:bg-emerald-600",
			text: "text-emerald-400",
			label: "SAFE",
		};
	}
	if (scenario.drawdownPct <= 70) {
		return {
			bg: "bg-amber-900/15",
			border: "border-amber-500/30",
			badgeVariant: "secondary" as const,
			badgeClass: "bg-amber-500 text-black hover:bg-amber-500",
			text: "text-amber-400",
			label: "SAFE",
		};
	}
	// 80%+
	return {
		bg: "bg-orange-900/20",
		border: "border-orange-500/30",
		badgeVariant: "secondary" as const,
		badgeClass: "bg-orange-500 text-black hover:bg-orange-500",
		text: "text-orange-400",
		label: "SAFE",
	};
}

export function CrashCard({ scenario, currencySymbol = "$" }: { scenario: CrashScenario; currencySymbol?: string }) {
	const style = getSeverityStyle(scenario);

	return (
		<Card
			className={`${style.border} ${style.bg} transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 shadow-none`}
		>
			<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 sm:p-5 pb-0 sm:pb-0">
				<span className="text-xl sm:text-2xl font-bold text-white">-{scenario.drawdownPct}%</span>
				<Badge
					variant={style.badgeVariant}
					className={`${style.badgeClass} rounded-full text-xs font-bold px-2.5 py-1 w-fit`}
				>
					{style.label}
				</Badge>
			</CardHeader>

			<CardContent className="p-3 sm:p-5 pt-3 sm:pt-4">
				<div className="space-y-2 sm:space-y-3">
					<div className="flex justify-between gap-2">
						<span className="text-slate-300 text-xs sm:text-sm flex-shrink-0">BTC Price</span>
						<span className="text-white font-mono text-xs sm:text-sm text-right">
							{formatCurrency(scenario.btcPriceAtCrash, currencySymbol)}
						</span>
					</div>
					<div className="flex justify-between gap-2">
						<span className="text-slate-300 text-xs sm:text-sm flex-shrink-0">Portfolio Value</span>
						<span className={`font-mono text-xs sm:text-sm ${style.text} text-right`}>
							{formatCurrency(scenario.portfolioValueAfterCrash, currencySymbol)}
						</span>
					</div>
					{scenario.hedgePayoff > 0 && (
						<div className="flex justify-between gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="text-slate-300 text-xs sm:text-sm flex-shrink-0 cursor-help underline decoration-dotted underline-offset-4 decoration-slate-600">
										Hedge Payoff
									</span>
								</TooltipTrigger>
								<TooltipContent>
									<p>Value of put options at this crash level</p>
								</TooltipContent>
							</Tooltip>
							<span className="text-emerald-400 font-mono text-xs sm:text-sm text-right">
								+{formatCurrency(scenario.hedgePayoff, currencySymbol)}
							</span>
						</div>
					)}
					<div className="flex justify-between gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="text-slate-300 text-xs sm:text-sm flex-shrink-0 cursor-help underline decoration-dotted underline-offset-4 decoration-slate-600">
									Net Position
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>Portfolio value after crash + hedge payoff + liquid reserve</p>
							</TooltipContent>
						</Tooltip>
						<span className="text-white font-mono text-xs sm:text-sm font-bold text-right">
							{formatCurrency(scenario.netPosition, currencySymbol)}
						</span>
					</div>
					<Separator className="bg-slate-700" />
					<div className="flex justify-between gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="text-slate-300 text-xs sm:text-sm flex-shrink-0 cursor-help underline decoration-dotted underline-offset-4 decoration-slate-600">
									Runway
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									{isFinite(scenario.runwayMonths) && scenario.runwayMonths > 0
										? `Months of ${formatCurrency(Math.round(scenario.netPosition / scenario.runwayMonths), currencySymbol)}/mo burn covered by remaining assets`
										: "Months of expenses covered by remaining assets"}
								</p>
							</TooltipContent>
						</Tooltip>
						<span className={`font-mono text-xs sm:text-sm font-bold ${style.text} text-right`}>
							{formatMonths(scenario.runwayMonths)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
