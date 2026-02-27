import { Card, CardContent } from "@/components/ui/card";
import { useFearGreedIndex } from "../hooks/useFearGreedIndex";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketSentimentProps {
	temperatureScore: number;
	temperatureZone: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Broad sentiment bucket used for cross-validation. */
type Bucket = "fear" | "neutral" | "greed";

function toBucket(score: number): Bucket {
	if (score < 40) return "fear";
	if (score <= 60) return "neutral";
	return "greed";
}

/**
 * Map a TimeCell temperature zone string to a 0–100-ish score for display.
 * We need the raw numeric score (passed as prop) to drive the bar width.
 */
function scoreToColor(score: number): string {
	if (score < 30) return "#3b82f6"; // blue — Extreme Fear
	if (score < 50) return "#22c55e"; // green — Fear
	if (score < 60) return "#eab308"; // yellow — Neutral
	if (score < 70) return "#facc15"; // yellow-400 — Caution
	if (score < 80) return "#f97316"; // orange — Greed
	return "#ef4444"; // red — Extreme Greed
}

/** FNG uses different thresholds than TimeCell temperature. */
function fngScoreToColor(score: number): string {
	if (score <= 25) return "#3b82f6"; // Extreme Fear
	if (score <= 45) return "#22c55e"; // Fear
	if (score <= 55) return "#eab308"; // Neutral
	if (score <= 75) return "#f97316"; // Greed
	return "#ef4444"; // Extreme Greed
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ScoreBarProps {
	score: number;
	color: string;
	label: string;
}

function ScoreBar({ score, color, label }: ScoreBarProps) {
	return (
		<div className="w-full">
			<div className="flex justify-between items-baseline mb-1.5">
				<span
					className="text-xs font-medium"
					style={{ color }}
				>
					{label}
				</span>
				<span className="text-xs text-slate-500">{score}/100</span>
			</div>
			<div className="h-2 w-full rounded-full bg-slate-900/60 overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-700"
					style={{ width: `${score}%`, backgroundColor: color }}
				/>
			</div>
		</div>
	);
}

interface SentimentPanelProps {
	title: string;
	subtitle: string;
	score: number;
	label: string;
	color: string;
	loading?: boolean;
}

function SentimentPanel({ title, subtitle, score, label, color, loading = false }: SentimentPanelProps) {
	return (
		<div className="flex flex-col gap-3 flex-1 min-w-0">
			<div>
				<p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</p>
				<p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
			</div>

			{loading ? (
				<div className="space-y-2 animate-pulse">
					<div className="h-9 w-16 bg-slate-700 rounded" />
					<div className="h-3 w-24 bg-slate-700 rounded" />
					<div className="h-2 w-full bg-slate-700 rounded-full" />
				</div>
			) : (
				<>
					<div>
						<span
							className="text-4xl font-black tabular-nums leading-none transition-colors duration-500"
							style={{ color }}
						>
							{score}
						</span>
						<span className="text-sm text-slate-500 ml-1">/ 100</span>
					</div>
					<p className="text-xs font-semibold" style={{ color }}>
						{label}
					</p>
					<ScoreBar score={score} color={color} label="" />
				</>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Agreement indicator
// ---------------------------------------------------------------------------

interface AgreementBadgeProps {
	tcBucket: Bucket;
	fngBucket: Bucket;
}

function AgreementBadge({ tcBucket, fngBucket }: AgreementBadgeProps) {
	const aligned = tcBucket === fngBucket;

	if (aligned) {
		return (
			<div className="flex items-center gap-2 rounded-lg bg-emerald-900/20 border border-emerald-700/40 px-3 py-2">
				<span className="text-emerald-400 text-base leading-none">&#10003;</span>
				<div>
					<p className="text-xs font-semibold text-emerald-400">Signals aligned</p>
					<p className="text-xs text-slate-500 mt-0.5">Both indicators agree on market sentiment</p>
				</div>
			</div>
		);
	}

	// One says fear, other says greed (most extreme divergence)
	const hardDivergence =
		(tcBucket === "fear" && fngBucket === "greed") || (tcBucket === "greed" && fngBucket === "fear");

	return (
		<div
			className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
				hardDivergence
					? "bg-red-900/20 border-red-700/40"
					: "bg-amber-900/20 border-amber-700/40"
			}`}
		>
			<span
				className={`text-base leading-none ${hardDivergence ? "text-red-400" : "text-amber-400"}`}
			>
				&#9651;
			</span>
			<div>
				<p className={`text-xs font-semibold ${hardDivergence ? "text-red-400" : "text-amber-400"}`}>
					{hardDivergence ? "Strong divergence" : "Signals diverge"} — investigate
				</p>
				<p className="text-xs text-slate-500 mt-0.5">
					{hardDivergence
						? "On-chain and crowd sentiment sharply disagree"
						: "On-chain and crowd sentiment differ — dig deeper"}
				</p>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MarketSentiment({ temperatureScore, temperatureZone }: MarketSentimentProps) {
	const fng = useFearGreedIndex();

	const tcColor = scoreToColor(temperatureScore);
	const tcBucket = toBucket(temperatureScore);

	const fngScore = fng?.score ?? 0;
	const fngLabel = fng?.label ?? "—";
	const fngColor = fngScoreToColor(fngScore);
	const fngBucket = fng ? toBucket(fngScore) : "neutral";
	const fngLoading = !fng || fng.loading;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				{/* Header */}
				<div className="mb-4">
					<h3 className="text-base sm:text-lg font-semibold text-white">Market Sentiment</h3>
					<p className="text-xs text-slate-400 mt-0.5">
						On-chain temperature vs crowd fear &amp; greed — cross-validation
					</p>
				</div>

				{/* Side-by-side panels */}
				<div className="flex gap-4 sm:gap-6 items-start">
					<SentimentPanel
						title="TimeCell Temp"
						subtitle="MVRV + RHODL on-chain"
						score={temperatureScore}
						label={temperatureZone}
						color={tcColor}
					/>

					{/* Divider */}
					<div className="w-px self-stretch bg-slate-700/60 flex-shrink-0 my-1" />

					<SentimentPanel
						title="Fear &amp; Greed"
						subtitle="alternative.me crowd index"
						score={fngScore}
						label={fngLabel}
						color={fngColor}
						loading={fngLoading}
					/>
				</div>

				{/* Agreement indicator */}
				{!fngLoading && (
					<div className="mt-4">
						<AgreementBadge tcBucket={tcBucket} fngBucket={fngBucket} />
					</div>
				)}

				{/* Timestamp / source note */}
				{fng && !fng.loading && fng.timestamp && (
					<p className="mt-3 text-xs text-slate-600 text-right">
						FNG updated {new Date(fng.timestamp).toLocaleDateString()}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
