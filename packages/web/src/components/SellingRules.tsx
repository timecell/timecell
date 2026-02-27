import { useMemo } from "react";
import { calculateSellingRules } from "@timecell/engine";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SellingRulesProps {
	temperatureScore: number;
	btcPercentage: number;
	totalValueUsd: number;
	btcPriceUsd: number;
	currencySymbol?: string;
	currencyRate?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(usd: number, symbol: string, rate: number): string {
	const converted = usd * rate;
	if (converted >= 1_000_000) return `${symbol}${(converted / 1_000_000).toFixed(2)}M`;
	if (converted >= 1_000) return `${symbol}${(converted / 1_000).toFixed(1)}k`;
	return `${symbol}${Math.round(converted).toLocaleString()}`;
}

function formatBtc(btc: number): string {
	if (btc >= 1) return `${btc.toFixed(4)} BTC`;
	if (btc >= 0.01) return `${btc.toFixed(4)} BTC`;
	return `${btc.toFixed(6)} BTC`;
}

// Colour scheme per tier — escalates from amber → orange → red
const TIER_COLORS = [
	{ triggered: "border-amber-500/50 bg-amber-950/20", dot: "bg-amber-400", text: "text-amber-300", label: "text-amber-400" },
	{ triggered: "border-amber-500/50 bg-amber-950/20", dot: "bg-amber-400", text: "text-amber-300", label: "text-amber-400" },
	{ triggered: "border-orange-500/50 bg-orange-950/20", dot: "bg-orange-400 animate-pulse", text: "text-orange-300", label: "text-orange-400" },
	{ triggered: "border-orange-500/50 bg-orange-950/20", dot: "bg-orange-400 animate-pulse", text: "text-orange-300", label: "text-orange-400" },
	{ triggered: "border-red-500/50 bg-red-950/20", dot: "bg-red-400 animate-pulse", text: "text-red-300", label: "text-red-400" },
	{ triggered: "border-red-500/50 bg-red-950/20", dot: "bg-red-400 animate-pulse", text: "text-red-300", label: "text-red-400" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SellingRules({
	temperatureScore,
	btcPercentage,
	totalValueUsd,
	btcPriceUsd,
	currencySymbol = "$",
	currencyRate = 1,
}: SellingRulesProps) {
	// Derive total BTC value from portfolio percentage
	const totalBtcValueUsd = (btcPercentage / 100) * totalValueUsd;

	const result = useMemo(
		() =>
			calculateSellingRules({
				temperatureScore,
				btcPercentage,
				totalBtcValueUsd,
				btcPriceUsd,
			}),
		[temperatureScore, btcPercentage, totalBtcValueUsd, btcPriceUsd],
	);

	const { schedule, currentlyTriggered } = result;

	// Total USD that SHOULD have been sold based on currently triggered tiers
	const shouldHaveSoldUsd = currentlyTriggered.reduce((s, t) => s + t.sellAmountUsd, 0);
	const shouldHaveSoldBtc = currentlyTriggered.reduce((s, t) => s + t.sellBtc, 0);

	// Progress bar: how far up the ladder current temperature is (0-100%)
	// Min threshold = 70, max = 95 → progress within that range
	const LADDER_MIN = 70;
	const LADDER_MAX = 95;
	const tempProgress =
		temperatureScore < LADDER_MIN
			? 0
			: temperatureScore >= LADDER_MAX
				? 100
				: Math.round(((temperatureScore - LADDER_MIN) / (LADDER_MAX - LADDER_MIN)) * 100);

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				{/* Header */}
				<div className="flex items-start justify-between mb-1">
					<div>
						<h3 className="text-base sm:text-lg font-semibold text-white">
							Selling Rules
						</h3>
						<p className="text-xs text-slate-400 mt-0.5">
							Framework Part 5 — Temperature-based de-accumulation ladder
						</p>
					</div>
					{currentlyTriggered.length > 0 && (
						<div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
							<span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
							<span className="text-xs font-medium text-amber-400">
								{currentlyTriggered.length} triggered
							</span>
						</div>
					)}
				</div>

				{/* Temperature progress bar */}
				<div className="mt-3 mb-4">
					<div className="flex items-center justify-between mb-1">
						<span className="text-xs text-slate-500">Temp {temperatureScore}</span>
						<span className="text-xs text-slate-500">Selling ladder position</span>
					</div>
					<div className="relative h-2 rounded-full bg-slate-700 overflow-hidden">
						<div
							className={`h-full rounded-full transition-all duration-500 ${
								temperatureScore >= 90
									? "bg-red-500"
									: temperatureScore >= 80
										? "bg-orange-500"
										: temperatureScore >= 70
											? "bg-amber-500"
											: "bg-slate-600"
							}`}
							style={{ width: `${tempProgress}%` }}
						/>
					</div>
					<div className="flex justify-between mt-0.5">
						<span className="text-[10px] text-slate-600">70 (start)</span>
						<span className="text-[10px] text-slate-600">95 (blow-off)</span>
					</div>
				</div>

				{/* Summary callout — only when tiers triggered */}
				{currentlyTriggered.length > 0 ? (
					<div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/10 px-3 py-2.5">
						<p className="text-sm text-amber-300 leading-snug">
							At temperature <span className="font-semibold">{temperatureScore}</span>:{" "}
							<span className="font-semibold">{formatBtc(shouldHaveSoldBtc)}</span>{" "}
							({formatCurrency(shouldHaveSoldUsd, currencySymbol, currencyRate)}) should have been sold.
						</p>
					</div>
				) : (
					<div className="mb-4 rounded-lg border border-slate-700/50 bg-slate-900/30 px-3 py-2.5">
						<p className="text-sm text-slate-400">
							Temperature below 70 — no selling triggered yet. Ladder activates at 70.
						</p>
					</div>
				)}

				{/* Selling ladder */}
				<div className="space-y-2">
					{schedule.map((tier, index) => {
						const colors = TIER_COLORS[index] ?? TIER_COLORS[TIER_COLORS.length - 1];
						const isTriggered = tier.triggered;

						return (
							<div
								key={tier.temperatureThreshold}
								className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all duration-300 ${
									isTriggered
										? colors.triggered
										: "border-slate-700/50 bg-slate-900/30 opacity-50"
								}`}
							>
								{/* Status dot */}
								<div className="flex-shrink-0">
									{isTriggered ? (
										<span className={`block w-2.5 h-2.5 rounded-full ${colors.dot}`} />
									) : (
										<span className="block w-2.5 h-2.5 rounded-full border border-slate-600" />
									)}
								</div>

								{/* Threshold badge */}
								<div className="flex-shrink-0 w-8 text-center">
									<span
										className={`text-xs font-mono font-semibold ${
											isTriggered ? colors.label : "text-slate-600"
										}`}
									>
										{tier.temperatureThreshold}
									</span>
								</div>

								{/* Label + action */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span
											className={`text-sm font-medium truncate ${
												isTriggered ? colors.text : "text-slate-500"
											}`}
										>
											{tier.label}
										</span>
										{isTriggered && (
											<span className={`text-xs px-1.5 py-0.5 rounded ${colors.label} bg-current/10`}>
												SELL
											</span>
										)}
									</div>
									<p
										className={`text-xs mt-0.5 ${
											isTriggered ? "text-slate-400" : "text-slate-600"
										}`}
									>
										{tier.action}
									</p>
								</div>

								{/* Sell amounts */}
								{totalBtcValueUsd > 0 ? (
									<div className="flex-shrink-0 text-right">
										<p
											className={`text-sm font-semibold tabular-nums ${
												isTriggered ? colors.text : "text-slate-600"
											}`}
										>
											{formatCurrency(tier.sellAmountUsd, currencySymbol, currencyRate)}
										</p>
										<p
											className={`text-xs tabular-nums ${
												isTriggered ? "text-slate-400" : "text-slate-700"
											}`}
										>
											{formatBtc(tier.sellBtc)}
										</p>
									</div>
								) : (
									<div className="flex-shrink-0 text-right">
										<p className="text-xs text-slate-600">{tier.sellPct}% of position</p>
									</div>
								)}

								{/* Remaining indicator */}
								<div className="flex-shrink-0 w-10 text-right">
									<span className={`text-[10px] tabular-nums ${isTriggered ? "text-slate-500" : "text-slate-700"}`}>
										{tier.remainingBtcPct}%<br />
										<span className="text-[9px]">left</span>
									</span>
								</div>
							</div>
						);
					})}
				</div>

				{/* Footer note */}
				<p className="text-xs text-slate-600 mt-4 pt-3 border-t border-slate-700/50 leading-relaxed">
					Each tier sells an additional slice of your original BTC position as temperature escalates.
					Amounts update live as your portfolio and BTC price change.
				</p>
			</CardContent>
		</Card>
	);
}
