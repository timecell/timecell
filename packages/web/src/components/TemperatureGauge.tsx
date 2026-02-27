import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { calculateTemperature } from "@timecell/engine";
import type { TemperatureZone } from "@timecell/engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemperatureData {
	score: number;
	zone: TemperatureZone;
	mvrvScore: number;
	rhodlScore: number;
	mvrv: number;
	rhodl: number;
	btcPrice?: number;
	timestamp?: string;
	dataSource: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a 0–100 score to a CSS colour string via a 6-tier gradient. */
function scoreToColor(score: number): string {
	if (score < 30) return "#3b82f6"; // blue-500  — Extreme Fear
	if (score < 50) return "#22c55e"; // green-500 — Fear
	if (score < 60) return "#eab308"; // yellow-500 — Neutral
	if (score < 70) return "#facc15"; // yellow-400 — Caution
	if (score < 80) return "#f97316"; // orange-500 — Greed
	return "#ef4444"; // red-500  — Extreme Greed
}

/** Zone-specific Tailwind text colour class. */
function zoneTextClass(zone: TemperatureData["zone"]): string {
	switch (zone) {
		case "Extreme Fear":
			return "text-blue-400";
		case "Fear":
			return "text-green-400";
		case "Neutral":
			return "text-yellow-400";
		case "Caution":
			return "text-yellow-300";
		case "Greed":
			return "text-orange-400";
		case "Extreme Greed":
			return "text-red-400";
	}
}

/**
 * Convert a 0–100 score to polar co-ordinates on a semi-circle.
 *
 * The semi-circle spans from 180° (left, score 0) to 0° (right, score 100),
 * sweeping through the top.  We use standard SVG arc math with the arc
 * centre at (100, 100) and radius 80.
 */
function scoreToPoint(score: number, radius: number, cx: number, cy: number): { x: number; y: number } {
	// angle: 180° at score=0, 0° at score=100
	const angleDeg = 180 - score * 1.8;
	const angleRad = (angleDeg * Math.PI) / 180;
	return {
		x: cx + radius * Math.cos(angleRad),
		y: cy - radius * Math.sin(angleRad),
	};
}

/**
 * Build an SVG arc path for the colour-coded foreground arc (score portion).
 */
function buildArcPath(score: number, radius: number, cx: number, cy: number): string {
	const start = scoreToPoint(0, radius, cx, cy);
	const end = scoreToPoint(score, radius, cx, cy);
	const largeArc = score > 50 ? 1 : 0;
	return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// ---------------------------------------------------------------------------
// Zone band segments rendered behind the needle
// ---------------------------------------------------------------------------

interface Band {
	from: number;
	to: number;
	color: string;
}

const BANDS: Band[] = [
	{ from: 0, to: 30, color: "#3b82f6" },  // blue — Extreme Fear
	{ from: 30, to: 50, color: "#22c55e" }, // green — Fear
	{ from: 50, to: 60, color: "#eab308" }, // yellow — Neutral
	{ from: 60, to: 70, color: "#facc15" }, // yellow-400 — Caution
	{ from: 70, to: 80, color: "#f97316" }, // orange — Greed
	{ from: 80, to: 100, color: "#ef4444" }, // red — Extreme Greed
];

function BandArc({ from, to, radius, cx, cy }: { from: number; to: number; radius: number; cx: number; cy: number }) {
	const start = scoreToPoint(from, radius, cx, cy);
	const end = scoreToPoint(to, radius, cx, cy);
	const span = to - from;
	const largeArc = span > 50 ? 1 : 0;
	const d = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
	const band = BANDS.find((b) => b.from === from);
	return <path d={d} stroke={band?.color ?? "#64748b"} strokeWidth="10" fill="none" strokeOpacity="0.25" />;
}

// ---------------------------------------------------------------------------
// Gauge SVG
// ---------------------------------------------------------------------------

function GaugeSVG({ score }: { score: number }) {
	const CX = 100;
	const CY = 100;
	const RADIUS = 75;
	const arcColor = scoreToColor(score);

	// Needle tip at the score position, base at centre
	const tip = scoreToPoint(score, RADIUS - 8, CX, CY);

	return (
		<svg viewBox="0 0 200 115" className="w-full max-w-xs mx-auto" aria-hidden="true">
			{/* Background track */}
			<path
				d={`M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`}
				stroke="#1e293b"
				strokeWidth="12"
				fill="none"
			/>

			{/* Coloured zone bands */}
			{BANDS.map((b) => (
				<BandArc key={b.from} from={b.from} to={b.to} radius={RADIUS} cx={CX} cy={CY} />
			))}

			{/* Filled arc to current score */}
			<path
				d={buildArcPath(score, RADIUS, CX, CY)}
				stroke={arcColor}
				strokeWidth="12"
				fill="none"
				strokeLinecap="round"
				style={{ transition: "all 0.6s ease" }}
			/>

			{/* Needle */}
			<line
				x1={CX}
				y1={CY}
				x2={tip.x}
				y2={tip.y}
				stroke={arcColor}
				strokeWidth="2.5"
				strokeLinecap="round"
				style={{ transition: "all 0.6s ease" }}
			/>
			{/* Needle hub */}
			<circle cx={CX} cy={CY} r="5" fill={arcColor} style={{ transition: "fill 0.6s ease" }} />
			<circle cx={CX} cy={CY} r="2.5" fill="#0f172a" />

			{/* Tick marks at zone boundaries */}
			{[0, 30, 50, 60, 70, 80, 100].map((tick) => {
				const outer = scoreToPoint(tick, RADIUS + 10, CX, CY);
				const inner = scoreToPoint(tick, RADIUS - 10, CX, CY);
				return (
					<line
						key={tick}
						x1={inner.x}
						y1={inner.y}
						x2={outer.x}
						y2={outer.y}
						stroke="#475569"
						strokeWidth="1"
					/>
				);
			})}

			{/* Min/max labels */}
			<text x={CX - RADIUS - 4} y={CY + 14} fontSize="9" fill="#64748b" textAnchor="middle">
				0
			</text>
			<text x={CX + RADIUS + 4} y={CY + 14} fontSize="9" fill="#64748b" textAnchor="middle">
				100
			</text>
		</svg>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface TemperatureGaugeProps {
	onTemperatureChange?: (score: number) => void;
}

export function TemperatureGauge({ onTemperatureChange }: TemperatureGaugeProps = {}) {
	const [data, setData] = useState<TemperatureData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		function fallbackToMock() {
			const MOCK_MVRV = 1.8;
			const MOCK_RHODL = 2000;
			const result = calculateTemperature(MOCK_MVRV, MOCK_RHODL);
			if (!cancelled) {
				setData({ ...result, dataSource: "mock" });
				setError(null);
				onTemperatureChange?.(result.score);
				setLoading(false);
			}
		}

		async function fetchTemperature() {
			try {
				const res = await fetch("/api/temperature");
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = (await res.json()) as TemperatureData;
				if (!cancelled) {
					setData(json);
					setError(null);
					onTemperatureChange?.(json.score);
				}
			} catch (err) {
				// API unavailable — fall back to local engine calculation
				if (!cancelled) {
					try {
						fallbackToMock();
						return;
					} catch {
						setError(err instanceof Error ? err.message : "Failed to load temperature");
					}
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		// Both standalone and CLI modes now try the API first.
		// In standalone (Vercel), /api/temperature hits the serverless function (Turso).
		// In CLI mode, /api/temperature hits the local Fastify server.
		// If either fails, we fall back to mock data.
		fetchTemperature();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				<h3 className="text-base sm:text-lg font-semibold text-white mb-1">
					Market Temperature
				</h3>
				<p className="text-xs text-slate-400 mb-4">
					MVRV (60%) + RHODL (40%) composite — where are we in the cycle?
				</p>

				{loading && (
					<div className="flex items-center justify-center h-40 text-slate-500 text-sm">
						Loading…
					</div>
				)}

				{error && (
					<div className="flex items-center justify-center h-40 text-red-400 text-sm">
						{error}
					</div>
				)}

				{!loading && !error && data && (
					<div className="flex flex-col items-center gap-1">
						{/* Semi-circular gauge */}
						<GaugeSVG score={data.score} />

						{/* Score + zone */}
						<div className="text-center -mt-2">
							<span
								className="text-5xl font-black tabular-nums tracking-tight transition-colors duration-500"
								style={{ color: scoreToColor(data.score) }}
							>
								{data.score}
							</span>
							<span className="text-lg font-semibold text-slate-400 ml-1">/ 100</span>
							<p className={`text-sm font-semibold mt-1 transition-colors duration-500 ${zoneTextClass(data.zone)}`}>
								{data.zone}
							</p>
						</div>

						{/* Component breakdown */}
						<div className="mt-4 w-full grid grid-cols-2 gap-2 text-center">
							<div className="rounded-lg bg-slate-900/50 border border-slate-700/50 px-3 py-2">
								<p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">MVRV</p>
								<p className="text-lg font-bold text-slate-200 tabular-nums">{data.mvrv.toFixed(2)}</p>
								<p className="text-xs text-slate-500">score: {data.mvrvScore} · 60%</p>
							</div>
							<div className="rounded-lg bg-slate-900/50 border border-slate-700/50 px-3 py-2">
								<p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">RHODL</p>
								<p className="text-lg font-bold text-slate-200 tabular-nums">{data.rhodl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
								<p className="text-xs text-slate-500">score: {data.rhodlScore} · 40%</p>
							</div>
						</div>

						{/* Data source note */}
						{data.dataSource === "mock" && (
							<p className="mt-3 text-xs text-slate-600 text-center">
								Mock data — live on-chain feeds coming soon
							</p>
						)}
						{data.dataSource === "turso-live" && data.timestamp && (
							<p className="mt-3 text-xs text-slate-500 text-center">
								Live on-chain data — updated {new Date(data.timestamp).toLocaleDateString()}
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
