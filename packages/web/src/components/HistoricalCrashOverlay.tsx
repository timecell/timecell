import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	HISTORICAL_CRASHES,
	simulateHistoricalCrash,
} from "@timecell/engine";
import type { PortfolioInput } from "@timecell/engine";

// =============================================================================
// Helpers
// =============================================================================

function formatMoney(value: number, symbol = "$", rate = 1): string {
	const converted = value * rate;
	if (converted >= 1_000_000) return `${symbol}${(converted / 1_000_000).toFixed(1)}M`;
	if (converted >= 1_000) return `${symbol}${(converted / 1_000).toFixed(0)}K`;
	return `${symbol}${Math.round(converted).toLocaleString()}`;
}

function formatRunway(months: number): string {
	if (months === Infinity) return "∞";
	if (months >= 240) return "20+ yrs";
	if (months >= 24) return `${(months / 12).toFixed(1)} yrs`;
	return `${Math.round(months)} mo`;
}

function formatDateRange(peakDate: string, troughDate: string): string {
	const fmt = (d: string) => {
		const [year, month] = d.split("-");
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		return `${months[Number(month) - 1]} ${year}`;
	};
	return `${fmt(peakDate)} – ${fmt(troughDate)}`;
}

// =============================================================================
// Props
// =============================================================================

export interface HistoricalCrashOverlayProps {
	totalValueUsd: number;
	btcPercentage: number;
	monthlyBurnUsd: number;
	liquidReserveUsd: number;
	btcPriceUsd: number;
	currencySymbol?: string;
	currencyRate?: number;
}

// =============================================================================
// Crash Card sub-component
// =============================================================================

interface CrashCardProps {
	name: string;
	dateRange: string;
	drawdown: number;
	recoveryMonths: number;
	portfolioValueAtTrough: number;
	totalLoss: number;
	runwayMonths: number;
	survived: boolean;
	currencySymbol: string;
	currencyRate: number;
}

function CrashCard({
	name,
	dateRange,
	drawdown,
	recoveryMonths,
	portfolioValueAtTrough,
	totalLoss,
	runwayMonths,
	survived,
	currencySymbol,
	currencyRate,
}: CrashCardProps) {
	const borderColor = survived ? "border-emerald-500/40" : "border-red-500/40";
	const badgeBg = survived ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400";
	const runwayColor = survived ? "text-emerald-400" : "text-red-400";
	const drawdownColor =
		drawdown >= 80 ? "text-red-400" : drawdown >= 70 ? "text-orange-400" : "text-amber-400";

	return (
		<div className={`rounded-xl border ${borderColor} bg-slate-900/50 p-4`}>
			{/* Top row: crash name + survived badge */}
			<div className="flex items-start justify-between gap-2 mb-2">
				<div>
					<p className="text-sm font-semibold text-white leading-tight">{name}</p>
					<p className="text-xs text-slate-500 mt-0.5">{dateRange}</p>
				</div>
				<span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badgeBg}`}>
					{survived ? "Survived" : "Would Not Survive"}
				</span>
			</div>

			{/* Stats grid */}
			<div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
				<div>
					<p className="text-xs text-slate-500">BTC Drawdown</p>
					<p className={`text-sm font-semibold ${drawdownColor}`}>-{drawdown}%</p>
				</div>
				<div>
					<p className="text-xs text-slate-500">Recovery Time</p>
					<p className="text-sm font-semibold text-slate-300">
						{recoveryMonths >= 12
							? `~${Math.round(recoveryMonths / 12)} yr${recoveryMonths >= 24 ? "s" : ""}`
							: `~${recoveryMonths} mo`}
					</p>
				</div>
				<div>
					<p className="text-xs text-slate-500">Portfolio at Trough</p>
					<p className="text-sm font-semibold text-slate-200">
						{formatMoney(portfolioValueAtTrough, currencySymbol, currencyRate)}
					</p>
				</div>
				<div>
					<p className="text-xs text-slate-500">Total Loss</p>
					<p className="text-sm font-semibold text-red-400">
						-{formatMoney(totalLoss, currencySymbol, currencyRate)}
					</p>
				</div>
				<div className="col-span-2">
					<p className="text-xs text-slate-500">Runway After Crash</p>
					<p className={`text-sm font-bold ${runwayColor}`}>{formatRunway(runwayMonths)}</p>
				</div>
			</div>
		</div>
	);
}

// =============================================================================
// Main component
// =============================================================================

export function HistoricalCrashOverlay({
	totalValueUsd,
	btcPercentage,
	monthlyBurnUsd,
	liquidReserveUsd,
	btcPriceUsd,
	currencySymbol = "$",
	currencyRate = 1,
}: HistoricalCrashOverlayProps) {
	const portfolio: PortfolioInput = {
		totalValueUsd,
		btcPercentage,
		monthlyBurnUsd,
		liquidReserveUsd,
		btcPriceUsd,
	};

	// Simulate all crashes — sorted worst-first by drawdown
	const results = useMemo(
		() =>
			HISTORICAL_CRASHES.map((crash) => ({
				crash,
				result: simulateHistoricalCrash(portfolio, crash),
			})).sort((a, b) => b.crash.drawdown - a.crash.drawdown),
		[totalValueUsd, btcPercentage, monthlyBurnUsd, liquidReserveUsd, btcPriceUsd],
	);

	const survivedCount = results.filter((r) => r.result.survived).length;
	const totalCount = results.length;

	// Summary line styling
	const allSurvived = survivedCount === totalCount;
	const noneSurvived = survivedCount === 0;
	const summaryBg = allSurvived
		? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
		: noneSurvived
			? "bg-red-500/10 border-red-500/30 text-red-400"
			: "bg-amber-500/10 border-amber-500/30 text-amber-400";

	const summaryIcon = allSurvived ? "✓" : noneSurvived ? "✕" : "~";

	const summaryText =
		allSurvived
			? `You would have survived all ${totalCount} historical Bitcoin crashes.`
			: noneSurvived
				? `Your current portfolio would not have survived any of the ${totalCount} historical crashes.`
				: `You would have survived ${survivedCount} of ${totalCount} historical Bitcoin crashes.`;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
				<CardTitle className="text-sm sm:text-lg text-white leading-snug">
					Historical Crash Overlay
				</CardTitle>
				<p className="text-xs text-slate-400 mt-1">
					How your current portfolio would have fared in past Bitcoin bear markets
				</p>
			</CardHeader>
			<CardContent className="p-4 sm:p-6 pt-4 sm:pt-4 space-y-4">
				{/* Summary banner */}
				<div
					className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium ${summaryBg}`}
				>
					<span className="text-base leading-none">{summaryIcon}</span>
					<span>{summaryText}</span>
				</div>

				{/* Crash cards grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{results.map(({ crash, result }) => (
						<CrashCard
							key={crash.name}
							name={crash.name}
							dateRange={formatDateRange(crash.peakDate, crash.troughDate)}
							drawdown={crash.drawdown}
							recoveryMonths={crash.recoveryMonths}
							portfolioValueAtTrough={result.portfolioValueAtTrough}
							totalLoss={result.totalLoss}
							runwayMonths={result.runwayMonths}
							survived={result.survived}
							currencySymbol={currencySymbol}
							currencyRate={currencyRate}
						/>
					))}
				</div>

				{/* Methodology note */}
				<p className="text-xs text-slate-600 pt-1 border-t border-slate-700/50">
					Correlation model: non-BTC assets drop at ~50% of BTC drawdown. Runway includes liquid
					reserve. Survival threshold: 18+ months runway.
				</p>
			</CardContent>
		</Card>
	);
}
