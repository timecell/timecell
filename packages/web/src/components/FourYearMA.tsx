import { useMemo } from "react";
import {
	ComposedChart,
	Line,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ReferenceLine,
	ResponsiveContainer,
	Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// =============================================================================
// Synthetic data generation
// =============================================================================

// Halving dates as approximate year fractions
const HALVINGS: Array<{ year: number; label: string }> = [
	{ year: 2016.54, label: "Halving Jul 2016" },
	{ year: 2020.37, label: "Halving May 2020" },
	{ year: 2024.29, label: "Halving Apr 2024" },
];

interface DataPoint {
	year: number;
	label: string;
	ma: number;
	price: number;
	// Shading bands (area fills use two values: lower bound + upper bound)
	accumZoneTop: number; // = ma (green band from 0 to ma)
	dangerZoneBottom: number; // = 2 * ma (red band from 2*ma upward, capped)
	dangerZoneCap: number; // upper visual cap for red band
}

/**
 * Generate ~144 monthly data points from Jan 2014 to Dec 2026.
 *
 * MA follows exponential growth slowing over time:
 *   MA(t) = 3000 * exp(0.45 * t)  where t = years since 2014
 *
 * Price oscillates around the MA with a roughly 4-year sinusoidal pattern,
 * peaking ~18 months after each halving and troughing ~12 months before the next.
 * Amplitude (as a multiplier above MA) shrinks each cycle, matching historical
 * diminishing returns: ~4x peak in cycle 1, ~3x in cycle 2, ~2.2x in cycle 3.
 */
function generateSyntheticData(): DataPoint[] {
	const points: DataPoint[] = [];

	const startYear = 2014;
	const endYear = 2027;
	const stepsPerYear = 12;

	// BTC all-time-high year-fraction estimates for each cycle
	// Used to shape the oscillation envelope
	const cycleATHs = [
		{ t: 2017.9, multiplier: 4.0 }, // Dec 2017
		{ t: 2021.0, multiplier: 3.0 }, // Nov 2021
		{ t: 2025.0, multiplier: 2.2 }, // ~2025 (current cycle estimate)
	];

	// MA exponential baseline: starts ~$800 in Jan 2014, ~$30K in 2021, ~$80K in 2024
	function computeMA(t: number): number {
		// Piecewise log-growth to keep numbers realistic
		const base = 800;
		const growthRate = 0.52; // annualised log-growth of the MA itself
		return base * Math.exp(growthRate * t);
	}

	// Price multiplier relative to MA — sinusoidal per cycle, amplitude decreasing
	function computeMultiplier(t: number): number {
		// Find the two nearest ATH anchors to interpolate the sine shape
		// Cycle period ≈ 4 years. Phase each cycle so peak aligns with cycleATH.
		const cycleLen = 4.0;

		// Which cycle are we in?
		let cycleIdx = 0;
		if (t >= 2019.0) cycleIdx = 1;
		if (t >= 2023.0) cycleIdx = 2;
		cycleIdx = Math.min(cycleIdx, cycleATHs.length - 1);

		const { t: peakT, multiplier: peakMul } = cycleATHs[cycleIdx];

		// Sinusoidal: minimum multiplier is 0.35 (below MA), peak is peakMul
		const minMul = 0.35;
		// Offset phase so sin=1 at peakT
		const phase = ((t - peakT) / cycleLen) * 2 * Math.PI - Math.PI / 2;
		const sinVal = Math.sin(phase); // ranges -1 to 1
		const mid = (peakMul + minMul) / 2;
		const amp = (peakMul - minMul) / 2;
		return mid + amp * sinVal;
	}

	for (let step = 0; step <= (endYear - startYear) * stepsPerYear; step++) {
		const t = startYear + step / stepsPerYear;
		if (t > endYear) break;

		const ma = computeMA(t - startYear);
		const multiplier = computeMultiplier(t);
		const price = ma * multiplier;

		// For visual cap of the danger zone band, use 3x MA or price whichever is higher
		const dangerZoneCap = Math.max(3.5 * ma, price * 1.1);

		// Label every 2 years
		const year = Math.floor(t);
		const month = Math.round((t - year) * 12);
		const isJan = month === 0 || month === 12;
		const label = isJan && year % 2 === 0 ? String(year) : "";

		points.push({
			year: t,
			label,
			ma: Math.round(ma),
			price: Math.round(Math.max(price, 100)),
			accumZoneTop: Math.round(ma),
			dangerZoneBottom: Math.round(2 * ma),
			dangerZoneCap: Math.round(dangerZoneCap),
		});
	}

	return points;
}

// =============================================================================
// Helpers
// =============================================================================

function formatPrice(value: number): string {
	if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
	return `$${value}`;
}

function getRatioMeta(ratio: number): {
	label: string;
	color: string;
	bgColor: string;
	borderColor: string;
	description: string;
} {
	if (ratio < 1.0) {
		return {
			label: "Below MA — Accumulate",
			color: "text-emerald-400",
			bgColor: "bg-emerald-500/10",
			borderColor: "border-emerald-500/30",
			description: "Price is below the 4-year moving average. Historically a high-conviction accumulation zone.",
		};
	}
	if (ratio < 2.0) {
		return {
			label: "Above MA — Caution",
			color: "text-amber-400",
			bgColor: "bg-amber-500/10",
			borderColor: "border-amber-500/30",
			description: "Price is above the MA but within normal bull territory. Reduce new buys, hold existing.",
		};
	}
	return {
		label: "Far Above MA — Extreme Caution",
		color: "text-red-400",
		bgColor: "bg-red-500/10",
		borderColor: "border-red-500/30",
		description: "Price is more than 2x the MA. Historically a high-risk zone. Consider staged de-risking.",
	};
}

// =============================================================================
// Custom tooltip
// =============================================================================

function CustomTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{ name: string; value: number; color: string }>;
	label?: number;
}) {
	if (!active || !payload?.length) return null;

	const year = label ? Math.floor(label) : 0;
	const month = label ? Math.round((label - year) * 12) : 0;
	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	const dateStr = `${monthNames[Math.min(month, 11)]} ${year}`;

	const maEntry = payload.find((p) => p.name === "4yr MA");
	const priceEntry = payload.find((p) => p.name === "BTC Price");

	const maVal = maEntry?.value ?? 0;
	const priceVal = priceEntry?.value ?? 0;
	const ratio = maVal > 0 ? priceVal / maVal : 0;

	return (
		<div
			style={{
				backgroundColor: "#1e293b",
				border: "1px solid #475569",
				borderRadius: "8px",
				padding: "10px 14px",
				fontSize: "12px",
				color: "#e2e8f0",
			}}
		>
			<p style={{ color: "#94a3b8", marginBottom: 6 }}>{dateStr}</p>
			{priceEntry && (
				<p style={{ color: "#fb923c", marginBottom: 2 }}>
					BTC Price: {formatPrice(priceVal)}
				</p>
			)}
			{maEntry && (
				<p style={{ color: "#94a3b8", marginBottom: 4 }}>
					4yr MA: {formatPrice(maVal)}
				</p>
			)}
			{maVal > 0 && priceVal > 0 && (
				<p
					style={{
						color: ratio < 1 ? "#34d399" : ratio < 2 ? "#fbbf24" : "#f87171",
						fontWeight: 600,
						borderTop: "1px solid #334155",
						paddingTop: 4,
						marginTop: 4,
					}}
				>
					Ratio: {ratio.toFixed(2)}x
				</p>
			)}
		</div>
	);
}

// =============================================================================
// Main component
// =============================================================================

export interface FourYearMAProps {
	btcPriceUsd: number;
}

export function FourYearMA({ btcPriceUsd }: FourYearMAProps) {
	const data = useMemo(() => generateSyntheticData(), []);

	// Derive current approximate MA from the last data point (end of 2026)
	// The last point represents ~Dec 2026. Use the second-to-last full year point
	// representing "now" (2026). We'll linearly interpolate.
	const NOW_YEAR = 2026.17; // ~March 2026

	const nowMA = useMemo(() => {
		// Find nearest data point to NOW_YEAR
		let best = data[0];
		let bestDist = Math.abs(data[0].year - NOW_YEAR);
		for (const p of data) {
			const d = Math.abs(p.year - NOW_YEAR);
			if (d < bestDist) {
				bestDist = d;
				best = p;
			}
		}
		return best.ma;
	}, [data]);

	const ratio = nowMA > 0 ? btcPriceUsd / nowMA : 0;
	const ratioMeta = getRatioMeta(ratio);

	// Y axis ticks — log scale friendly values
	const yTicks = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000];

	// Halving x-positions as year fractions
	const halvingLines = HALVINGS.map((h) => ({
		x: h.year,
		label: h.label,
	}));

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
				<div className="flex items-start justify-between gap-3 flex-wrap">
					<div>
						<CardTitle className="text-sm sm:text-lg text-white leading-snug">
							4-Year Moving Average
						</CardTitle>
						<p className="text-xs text-slate-400 mt-1">
							Framework Part 4.3 — Bitcoin price cycles relative to the 4yr MA
						</p>
					</div>
					{/* Current ratio badge */}
					<div
						className={`flex-shrink-0 rounded-lg border px-3 py-2 ${ratioMeta.bgColor} ${ratioMeta.borderColor}`}
					>
						<p className="text-[10px] text-slate-400 leading-none mb-1">Price / 4yr MA</p>
						<p className={`text-xl font-bold leading-none ${ratioMeta.color}`}>
							{ratio.toFixed(2)}x
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-3 sm:p-6 pt-2 sm:pt-2 space-y-3">
				{/* Status banner */}
				<div
					className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 ${ratioMeta.bgColor} ${ratioMeta.borderColor}`}
				>
					<div>
						<p className={`text-xs font-semibold ${ratioMeta.color}`}>{ratioMeta.label}</p>
						<p className="text-xs text-slate-400 mt-0.5">{ratioMeta.description}</p>
					</div>
				</div>

				{/* Chart */}
				<div className="h-64 sm:h-72">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
							<defs>
								{/* Green shading: accumulation zone (below MA) */}
								<linearGradient id="accumGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
									<stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
								</linearGradient>
								{/* Red shading: danger zone (above 2x MA) */}
								<linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
									<stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
								</linearGradient>
							</defs>

							<CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

							<XAxis
								dataKey="year"
								type="number"
								domain={[2014, 2027]}
								tickFormatter={(v: number) => {
									const yr = Math.floor(v);
									const mo = Math.round((v - yr) * 12);
									if (mo !== 0) return "";
									if (yr % 2 !== 0) return "";
									return String(yr);
								}}
								ticks={[2014, 2016, 2018, 2020, 2022, 2024, 2026]}
								tick={{ fill: "#64748b", fontSize: 10 }}
								axisLine={{ stroke: "#334155" }}
								tickLine={false}
								scale="linear"
							/>

							<YAxis
								type="number"
								scale="log"
								domain={[500, 600_000]}
								ticks={yTicks}
								tickFormatter={(v: number) => formatPrice(v)}
								tick={{ fill: "#64748b", fontSize: 10 }}
								axisLine={false}
								tickLine={false}
								width={50}
								allowDataOverflow
							/>

							<Tooltip
								content={<CustomTooltip />}
								isAnimationActive={false}
							/>

							<Legend
								wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
								formatter={(value) => (
									<span style={{ color: "#94a3b8" }}>{value}</span>
								)}
							/>

							{/* Halving reference lines */}
							{halvingLines.map((h) => (
								<ReferenceLine
									key={h.x}
									x={h.x}
									stroke="#f59e0b"
									strokeWidth={1}
									strokeDasharray="4 3"
									label={{
										value: "↑",
										position: "insideTopLeft",
										fill: "#f59e0b",
										fontSize: 10,
										offset: 2,
									}}
								/>
							))}

							{/* Current price reference line */}
							<ReferenceLine
								y={btcPriceUsd}
								stroke="#fb923c"
								strokeWidth={1}
								strokeDasharray="6 3"
								strokeOpacity={0.6}
								label={{
									value: `Now ${formatPrice(btcPriceUsd)}`,
									position: "right",
									fill: "#fb923c",
									fontSize: 9,
									offset: 4,
								}}
							/>

							{/* Accumulation zone fill — from 0 to MA */}
							<Area
								type="monotone"
								dataKey="accumZoneTop"
								name="Accumulation Zone"
								fill="url(#accumGradient)"
								stroke="transparent"
								legendType="none"
								isAnimationActive={false}
								baseValue={500}
								dot={false}
								activeDot={false}
							/>

							{/* Danger zone fill — from 2xMA upward */}
							<Area
								type="monotone"
								dataKey="dangerZoneCap"
								name="Danger Zone"
								fill="url(#dangerGradient)"
								stroke="transparent"
								legendType="none"
								isAnimationActive={false}
								baseValue="dangerZoneBottom"
								dot={false}
								activeDot={false}
							/>

							{/* 4yr MA line — dashed slate */}
							<Line
								type="monotone"
								dataKey="ma"
								name="4yr MA"
								stroke="#94a3b8"
								strokeWidth={2}
								strokeDasharray="5 3"
								dot={false}
								isAnimationActive={false}
							/>

							{/* BTC Price line — orange */}
							<Line
								type="monotone"
								dataKey="price"
								name="BTC Price"
								stroke="#fb923c"
								strokeWidth={2}
								dot={false}
								isAnimationActive={false}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>

				{/* Legend annotations */}
				<div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">
					<span className="flex items-center gap-1.5">
						<span className="inline-block w-4 h-0.5 bg-orange-400" />
						BTC Price (illustrative)
					</span>
					<span className="flex items-center gap-1.5">
						<span className="inline-block w-4 h-0.5 bg-slate-400 opacity-60" style={{ borderTop: "2px dashed #94a3b8" }} />
						4yr Moving Average
					</span>
					<span className="flex items-center gap-1.5">
						<span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/30" />
						Accumulation zone (below MA)
					</span>
					<span className="flex items-center gap-1.5">
						<span className="inline-block w-3 h-3 rounded-sm bg-red-500/30" />
						Danger zone (&gt;2x MA)
					</span>
					<span className="flex items-center gap-1.5">
						<span className="inline-block w-4 h-0.5 bg-amber-400 opacity-70" style={{ borderTop: "2px dashed #f59e0b" }} />
						Halving dates
					</span>
				</div>

				<p className="text-[10px] text-slate-600">
					Chart uses illustrative synthetic data shaped to historical Bitcoin cycle patterns.
					The 4-year MA is a conceptual guide — not live price data. Current ratio uses your
					entered BTC price vs. the estimated MA baseline.
				</p>
			</CardContent>
		</Card>
	);
}
