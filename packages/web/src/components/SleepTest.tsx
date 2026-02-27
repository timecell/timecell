import { useMemo } from "react";
import { calculateSleepTest, type SleepTestResult } from "@timecell/engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(value: number, symbol: string): string {
	if (value >= 1_000_000) {
		return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
	}
	if (value >= 1_000) {
		return `${symbol}${(value / 1_000).toFixed(0)}k`;
	}
	return `${symbol}${Math.round(value).toLocaleString("en-US")}`;
}

function formatMoneyFull(value: number, symbol: string): string {
	return `${symbol}${Math.round(value).toLocaleString("en-US")}`;
}

type Severity = "green" | "amber" | "red";

function getSeverity(lossPercentage: number): Severity {
	if (lossPercentage < 20) return "green";
	if (lossPercentage <= 50) return "amber";
	return "red";
}

const severityStyles: Record<Severity, { border: string; bg: string; lossText: string; glow: string; label: string }> = {
	green: {
		border: "border-emerald-500/30",
		bg: "from-emerald-950/60 to-slate-900/80",
		lossText: "text-emerald-400",
		glow: "shadow-emerald-500/10",
		label: "Manageable",
	},
	amber: {
		border: "border-amber-500/30",
		bg: "from-amber-950/60 to-slate-900/80",
		lossText: "text-amber-400",
		glow: "shadow-amber-500/10",
		label: "Painful",
	},
	red: {
		border: "border-red-500/40",
		bg: "from-red-950/70 to-slate-900/80",
		lossText: "text-red-400",
		glow: "shadow-red-500/20",
		label: "Devastating",
	},
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SleepTestProps {
	totalValueUsd: number;
	btcPercentage: number;
	currencySymbol: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SleepTest({ totalValueUsd, btcPercentage, currencySymbol }: SleepTestProps) {
	const result: SleepTestResult = useMemo(
		() =>
			calculateSleepTest({
				totalPortfolioValue: totalValueUsd,
				btcPercentage,
			}),
		[totalValueUsd, btcPercentage],
	);

	const severity = getSeverity(result.lossPercentage);
	const styles = severityStyles[severity];

	return (
		<div
			className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-gradient-to-br ${styles.bg} p-6 sm:p-8 shadow-lg ${styles.glow} transition-all duration-500`}
		>
			{/* Background pulse for red severity */}
			{severity === "red" && (
				<div className="absolute inset-0 opacity-[0.03]">
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-red-500 blur-3xl animate-pulse" />
				</div>
			)}

			<div className="relative">
				{/* Header */}
				<div className="flex items-center gap-2 mb-1">
					<span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
						Sleep Test
					</span>
					<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
						severity === "green"
							? "bg-emerald-500/10 text-emerald-400"
							: severity === "amber"
								? "bg-amber-500/10 text-amber-400"
								: "bg-red-500/10 text-red-400"
					}`}>
						{styles.label}
					</span>
				</div>

				<p className="text-sm text-slate-400 mb-5">
					If BTC drops 80% tomorrow, you lose:
				</p>

				{/* The Big Number */}
				<div className="mb-6">
					<span
						className={`text-5xl sm:text-6xl lg:text-7xl font-black tabular-nums tracking-tight ${styles.lossText} transition-colors duration-500`}
					>
						{formatMoney(result.totalLoss, currencySymbol)}
					</span>
					<span className={`block sm:inline sm:ml-3 text-lg sm:text-xl font-medium ${styles.lossText} opacity-70`}>
						({result.lossPercentage.toFixed(0)}% of portfolio)
					</span>
				</div>

				{/* Breakdown row */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
					<div>
						<p className="text-xs text-slate-500 uppercase tracking-wider mb-1">BTC Loss</p>
						<p className="text-lg font-bold text-red-400 tabular-nums">
							{formatMoneyFull(result.btcLoss, currencySymbol)}
						</p>
					</div>
					<div>
						<p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Other Assets Loss</p>
						<p className="text-lg font-bold text-red-300/80 tabular-nums">
							{formatMoneyFull(result.otherAssetsLoss, currencySymbol)}
						</p>
					</div>
					<div>
						<p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Loss</p>
						<p className={`text-lg font-bold tabular-nums ${styles.lossText}`}>
							{formatMoneyFull(result.totalLoss, currencySymbol)}
						</p>
					</div>
					<div>
						<p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Post-Crash Value</p>
						<p className="text-lg font-bold text-slate-300 tabular-nums">
							{formatMoneyFull(result.postCrashValue, currencySymbol)}
						</p>
					</div>
				</div>

				{/* The prompt */}
				<div className={`rounded-xl px-4 py-3 border ${
					severity === "red"
						? "bg-red-500/5 border-red-500/20"
						: severity === "amber"
							? "bg-amber-500/5 border-amber-500/20"
							: "bg-emerald-500/5 border-emerald-500/20"
				}`}>
					<p className={`text-sm font-semibold ${styles.lossText}`}>
						Does your life change?
					</p>
					<p className="text-xs text-slate-400 mt-1">
						{severity === "green"
							? "If you can say this number out loud without flinching, your allocation is sized right."
							: severity === "amber"
								? "If this number makes you uncomfortable, consider reducing your BTC allocation."
								: "If this number keeps you up at night, you are overexposed. Reduce until you can sleep."}
					</p>
				</div>
			</div>
		</div>
	);
}
