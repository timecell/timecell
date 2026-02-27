// =============================================================================
// DCA Calculator — Framework Part 4
// =============================================================================
// Dollar Cost Averaging simulator with temperature-aware buying strategy.
// Shows cumulative invested vs cumulative value over time using a
// deterministic 4-year cycle price model.

import { useMemo, useState } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { calculateDCA, calculateTemperatureAdjustedDCA } from "@timecell/engine";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DCACalculatorProps {
	currentBtcPrice: number;
	temperatureScore: number;
	currencySymbol?: string;
	currencyRate?: number;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatCurrency(value: number, symbol: string, rate: number): string {
	const converted = value * rate;
	if (converted >= 1_000_000) return `${symbol}${(converted / 1_000_000).toFixed(1)}M`;
	if (converted >= 1_000) return `${symbol}${(converted / 1_000).toFixed(0)}K`;
	return `${symbol}${Math.round(converted).toLocaleString()}`;
}

function formatBtc(value: number): string {
	if (value >= 1) return `${value.toFixed(3)} BTC`;
	return `${(value * 1000).toFixed(2)} mBTC`;
}

function formatPct(value: number): string {
	return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Temperature zone helpers
// ---------------------------------------------------------------------------

function temperatureLabel(score: number): string {
	if (score < 30) return "Extreme Fear / Fear";
	if (score < 60) return "Neutral";
	if (score < 80) return "Greed";
	return "Extreme Greed";
}

function temperatureMultiplierLabel(score: number): string {
	if (score < 30) return "2× monthly amount";
	if (score < 60) return "1× monthly amount";
	if (score < 80) return "0.5× monthly amount";
	return "0× — paused";
}

function temperatureTextClass(score: number): string {
	if (score < 30) return "text-blue-400";
	if (score < 60) return "text-yellow-400";
	if (score < 80) return "text-orange-400";
	return "text-red-400";
}

// ---------------------------------------------------------------------------
// Chart tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
	name: string;
	value: number;
	color: string;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: TooltipPayloadEntry[];
	label?: string | number;
	symbol: string;
	rate: number;
}

function CustomTooltip({ active, payload, label, symbol, rate }: CustomTooltipProps) {
	if (!active || !payload || !payload.length) return null;
	return (
		<div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-xl">
			<p className="text-slate-400 mb-1.5">Month {label}</p>
			{payload.map((entry) => (
				<div key={entry.name} className="flex items-center gap-2 leading-5">
					<span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
					<span className="text-slate-300">{entry.name}:</span>
					<span className="font-mono text-white">{formatCurrency(entry.value, symbol, rate)}</span>
				</div>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
	label,
	value,
	sub,
	highlight,
}: {
	label: string;
	value: string;
	sub?: string;
	highlight?: boolean;
}) {
	return (
		<div
			className={`rounded-lg border px-3 py-2.5 ${
				highlight
					? "border-orange-500/40 bg-orange-500/10"
					: "border-slate-700/60 bg-slate-900/50"
			}`}
		>
			<p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
			<p
				className={`text-base font-bold tabular-nums ${
					highlight ? "text-orange-400" : "text-slate-200"
				}`}
			>
				{value}
			</p>
			{sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DCACalculator({
	currentBtcPrice,
	temperatureScore,
	currencySymbol = "$",
	currencyRate = 1,
}: DCACalculatorProps) {
	const [monthlyAmount, setMonthlyAmount] = useState(500);
	const [months, setMonths] = useState(48);
	const [mode, setMode] = useState<"flat" | "temperature">("flat");

	// Calculate both strategies
	const flatResult = useMemo(
		() =>
			calculateDCA({
				monthlyAmount,
				months,
				currentBtcPrice: currentBtcPrice > 0 ? currentBtcPrice : 100_000,
			}),
		[monthlyAmount, months, currentBtcPrice],
	);

	const adjustedResult = useMemo(
		() =>
			calculateTemperatureAdjustedDCA(
				{
					monthlyAmount,
					months,
					currentBtcPrice: currentBtcPrice > 0 ? currentBtcPrice : 100_000,
				},
				temperatureScore,
			),
		[monthlyAmount, months, currentBtcPrice, temperatureScore],
	);

	const activeResult = mode === "flat" ? flatResult : adjustedResult;

	// Performance delta — only meaningful when comparing both modes
	const returnDelta = adjustedResult.returnPct - flatResult.returnPct;

	// Build chart data — subsample to keep chart readable (max 60 points)
	const chartData = useMemo(() => {
		const schedule = activeResult.schedule;
		const step = Math.max(1, Math.floor(schedule.length / 60));
		return schedule
			.filter((_, i) => i % step === 0 || i === schedule.length - 1)
			.map((row) => ({
				month: row.month,
				"Invested": row.invested,
				"Portfolio Value": row.totalValue,
			}));
	}, [activeResult.schedule]);

	const returnPositive = activeResult.returnPct >= 0;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6 space-y-5">
				{/* Header */}
				<div>
					<h3 className="text-base sm:text-lg font-semibold text-white mb-1">
						DCA Calculator
					</h3>
					<p className="text-xs text-slate-400">
						Simulate dollar cost averaging with a deterministic 4-year Bitcoin cycle model.
					</p>
				</div>

				{/* Controls */}
				<div className="space-y-4">
					{/* Monthly amount slider */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="text-sm text-slate-300">Monthly Amount</label>
							<span className="text-sm font-mono text-white tabular-nums">
								{formatCurrency(monthlyAmount, currencySymbol, currencyRate)}/mo
							</span>
						</div>
						<Slider
							min={100}
							max={50000}
							step={100}
							value={[monthlyAmount]}
							onValueChange={(vals) => setMonthlyAmount(vals[0])}
						/>
						<div className="flex justify-between mt-1">
							<span className="text-xs text-slate-600">
								{formatCurrency(100, currencySymbol, currencyRate)}
							</span>
							<span className="text-xs text-slate-600">
								{formatCurrency(50000, currencySymbol, currencyRate)}
							</span>
						</div>
					</div>

					{/* Duration slider */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="text-sm text-slate-300">Duration</label>
							<span className="text-sm font-mono text-white tabular-nums">
								{months} months
								<span className="text-slate-500 ml-1">
									({(months / 12).toFixed(1)} yr)
								</span>
							</span>
						</div>
						<Slider
							min={6}
							max={120}
							step={6}
							value={[months]}
							onValueChange={(vals) => setMonths(vals[0])}
						/>
						<div className="flex justify-between mt-1">
							<span className="text-xs text-slate-600">6 mo</span>
							<span className="text-xs text-slate-600">10 yr</span>
						</div>
					</div>

					{/* Mode toggle */}
					<div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/50 p-1">
						<button
							type="button"
							onClick={() => setMode("flat")}
							className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors touch-manipulation ${
								mode === "flat"
									? "bg-slate-700 text-white"
									: "text-slate-400 hover:text-slate-200"
							}`}
						>
							Flat DCA
						</button>
						<button
							type="button"
							onClick={() => setMode("temperature")}
							className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors touch-manipulation ${
								mode === "temperature"
									? "bg-orange-500/30 text-orange-300 border border-orange-500/40"
									: "text-slate-400 hover:text-slate-200"
							}`}
						>
							Temperature-Adjusted
						</button>
					</div>

					{/* Temperature context (only in adjusted mode) */}
					{mode === "temperature" && (
						<div className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2.5">
							<div className="flex items-center justify-between text-xs">
								<span className="text-slate-400">Current temperature</span>
								<span className={`font-semibold ${temperatureTextClass(temperatureScore)}`}>
									{temperatureScore} — {temperatureLabel(temperatureScore)}
								</span>
							</div>
							<div className="flex items-center justify-between text-xs mt-1">
								<span className="text-slate-500">Starting buy rate</span>
								<span className="text-slate-300 font-mono">
									{temperatureMultiplierLabel(temperatureScore)}
								</span>
							</div>
							<p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
								Strategy oscillates with the 4-year cycle — buys 2× in fear phases, pauses in extreme greed.
							</p>
						</div>
					)}
				</div>

				{/* Chart */}
				<div className="h-44 sm:h-52 -mx-1">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
							<XAxis
								dataKey="month"
								tick={{ fill: "#64748b", fontSize: 10 }}
								tickLine={false}
								axisLine={false}
								tickFormatter={(v) => `${v}m`}
							/>
							<YAxis
								tick={{ fill: "#64748b", fontSize: 10 }}
								tickLine={false}
								axisLine={false}
								width={44}
								tickFormatter={(v) => {
									const c = v * currencyRate;
									if (c >= 1_000_000) return `${currencySymbol}${(c / 1_000_000).toFixed(0)}M`;
									if (c >= 1_000) return `${currencySymbol}${(c / 1_000).toFixed(0)}K`;
									return `${currencySymbol}${c.toFixed(0)}`;
								}}
							/>
							<Tooltip
								content={
									<CustomTooltip symbol={currencySymbol} rate={currencyRate} />
								}
							/>
							<Legend
								wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
								iconType="circle"
								iconSize={8}
							/>
							<Line
								type="monotone"
								dataKey="Invested"
								stroke="#475569"
								strokeWidth={1.5}
								dot={false}
								strokeDasharray="4 3"
							/>
							<Line
								type="monotone"
								dataKey="Portfolio Value"
								stroke={returnPositive ? "#f97316" : "#ef4444"}
								strokeWidth={2}
								dot={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>

				{/* Stats grid */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
					<StatCard
						label="Total Invested"
						value={formatCurrency(activeResult.totalInvested, currencySymbol, currencyRate)}
					/>
					<StatCard
						label="Total BTC"
						value={formatBtc(activeResult.totalBtcAccumulated)}
					/>
					<StatCard
						label="Avg Cost Basis"
						value={formatCurrency(activeResult.averageCostBasis, "$", 1)}
						sub="per BTC"
					/>
					<StatCard
						label="Return"
						value={formatPct(activeResult.returnPct)}
						highlight={returnPositive}
					/>
				</div>

				{/* Temperature-adjusted comparison (only when in adjusted mode) */}
				{mode === "temperature" && (
					<div
						className={`rounded-lg border px-3 py-2.5 ${
							returnDelta >= 0
								? "border-green-500/30 bg-green-900/10"
								: "border-red-500/30 bg-red-900/10"
						}`}
					>
						<div className="flex items-center justify-between gap-2">
							<p className="text-xs text-slate-400">vs Flat DCA return</p>
							<span
								className={`text-sm font-bold tabular-nums ${
									returnDelta >= 0 ? "text-green-400" : "text-red-400"
								}`}
							>
								{returnDelta >= 0 ? "+" : ""}
								{returnDelta.toFixed(1)}pp
							</span>
						</div>
						<p className="text-xs text-slate-500 mt-1">
							{returnDelta >= 0
								? "Temperature-adjusted DCA outperforms flat DCA in this cycle scenario."
								: "Flat DCA outperforms in this scenario — cycle timing varies by starting temperature."}
						</p>
					</div>
				)}

				{/* Framework note */}
				<p className="text-xs text-slate-600 leading-relaxed">
					Price model: 4-year halving cycle (sinusoidal). {months < 48 ? "Run 48+ months to see full cycle." : ""}
				</p>
			</CardContent>
		</Card>
	);
}
