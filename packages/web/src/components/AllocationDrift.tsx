import { useMemo } from "react";
import { calculateAllocationDrift } from "@timecell/engine";
import type { AllocationDriftInput } from "@timecell/engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AllocationDriftProps {
	/** BTC % the user originally targeted (their chosen conviction rung) */
	initialBtcPct: number;
	/** BTC price when the target was set */
	initialBtcPrice: number;
	/** Current live BTC price */
	currentBtcPrice: number;
	/** Non-BTC portfolio value in USD (treated as stable) */
	otherAssetsValue: number;
	/** Whole BTC amount the user holds */
	btcHoldings: number;
	/** Currency symbol for formatting (e.g. "$") */
	currencySymbol?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AllocationDrift({
	initialBtcPct,
	initialBtcPrice,
	currentBtcPrice,
	otherAssetsValue,
	btcHoldings,
	currencySymbol = "$",
}: AllocationDriftProps) {
	const input: AllocationDriftInput = {
		initialBtcPct,
		initialBtcPrice,
		currentBtcPrice,
		otherAssetsValue,
		btcHoldings,
	};

	const result = useMemo(() => calculateAllocationDrift(input), [
		initialBtcPct,
		initialBtcPrice,
		currentBtcPrice,
		otherAssetsValue,
		btcHoldings,
	]);

	// Determine visual severity
	const severity: "green" | "amber" | "red" = result.rungChanged
		? "red"
		: result.rebalanceNeeded
			? "amber"
			: "green";

	// Bar widths — clamp to [0, 100] for display safety
	const targetBarWidth = clamp(initialBtcPct, 0, 100);
	const currentBarWidth = clamp(result.currentBtcPct, 0, 100);

	const driftSign = result.driftPct >= 0 ? "+" : "";

	return (
		<div
			className={`rounded-xl border px-4 py-3 transition-all duration-500 ${
				severity === "green"
					? "border-emerald-500/25 bg-emerald-950/20"
					: severity === "amber"
						? "border-amber-500/30 bg-amber-950/20"
						: "border-red-500/35 bg-red-950/20"
			}`}
		>
			{/* Header row */}
			<div className="flex items-center justify-between gap-3 mb-3">
				<div className="flex items-center gap-2">
					{/* Status dot */}
					<span
						className={`flex-shrink-0 w-2 h-2 rounded-full ${
							severity === "green"
								? "bg-emerald-400"
								: severity === "amber"
									? "bg-amber-400 animate-pulse"
									: "bg-red-400 animate-pulse"
						}`}
					/>
					<span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
						Allocation Drift
					</span>
				</div>

				{/* Drift badge */}
				<span
					className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${
						severity === "green"
							? "bg-emerald-500/10 text-emerald-400"
							: severity === "amber"
								? "bg-amber-500/10 text-amber-400"
								: "bg-red-500/10 text-red-400"
					}`}
				>
					{driftSign}{result.driftPct.toFixed(1)}%
				</span>
			</div>

			{/* Visual allocation bar */}
			<div className="mb-3 space-y-1.5">
				{/* Target bar */}
				<div>
					<div className="flex justify-between items-center mb-0.5">
						<span className="text-xs text-slate-500">Target ({result.originalRung})</span>
						<span className="text-xs font-medium text-slate-400 tabular-nums">
							{initialBtcPct.toFixed(1)}%
						</span>
					</div>
					<div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
						<div
							className="h-full rounded-full bg-slate-500 transition-all duration-500"
							style={{ width: `${targetBarWidth}%` }}
						/>
					</div>
				</div>

				{/* Current bar */}
				<div>
					<div className="flex justify-between items-center mb-0.5">
						<span className="text-xs text-slate-500">Current ({result.currentRung})</span>
						<span
							className={`text-xs font-bold tabular-nums ${
								severity === "green"
									? "text-emerald-400"
									: severity === "amber"
										? "text-amber-400"
										: "text-red-400"
							}`}
						>
							{result.currentBtcPct.toFixed(1)}%
						</span>
					</div>
					<div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
						<div
							className={`h-full rounded-full transition-all duration-500 ${
								severity === "green"
									? "bg-emerald-500"
									: severity === "amber"
										? "bg-amber-500"
										: "bg-red-500"
							}`}
							style={{ width: `${currentBarWidth}%` }}
						/>
					</div>
				</div>
			</div>

			{/* Status message */}
			{severity === "green" ? (
				<p className="text-xs text-emerald-400 font-medium">
					Allocation on target — no rebalance needed.
				</p>
			) : (
				<div
					className={`flex items-start gap-2 rounded-lg px-3 py-2 ${
						severity === "amber" ? "bg-amber-500/8" : "bg-red-500/8"
					}`}
				>
					{/* Exclamation icon */}
					<span
						className={`flex-shrink-0 text-xs font-bold mt-0.5 ${
							severity === "amber" ? "text-amber-400" : "text-red-400"
						}`}
					>
						!
					</span>
					<div>
						{result.rungChanged && (
							<p
								className={`text-xs font-semibold mb-0.5 ${
									severity === "red" ? "text-red-400" : "text-amber-400"
								}`}
							>
								Rung changed: {result.originalRung} → {result.currentRung}
							</p>
						)}
						<p
							className={`text-xs leading-snug ${
								severity === "amber" ? "text-amber-300/80" : "text-red-300/80"
							}`}
						>
							{result.rebalanceAction}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
