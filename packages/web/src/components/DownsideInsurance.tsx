import { useMemo, useState } from "react";
import { calculateDownsideInsurance } from "@timecell/engine";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number, decimals = 0): string {
	if (!Number.isFinite(n)) return "\u221e";
	return n.toLocaleString("en-US", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

function fmtUsd(n: number, symbol = "$", rate = 1): string {
	const converted = n * rate;
	const abs = Math.abs(converted);
	if (abs >= 1_000_000) return `${symbol}${(converted / 1_000_000).toFixed(2)}M`;
	if (abs >= 1_000) return `${symbol}${(converted / 1_000).toFixed(1)}K`;
	return `${symbol}${fmt(converted)}`;
}

type TrafficLight = "green" | "amber" | "red";

function annualizedCostLight(pct: number): TrafficLight {
	if (pct < 3) return "green";
	if (pct <= 5) return "amber";
	return "red";
}

const trafficLightStyles: Record<
	TrafficLight,
	{ dot: string; text: string; border: string; bg: string; label: string }
> = {
	green: {
		dot: "bg-emerald-400",
		text: "text-emerald-400",
		border: "border-emerald-500/30",
		bg: "bg-emerald-500/10",
		label: "Efficient",
	},
	amber: {
		dot: "bg-amber-400",
		text: "text-amber-400",
		border: "border-amber-500/30",
		bg: "bg-amber-500/10",
		label: "Moderate",
	},
	red: {
		dot: "bg-red-400",
		text: "text-red-400",
		border: "border-red-500/30",
		bg: "bg-red-500/10",
		label: "Expensive",
	},
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LabeledSlider({
	label,
	hint,
	value,
	min,
	max,
	step,
	onChange,
	display,
}: {
	label: string;
	hint?: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (v: number) => void;
	display: string;
}) {
	return (
		<div className="space-y-1.5">
			<div className="flex justify-between items-center">
				<div>
					<span className="text-xs text-slate-400">{label}</span>
					{hint && <span className="text-xs text-slate-600 ml-1.5">{hint}</span>}
				</div>
				<span className="text-sm font-mono font-semibold text-orange-400">{display}</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full h-1.5 rounded-full accent-orange-500 bg-slate-700 cursor-pointer"
			/>
			<div className="flex justify-between text-xs text-slate-600">
				<span>{min}{label.includes("Strike") ? "%" : "%"}</span>
				<span>{max}%</span>
			</div>
		</div>
	);
}

// Horizontal bar showing two columns (with vs without) as proportional widths
function ComparisonBar({
	withInsurance,
	without,
	symbol,
	rate,
}: {
	withInsurance: number;
	without: number;
	symbol: string;
	rate: number;
}) {
	const max = Math.max(withInsurance, without, 1);
	const withPct = (withInsurance / max) * 100;
	const withoutPct = (without / max) * 100;

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-3">
				<span className="text-xs text-slate-500 w-20 shrink-0 text-right">With hedge</span>
				<div className="flex-1 h-5 rounded bg-slate-800 overflow-hidden">
					<div
						className="h-full bg-emerald-500/70 rounded transition-all duration-500"
						style={{ width: `${withPct}%` }}
					/>
				</div>
				<span className="text-xs font-mono text-emerald-400 w-20 shrink-0">
					{fmtUsd(withInsurance, symbol, rate)}
				</span>
			</div>
			<div className="flex items-center gap-3">
				<span className="text-xs text-slate-500 w-20 shrink-0 text-right">No hedge</span>
				<div className="flex-1 h-5 rounded bg-slate-800 overflow-hidden">
					<div
						className="h-full bg-red-500/70 rounded transition-all duration-500"
						style={{ width: `${withoutPct}%` }}
					/>
				</div>
				<span className="text-xs font-mono text-red-400 w-20 shrink-0">
					{fmtUsd(without, symbol, rate)}
				</span>
			</div>
		</div>
	);
}

// Payoff chart: bars per drawdown scenario
function PayoffChart({
	scenarios,
	premium,
	symbol,
	rate,
}: {
	scenarios: Array<{ drawdownPct: number; payoffUsd: number; netGainUsd: number }>;
	premium: number;
	symbol: string;
	rate: number;
}) {
	const maxPayoff = Math.max(...scenarios.map((s) => s.payoffUsd), premium, 1);

	return (
		<div className="space-y-2">
			{/* Premium cost reference line label */}
			<div className="flex justify-between text-xs text-slate-500 mb-1">
				<span>Hedge payoff at each drawdown</span>
				<span>Cost: {fmtUsd(premium, symbol, rate)}</span>
			</div>

			{scenarios.map((s) => {
				const barPct = (s.payoffUsd / maxPayoff) * 100;
				const costPct = (premium / maxPayoff) * 100;
				const isProfit = s.netGainUsd >= 0;

				return (
					<div key={s.drawdownPct} className="flex items-center gap-3">
						<span className="text-xs text-slate-400 w-8 shrink-0 text-right">
							-{s.drawdownPct}%
						</span>
						<div className="flex-1 relative h-6 bg-slate-800 rounded overflow-hidden">
							{/* Payoff bar */}
							<div
								className={`h-full rounded transition-all duration-500 ${
									isProfit ? "bg-emerald-500/60" : "bg-slate-600/60"
								}`}
								style={{ width: `${barPct}%` }}
							/>
							{/* Cost line */}
							<div
								className="absolute top-0 h-full w-px bg-orange-400/50"
								style={{ left: `${costPct}%` }}
							/>
						</div>
						<span
							className={`text-xs font-mono w-20 shrink-0 ${
								isProfit ? "text-emerald-400" : "text-slate-500"
							}`}
						>
							{fmtUsd(s.payoffUsd, symbol, rate)}
						</span>
					</div>
				);
			})}

			{/* Legend */}
			<div className="flex gap-4 pt-1 text-xs text-slate-600">
				<span className="flex items-center gap-1.5">
					<span className="inline-block w-3 h-0.5 bg-orange-400/50" />
					Premium cost
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/60" />
					Profitable
				</span>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DownsideInsuranceProps {
	totalBtcValueUsd: number;
	btcPriceUsd: number;
	currencySymbol?: string;
	currencyRate?: number;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const EXPIRY_OPTIONS = [3, 6, 12] as const;

export function DownsideInsurance({
	totalBtcValueUsd,
	btcPriceUsd,
	currencySymbol = "$",
	currencyRate = 1,
}: DownsideInsuranceProps) {
	const [hedgeBudgetPct, setHedgeBudgetPct] = useState(2);
	const [putStrikePct, setPutStrikePct] = useState(70);
	const [putCostPct, setPutCostPct] = useState(3);
	const [expiryMonths, setExpiryMonths] = useState<(typeof EXPIRY_OPTIONS)[number]>(6);

	const result = useMemo(
		() =>
			calculateDownsideInsurance({
				totalBtcValueUsd: Math.max(totalBtcValueUsd, 1),
				btcPriceUsd: Math.max(btcPriceUsd, 1),
				hedgeBudgetPct,
				putStrikePct,
				putCostPct,
				expiryMonths,
			}),
		[totalBtcValueUsd, btcPriceUsd, hedgeBudgetPct, putStrikePct, putCostPct, expiryMonths],
	);

	const light = annualizedCostLight(result.annualizedCostPct);
	const lightStyles = trafficLightStyles[light];

	// OTM label: how far out of the money the strike is
	const otmPct = 100 - putStrikePct;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6 space-y-6">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h3 className="text-base sm:text-lg font-semibold text-white mb-0.5">
							Downside Insurance
						</h3>
						<p className="text-xs text-slate-400">
							Put option budget and break-even calculator — Framework Part 6
						</p>
					</div>
					{/* Traffic light: annualized cost */}
					<div
						className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${lightStyles.border} ${lightStyles.bg} flex-shrink-0`}
					>
						<span className={`w-2 h-2 rounded-full ${lightStyles.dot}`} />
						<span className={`text-xs font-medium ${lightStyles.text}`}>
							{result.annualizedCostPct.toFixed(1)}%/yr — {lightStyles.label}
						</span>
					</div>
				</div>

				{/* Sliders */}
				<div className="space-y-5">
					<LabeledSlider
						label="Hedge budget"
						hint="% of BTC value spent on puts"
						value={hedgeBudgetPct}
						min={1}
						max={10}
						step={0.5}
						onChange={setHedgeBudgetPct}
						display={`${hedgeBudgetPct}%`}
					/>

					<LabeledSlider
						label="Put strike"
						hint={`${otmPct}% OTM — below this you collect`}
						value={putStrikePct}
						min={50}
						max={90}
						step={5}
						onChange={setPutStrikePct}
						display={`${putStrikePct}% (${fmtUsd(result.putStrikePrice, "$", 1)})`}
					/>

					<LabeledSlider
						label="Put premium"
						hint="% of notional protected"
						value={putCostPct}
						min={1}
						max={10}
						step={0.5}
						onChange={setPutCostPct}
						display={`${putCostPct}%`}
					/>
				</div>

				{/* Expiry selector */}
				<div className="space-y-2">
					<span className="text-xs text-slate-400">Expiry</span>
					<div className="flex gap-2">
						{EXPIRY_OPTIONS.map((m) => (
							<button
								key={m}
								type="button"
								onClick={() => setExpiryMonths(m)}
								className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
									expiryMonths === m
										? "bg-orange-500/20 border-orange-500/50 text-orange-400"
										: "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400"
								}`}
							>
								{m}mo
							</button>
						))}
					</div>
				</div>

				{/* Summary sentences */}
				<div className="rounded-xl bg-slate-900/60 border border-slate-700/60 px-4 py-4 space-y-2.5">
					<p className="text-sm text-slate-200 leading-relaxed">
						Your insurance costs{" "}
						<span className="font-semibold text-orange-400">
							{fmtUsd(result.costPerMonth, currencySymbol, currencyRate)}/month
						</span>{" "}
						to protect{" "}
						<span className="font-semibold text-white">
							{fmtUsd(result.notionalProtected, currencySymbol, currencyRate)}
						</span>{" "}
						of BTC.
					</p>
					<p className="text-sm text-slate-200 leading-relaxed">
						In an 80% crash, your hedge pays{" "}
						<span className="font-semibold text-emerald-400">
							{fmtUsd(result.payoffAt80pctCrash, currencySymbol, currencyRate)}
						</span>{" "}
						<span className="text-xs text-slate-400">
							(ROI: {result.hedgeROI > 0 ? "+" : ""}
							{fmt(result.hedgeROI * 100, 0)}%)
						</span>
						.
					</p>
					<p className="text-sm text-slate-200 leading-relaxed">
						Break-even:{" "}
						<span className="font-semibold text-amber-400">
							{result.breakEvenDrawdown > 0
								? `hedge pays for itself at a ${fmt(result.breakEvenDrawdown, 0)}% drop`
								: "put is already in the money"}
						</span>
						.
					</p>
				</div>

				{/* Payoff chart */}
				<div className="space-y-2">
					<p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
						Hedge Payoff by Crash Scenario
					</p>
					<PayoffChart
						scenarios={result.payoffScenarios}
						premium={result.putPremiumUsd}
						symbol={currencySymbol}
						rate={currencyRate}
					/>
				</div>

				{/* Max loss comparison */}
				<div className="space-y-2">
					<p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
						Max Portfolio Loss: With vs Without Insurance
					</p>
					<ComparisonBar
						withInsurance={result.maxLossWithInsurance}
						without={result.maxLossWithout}
						symbol={currencySymbol}
						rate={currencyRate}
					/>
					<p className="text-xs text-slate-600 mt-1">
						Protection = {fmtUsd(result.maxLossWithout - result.maxLossWithInsurance, currencySymbol, currencyRate)} reduction in maximum possible loss
					</p>
				</div>

				{/* Cost metrics */}
				<div className="grid grid-cols-3 gap-3">
					<div className="rounded-lg bg-slate-900/60 px-3 py-2.5 border border-slate-700/60">
						<p className="text-xs text-slate-500">Budget</p>
						<p className="text-base font-bold font-mono text-white mt-0.5">
							{fmtUsd(result.hedgeBudgetUsd, currencySymbol, currencyRate)}
						</p>
						<p className="text-xs text-slate-500 mt-0.5">{hedgeBudgetPct}% of BTC</p>
					</div>
					<div className="rounded-lg bg-slate-900/60 px-3 py-2.5 border border-slate-700/60">
						<p className="text-xs text-slate-500">Monthly cost</p>
						<p className="text-base font-bold font-mono text-white mt-0.5">
							{fmtUsd(result.costPerMonth, currencySymbol, currencyRate)}
						</p>
						<p className="text-xs text-slate-500 mt-0.5">{expiryMonths}mo expiry</p>
					</div>
					<div className="rounded-lg bg-slate-900/60 px-3 py-2.5 border border-slate-700/60">
						<p className="text-xs text-slate-500">Annualized</p>
						<p
							className={`text-base font-bold font-mono mt-0.5 ${lightStyles.text}`}
						>
							{result.annualizedCostPct.toFixed(1)}%
						</p>
						<p className="text-xs text-slate-500 mt-0.5">of BTC value/yr</p>
					</div>
				</div>

				{/* Framework note */}
				<div className="rounded-lg border border-slate-700/40 bg-slate-900/30 px-4 py-3">
					<p className="text-xs text-slate-500 leading-relaxed">
						<span className="text-slate-400 font-medium">Framework guideline:</span> Budget 1-3%
						annually for protective puts. Required for Rung 6 (50%+ BTC), recommended for Rung 5
						(25-50%). The goal is NOT profit — it{"'"}s preventing forced selling during crashes.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
