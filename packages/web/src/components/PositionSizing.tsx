import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

const API_BASE = "/api";

// ---------------------------------------------------------------------------
// Types (mirroring engine — no direct engine dep in web)
// ---------------------------------------------------------------------------

interface PositionSizingInput {
	totalValueUsd: number;
	currentBtcPct: number;
	targetBtcPct: number;
	monthlyBurnUsd: number;
	liquidReserveUsd: number;
	btcPriceUsd: number;
	dcaMonths: number;
}

interface PositionSizingResult {
	currentBtcUsd: number;
	targetBtcUsd: number;
	gapUsd: number;
	gapBtc: number;
	dcaMonthlyUsd: number;
	dcaMonthlyBtc: number;
	dcaMonths: number;
	postReallocationRuinTest: boolean;
	postReallocationRunwayMonths: number;
	convictionRung: string;
	currentConvictionRung: string;
}

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

function fmtUsd(n: number, symbol = "$"): string {
	const abs = Math.abs(n);
	if (abs >= 1_000_000) return `${symbol}${fmt(n / 1_000_000, 2)}M`;
	if (abs >= 1_000) return `${symbol}${fmt(n / 1_000, 1)}K`;
	return `${symbol}${fmt(n)}`;
}

function fmtBtc(n: number): string {
	const abs = Math.abs(n);
	const prefix = n < 0 ? "-" : "";
	if (abs < 0.001) return `${prefix}${(abs * 1_000_000).toFixed(0)}\u00a0sats`;
	return `${prefix}${abs.toFixed(4)}\u00a0BTC`;
}

// ---------------------------------------------------------------------------
// Allocation bar: fills a horizontal bar with a BTC (orange) and non-BTC segment
// ---------------------------------------------------------------------------

function AllocationBar({
	btcPct,
	label,
}: {
	btcPct: number;
	label: string;
}) {
	return (
		<div className="space-y-1.5">
			<div className="flex justify-between text-xs text-slate-400">
				<span>{label}</span>
				<span className="font-mono text-slate-300">
					BTC <span className="text-orange-400 font-bold">{btcPct.toFixed(1)}%</span>
					{" / "}Other {(100 - btcPct).toFixed(1)}%
				</span>
			</div>
			<div className="relative h-6 rounded-md overflow-hidden bg-slate-700/50">
				{/* BTC segment */}
				<div
					className="absolute left-0 top-0 h-full bg-orange-500/70 transition-all duration-500 rounded-l-md"
					style={{ width: `${Math.min(btcPct, 100)}%` }}
				/>
				{/* Non-BTC segment fills the rest — already the default bg */}
				{/* Marker at BTC pct */}
				{btcPct > 0 && btcPct < 100 && (
					<div
						className="absolute top-0 h-full w-px bg-slate-300/40"
						style={{ left: `${btcPct}%` }}
					/>
				)}
				{/* Label inside bar */}
				<div className="absolute inset-0 flex items-center px-2 gap-1">
					{btcPct >= 12 && (
						<span className="text-xs font-semibold text-orange-100 drop-shadow">
							BTC
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Slider with label
// ---------------------------------------------------------------------------

function LabeledSlider({
	label,
	value,
	min,
	max,
	step,
	onChange,
	display,
}: {
	label: string;
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
				<span className="text-xs text-slate-400">{label}</span>
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
				<span>{min}%</span>
				<span>{max}%</span>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface PositionSizingProps {
	totalValueUsd: number;
	currentBtcPct: number;
	monthlyBurnUsd: number;
	liquidReserveUsd: number;
	btcPriceUsd: number;
	currencySymbol?: string;
}

const DCA_OPTIONS = [1, 3, 6, 12, 24] as const;

export function PositionSizing({
	totalValueUsd,
	currentBtcPct,
	monthlyBurnUsd,
	liquidReserveUsd,
	btcPriceUsd,
	currencySymbol = "$",
}: PositionSizingProps) {
	const [targetBtcPct, setTargetBtcPct] = useState(() => Math.min(currentBtcPct + 5, 100));
	const [dcaMonths, setDcaMonths] = useState<(typeof DCA_OPTIONS)[number]>(6);
	const [result, setResult] = useState<PositionSizingResult | null>(null);
	const [loading, setLoading] = useState(false);

	const calculate = useCallback(
		async (target: number, months: number) => {
			if (!btcPriceUsd || !totalValueUsd) return;
			setLoading(true);
			try {
				const body: PositionSizingInput = {
					totalValueUsd,
					currentBtcPct,
					targetBtcPct: target,
					monthlyBurnUsd,
					liquidReserveUsd,
					btcPriceUsd,
					dcaMonths: months,
				};
				const res = await fetch(`${API_BASE}/position-sizing`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
				if (!res.ok) throw new Error(`API ${res.status}`);
				setResult(await res.json());
			} catch (err) {
				console.error("position-sizing error:", err);
			} finally {
				setLoading(false);
			}
		},
		[totalValueUsd, currentBtcPct, monthlyBurnUsd, liquidReserveUsd, btcPriceUsd],
	);

	// Recalculate whenever inputs change
	useEffect(() => {
		calculate(targetBtcPct, dcaMonths);
	}, [calculate, targetBtcPct, dcaMonths]);

	const isBuying = result ? result.gapUsd >= 0 : targetBtcPct >= currentBtcPct;
	const gapAbs = result ? Math.abs(result.gapUsd) : 0;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6 space-y-6">
				{/* Header */}
				<div>
					<h3 className="text-base sm:text-lg font-semibold text-white mb-0.5">
						Position Sizing
					</h3>
					<p className="text-xs text-slate-400">
						Plan your path from current to target Bitcoin allocation
					</p>
				</div>

				{/* Target slider */}
				<LabeledSlider
					label="Target BTC allocation"
					value={targetBtcPct}
					min={0}
					max={100}
					step={1}
					onChange={setTargetBtcPct}
					display={`${targetBtcPct}%`}
				/>

				{/* Allocation comparison bars */}
				<div className="space-y-3">
					<AllocationBar btcPct={currentBtcPct} label="Current" />
					<AllocationBar btcPct={targetBtcPct} label="Target" />
				</div>

				{/* Gap summary */}
				{result && (
					<div
						className={`rounded-xl px-4 py-3 border transition-colors duration-300 ${
							isBuying
								? "bg-emerald-950/50 border-emerald-500/30"
								: "bg-amber-950/50 border-amber-500/30"
						}`}
					>
						<div className="flex items-start gap-3">
							<span
								className={`text-2xl mt-0.5 ${isBuying ? "text-emerald-400" : "text-amber-400"}`}
							>
								{isBuying ? "\u2191" : "\u2193"}
							</span>
							<div className="flex-1 min-w-0">
								<p
									className={`text-sm font-semibold ${isBuying ? "text-emerald-400" : "text-amber-400"}`}
								>
									{isBuying ? "Buy" : "Sell"}{" "}
									{fmtUsd(gapAbs, currencySymbol)}{" "}
									of Bitcoin
								</p>
								<p className="text-xs text-slate-400 mt-0.5">
									{fmtBtc(Math.abs(result.gapBtc))} at current price
								</p>
								<div className="mt-1 flex gap-3 text-xs text-slate-500">
									<span>
										{result.currentConvictionRung}
										{" \u2192 "}
										<span className="text-orange-400 font-medium">{result.convictionRung}</span>
									</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* DCA breakdown */}
				<div className="space-y-3">
					<p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
						DCA Schedule
					</p>
					{/* Month selector */}
					<div className="flex gap-2">
						{DCA_OPTIONS.map((m) => (
							<button
								key={m}
								type="button"
								onClick={() => setDcaMonths(m)}
								className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
									dcaMonths === m
										? "bg-orange-500/20 border-orange-500/50 text-orange-400"
										: "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400"
								}`}
							>
								{m}mo
							</button>
						))}
					</div>

					{/* Monthly amounts */}
					{result && (
						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-lg bg-slate-900/60 px-3 py-2.5 border border-slate-700/60">
								<p className="text-xs text-slate-500">Monthly {isBuying ? "buy" : "sell"}</p>
								<p className="text-lg font-bold font-mono text-white mt-0.5">
									{fmtUsd(Math.abs(result.dcaMonthlyUsd), currencySymbol)}
								</p>
								<p className="text-xs text-slate-500 mt-0.5">
									{fmtBtc(Math.abs(result.dcaMonthlyBtc))} / mo
								</p>
							</div>
							<div className="rounded-lg bg-slate-900/60 px-3 py-2.5 border border-slate-700/60">
								<p className="text-xs text-slate-500">Duration</p>
								<p className="text-lg font-bold font-mono text-white mt-0.5">
									{result.dcaMonths} months
								</p>
								<p className="text-xs text-slate-500 mt-0.5">
									Total {fmtUsd(gapAbs, currencySymbol)}
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Post-reallocation ruin test */}
				{result && (
					<div
						className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-300 ${
							result.postReallocationRuinTest
								? "bg-emerald-500/10 border-emerald-500/30"
								: "bg-red-500/10 border-red-500/30"
						}`}
					>
						<span
							className={`text-2xl flex-shrink-0 ${
								result.postReallocationRuinTest ? "text-emerald-400" : "text-red-400"
							}`}
						>
							{result.postReallocationRuinTest ? "\u2713" : "\u2717"}
						</span>
						<div className="flex-1 min-w-0">
							<p
								className={`text-sm font-semibold ${
									result.postReallocationRuinTest ? "text-emerald-400" : "text-red-400"
								}`}
							>
								Ruin Test After Reallocation:{" "}
								{result.postReallocationRuinTest ? "PASS" : "FAIL"}
							</p>
							<p className="text-xs text-slate-400 mt-0.5">
								{result.postReallocationRunwayMonths === Infinity
									? "\u221e months"
									: `${fmt(result.postReallocationRunwayMonths)} months`}{" "}
								runway at {targetBtcPct}% BTC under worst-case crash
							</p>
							{!result.postReallocationRuinTest && (
								<p className="text-xs text-red-400/70 mt-1">
									Target allocation leaves insufficient runway — consider a lower target or larger reserve
								</p>
							)}
						</div>
					</div>
				)}

				{/* Loading state overlay */}
				{loading && (
					<div className="flex justify-center py-2">
						<div className="w-4 h-4 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />
					</div>
				)}
			</CardContent>
		</Card>
	);
}
