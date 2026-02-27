import { useState, useMemo } from "react";
import { calculateCrashSurvival } from "@timecell/engine";
import type { PortfolioInput } from "../hooks/usePortfolio";
import { Slider } from "@/components/ui/slider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatIfProps {
	currentPortfolio: PortfolioInput;
	currencySymbol?: string;
}

interface PanelResult {
	maxSurvivableDrawdown: number;
	ruinTestPassed: boolean;
	worstCaseRunway: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLabel(value: number, symbol = "$"): string {
	if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
	return `${symbol}${value.toFixed(0)}`;
}

function formatMonths(months: number): string {
	if (months === Infinity || months > 240) return "\u221e";
	if (months > 120) return "120+";
	return `${Math.round(months)}`;
}

function computeResult(portfolio: PortfolioInput): PanelResult {
	const result = calculateCrashSurvival(portfolio, []);
	const worst = result.scenarios[result.scenarios.length - 1];
	return {
		maxSurvivableDrawdown: result.maxSurvivableDrawdown,
		ruinTestPassed: result.ruinTestPassed,
		worstCaseRunway: worst?.runwayMonths ?? 0,
	};
}

function deltaSign(delta: number): "better" | "worse" | "same" {
	if (delta > 0) return "better";
	if (delta < 0) return "worse";
	return "same";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SliderField({
	label,
	value,
	onChange,
	min,
	max,
	step,
	format,
	suffix,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	min: number;
	max: number;
	step: number;
	format?: (v: number) => string;
	suffix?: string;
}) {
	return (
		<div>
			<div className="flex justify-between mb-1.5">
				<span className="text-xs text-slate-400">{label}</span>
				<span className="text-xs font-mono text-white">
					{format ? format(value) : value}
					{suffix}
				</span>
			</div>
			<Slider
				min={min}
				max={max}
				step={step}
				value={[value]}
				onValueChange={(vals) => onChange(vals[0])}
			/>
		</div>
	);
}

function StatRow({
	label,
	value,
	color,
}: {
	label: string;
	value: string;
	color: string;
}) {
	return (
		<div className="flex justify-between items-baseline">
			<span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
			<span className={`text-lg font-bold tabular-nums ${color}`}>{value}</span>
		</div>
	);
}

function RuinBadge({ passed }: { passed: boolean }) {
	return (
		<div
			className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-300 ${
				passed
					? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
					: "bg-red-500/10 border border-red-500/30 text-red-400"
			}`}
		>
			<span className="text-base">{passed ? "\u2713" : "\u2717"}</span>
			<span>Ruin Test {passed ? "PASSED" : "FAILED"}</span>
		</div>
	);
}

function DeltaChip({
	label,
	delta,
	unit,
	higherIsBetter = true,
}: {
	label: string;
	delta: number;
	unit: string;
	higherIsBetter?: boolean;
}) {
	if (delta === 0) {
		return (
			<div className="flex justify-between items-center py-1.5 border-b border-slate-700/50 last:border-0">
				<span className="text-xs text-slate-500">{label}</span>
				<span className="text-xs font-mono text-slate-500">No change</span>
			</div>
		);
	}

	const isBetter = higherIsBetter ? delta > 0 : delta < 0;
	const sign = delta > 0 ? "+" : "";
	const colorClass = isBetter ? "text-emerald-400" : "text-red-400";
	const bgClass = isBetter ? "bg-emerald-500/10" : "bg-red-500/10";

	return (
		<div className="flex justify-between items-center py-1.5 border-b border-slate-700/50 last:border-0">
			<span className="text-xs text-slate-400">{label}</span>
			<span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${colorClass} ${bgClass}`}>
				{sign}{Math.round(delta * 10) / 10}{unit}
			</span>
		</div>
	);
}

function Panel({
	title,
	portfolio,
	result,
	currencySymbol,
	isReadOnly,
	onUpdate,
}: {
	title: string;
	portfolio: PortfolioInput;
	result: PanelResult;
	currencySymbol: string;
	isReadOnly: boolean;
	onUpdate?: (updates: Partial<PortfolioInput>) => void;
}) {
	const runwayColor =
		result.worstCaseRunway >= 18
			? "text-emerald-400"
			: result.worstCaseRunway >= 6
			? "text-amber-400"
			: "text-red-400";

	const crashColor =
		result.maxSurvivableDrawdown >= 80
			? "text-emerald-400"
			: result.maxSurvivableDrawdown >= 50
			? "text-amber-400"
			: "text-red-400";

	return (
		<div className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-5 space-y-4">
			{/* Panel title */}
			<div className="flex items-center gap-2">
				<span
					className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
						isReadOnly
							? "bg-slate-700 text-slate-400"
							: "bg-blue-500/20 text-blue-400 border border-blue-500/30"
					}`}
				>
					{title}
				</span>
			</div>

			{/* Key stats */}
			<div className="space-y-2">
				<StatRow
					label="Max Survivable Crash"
					value={`${result.maxSurvivableDrawdown}%`}
					color={crashColor}
				/>
				<StatRow
					label="Worst-Case Runway"
					value={`${formatMonths(result.worstCaseRunway)} mo`}
					color={runwayColor}
				/>
				<RuinBadge passed={result.ruinTestPassed} />
			</div>

			{/* Sliders — only for proposed panel */}
			{!isReadOnly && onUpdate && (
				<div className="space-y-3 pt-1 border-t border-slate-700/50">
					<p className="text-xs text-slate-500 uppercase tracking-wider pt-1">Adjust to explore</p>
					<SliderField
						label="Bitcoin Allocation"
						value={portfolio.btcPercentage}
						onChange={(v) => onUpdate({ btcPercentage: v })}
						min={0}
						max={100}
						step={1}
						suffix="%"
					/>
					<SliderField
						label="Total Value"
						value={portfolio.totalValueUsd}
						onChange={(v) => onUpdate({ totalValueUsd: v })}
						min={100_000}
						max={50_000_000}
						step={100_000}
						format={(v) => formatLabel(v, currencySymbol)}
					/>
					<SliderField
						label="Liquid Reserve"
						value={portfolio.liquidReserveUsd}
						onChange={(v) => onUpdate({ liquidReserveUsd: v })}
						min={0}
						max={5_000_000}
						step={10_000}
						format={(v) => formatLabel(v, currencySymbol)}
					/>
					<SliderField
						label="Monthly Burn"
						value={portfolio.monthlyBurnUsd}
						onChange={(v) => onUpdate({ monthlyBurnUsd: v })}
						min={0}
						max={500_000}
						step={1_000}
						format={(v) => formatLabel(v, currencySymbol)}
					/>
				</div>
			)}

			{/* Read-only summary for current panel */}
			{isReadOnly && (
				<div className="space-y-1.5 pt-1 border-t border-slate-700/50">
					<p className="text-xs text-slate-500 uppercase tracking-wider pt-1">Your portfolio</p>
					<div className="flex justify-between text-xs">
						<span className="text-slate-500">BTC Allocation</span>
						<span className="text-slate-300 font-mono">{portfolio.btcPercentage}%</span>
					</div>
					<div className="flex justify-between text-xs">
						<span className="text-slate-500">Total Value</span>
						<span className="text-slate-300 font-mono">{formatLabel(portfolio.totalValueUsd, currencySymbol)}</span>
					</div>
					<div className="flex justify-between text-xs">
						<span className="text-slate-500">Liquid Reserve</span>
						<span className="text-slate-300 font-mono">{formatLabel(portfolio.liquidReserveUsd, currencySymbol)}</span>
					</div>
					<div className="flex justify-between text-xs">
						<span className="text-slate-500">Monthly Burn</span>
						<span className="text-slate-300 font-mono">{formatLabel(portfolio.monthlyBurnUsd, currencySymbol)}</span>
					</div>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main WhatIfComparison component
// ---------------------------------------------------------------------------

export function WhatIfComparison({ currentPortfolio, currencySymbol = "$" }: WhatIfProps) {
	const [proposed, setProposed] = useState<PortfolioInput>({ ...currentPortfolio });

	const handleUpdate = (updates: Partial<PortfolioInput>) => {
		setProposed((prev) => ({ ...prev, ...updates }));
	};

	const currentResult = useMemo(() => computeResult(currentPortfolio), [currentPortfolio]);
	const proposedResult = useMemo(() => computeResult(proposed), [proposed]);

	// Deltas: positive = proposed is numerically higher
	const drawdownDelta = proposedResult.maxSurvivableDrawdown - currentResult.maxSurvivableDrawdown;
	const runwayDelta =
		proposedResult.worstCaseRunway === Infinity && currentResult.worstCaseRunway === Infinity
			? 0
			: proposedResult.worstCaseRunway === Infinity
			? 999
			: currentResult.worstCaseRunway === Infinity
			? -999
			: proposedResult.worstCaseRunway - currentResult.worstCaseRunway;
	const ruinDelta = (proposedResult.ruinTestPassed ? 1 : 0) - (currentResult.ruinTestPassed ? 1 : 0);

	// Overall signal: is proposed strictly better?
	const overallBetter = drawdownDelta > 0 || runwayDelta > 0 || ruinDelta > 0;
	const overallWorse = drawdownDelta < 0 || runwayDelta < 0 || ruinDelta < 0;
	const overallSame = !overallBetter && !overallWorse;

	return (
		<div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 sm:p-6 space-y-4">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<div>
					<h2 className="text-base sm:text-lg font-bold text-white">What If Mode</h2>
					<p className="text-xs text-slate-500 mt-0.5">
						Compare your current allocation vs a proposed change — side by side.
					</p>
				</div>
				{/* Overall signal badge */}
				<div
					className={`self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-300 ${
						overallSame
							? "bg-slate-700/50 border-slate-600 text-slate-400"
							: overallBetter
							? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
							: "bg-red-500/10 border-red-500/30 text-red-400"
					}`}
				>
					{overallSame ? "No change" : overallBetter ? "\u2191 Proposed is better" : "\u2193 Proposed is worse"}
				</div>
			</div>

			{/* Side-by-side panels */}
			<div className="flex flex-col sm:flex-row gap-4">
				<Panel
					title="Current"
					portfolio={currentPortfolio}
					result={currentResult}
					currencySymbol={currencySymbol}
					isReadOnly
				/>
				<Panel
					title="Proposed"
					portfolio={proposed}
					result={proposedResult}
					currencySymbol={currencySymbol}
					isReadOnly={false}
					onUpdate={handleUpdate}
				/>
			</div>

			{/* Delta row */}
			<div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
				<p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Impact of Change</p>
				<div className="space-y-0">
					<DeltaChip
						label="Max Survivable Crash"
						delta={drawdownDelta}
						unit="pp"
						higherIsBetter
					/>
					<DeltaChip
						label="Worst-Case Runway"
						delta={runwayDelta === 999 || runwayDelta === -999 ? 0 : runwayDelta}
						unit=" months"
						higherIsBetter
					/>
					{ruinDelta !== 0 && (
						<div className="flex justify-between items-center py-1.5">
							<span className="text-xs text-slate-400">Ruin Test</span>
							<span
								className={`text-xs font-bold px-2 py-0.5 rounded ${
									ruinDelta > 0
										? "text-emerald-400 bg-emerald-500/10"
										: "text-red-400 bg-red-500/10"
								}`}
							>
								{ruinDelta > 0 ? "Now PASSES" : "Now FAILS"}
							</span>
						</div>
					)}
					{ruinDelta === 0 && (
						<div className="flex justify-between items-center py-1.5">
							<span className="text-xs text-slate-500">Ruin Test</span>
							<span className="text-xs font-mono text-slate-500">No change</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
