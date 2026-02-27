import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types (mirroring engine — no direct engine dep in web)
// ---------------------------------------------------------------------------

type CustodyRiskLevel = "low" | "moderate" | "high" | "critical";

interface CustodyResult {
	exchangeValueUsd: number;
	selfCustodyValueUsd: number;
	exchangeBtc: number;
	selfCustodyBtc: number;
	riskLevel: CustodyRiskLevel;
	recommendation: string;
	exchangeRiskExposure: number;
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

function fmtUsd(n: number, symbol = "$", rate = 1): string {
	const converted = n * rate;
	const abs = Math.abs(converted);
	if (abs >= 1_000_000) return `${symbol}${fmt(converted / 1_000_000, 2)}M`;
	if (abs >= 1_000) return `${symbol}${fmt(converted / 1_000, 1)}K`;
	return `${symbol}${fmt(converted)}`;
}

function fmtBtc(n: number): string {
	const abs = Math.abs(n);
	if (abs === 0) return "0\u00a0BTC";
	if (abs < 0.001) return `${(abs * 1_000_000).toFixed(0)}\u00a0sats`;
	return `${abs.toFixed(4)}\u00a0BTC`;
}

// ---------------------------------------------------------------------------
// Risk level styling config
// ---------------------------------------------------------------------------

const RISK_CONFIG: Record<
	CustodyRiskLevel,
	{ label: string; badgeClass: string; borderClass: string; bgClass: string }
> = {
	low: {
		label: "Low Risk",
		badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
		borderClass: "border-emerald-500/20",
		bgClass: "bg-emerald-950/30",
	},
	moderate: {
		label: "Moderate Risk",
		badgeClass: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
		borderClass: "border-amber-500/20",
		bgClass: "bg-amber-950/30",
	},
	high: {
		label: "High Risk",
		badgeClass: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
		borderClass: "border-orange-500/20",
		bgClass: "bg-orange-950/30",
	},
	critical: {
		label: "Critical Risk",
		badgeClass: "bg-red-500/20 text-red-400 border border-red-500/30",
		borderClass: "border-red-500/30",
		bgClass: "bg-red-950/30",
	},
};

// ---------------------------------------------------------------------------
// Custody split bar
// ---------------------------------------------------------------------------

function CustodySplitBar({
	exchangePct,
}: {
	exchangePct: number;
}) {
	const selfPct = 100 - exchangePct;
	return (
		<div className="space-y-2">
			<div className="flex justify-between text-xs text-slate-400">
				<span className="flex items-center gap-1.5">
					<span className="inline-block w-2 h-2 rounded-sm bg-orange-500/70" />
					Exchange
					<span className="font-mono font-semibold text-orange-400">{exchangePct.toFixed(0)}%</span>
				</span>
				<span className="flex items-center gap-1.5">
					<span className="text-slate-400">Self-Custody</span>
					<span className="font-mono font-semibold text-emerald-400">{selfPct.toFixed(0)}%</span>
					<span className="inline-block w-2 h-2 rounded-sm bg-emerald-500/70" />
				</span>
			</div>
			<div className="relative h-6 rounded-md overflow-hidden bg-slate-700/50 flex">
				{/* Exchange segment (orange) */}
				<div
					className="h-full bg-orange-500/70 transition-all duration-500"
					style={{ width: `${Math.min(exchangePct, 100)}%` }}
				/>
				{/* Self-custody segment (emerald) fills the rest */}
				<div
					className="h-full bg-emerald-500/60 transition-all duration-500"
					style={{ width: `${Math.max(selfPct, 0)}%` }}
				/>
				{/* Divider */}
				{exchangePct > 0 && exchangePct < 100 && (
					<div
						className="absolute top-0 h-full w-px bg-slate-300/30"
						style={{ left: `${exchangePct}%` }}
					/>
				)}
				{/* Inner labels */}
				<div className="absolute inset-0 flex items-center justify-between px-2">
					{exchangePct >= 15 && (
						<span className="text-xs font-semibold text-orange-100 drop-shadow">Exchange</span>
					)}
					{selfPct >= 15 && (
						<span className="text-xs font-semibold text-emerald-100 drop-shadow ml-auto">
							Self-Custody
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CustodyTrackerProps {
	totalBtcValueUsd: number;
	btcPriceUsd: number;
	currencySymbol?: string;
	currencyRate?: number;
}

// ---------------------------------------------------------------------------
// Main component — pure local calculation (no API call needed for simple math)
// ---------------------------------------------------------------------------

export function CustodyTracker({
	totalBtcValueUsd,
	btcPriceUsd,
	currencySymbol = "$",
	currencyRate = 1,
}: CustodyTrackerProps) {
	const [exchangePct, setExchangePct] = useState(20);
	const [result, setResult] = useState<CustodyResult | null>(null);
	const [loading, setLoading] = useState(false);

	const calculate = useCallback(
		async (pct: number) => {
			if (!btcPriceUsd && !totalBtcValueUsd) return;
			setLoading(true);
			try {
				const res = await fetch("/api/custody-risk", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						totalBtcValueUsd,
						exchangePct: pct,
						btcPriceUsd,
					}),
				});
				if (!res.ok) throw new Error(`API ${res.status}`);
				setResult(await res.json());
			} catch (err) {
				// Fallback: compute locally if API unavailable
				console.error("custody-risk API error, using local fallback:", err);
				const clampedPct = Math.max(0, Math.min(100, pct));
				const exchangeValueUsd = totalBtcValueUsd * (clampedPct / 100);
				const selfCustodyValueUsd = totalBtcValueUsd - exchangeValueUsd;
				const exchangeBtc = btcPriceUsd > 0 ? exchangeValueUsd / btcPriceUsd : 0;
				const selfCustodyBtc = btcPriceUsd > 0 ? selfCustodyValueUsd / btcPriceUsd : 0;
				let riskLevel: CustodyRiskLevel;
				if (clampedPct < 10) riskLevel = "low";
				else if (clampedPct < 30) riskLevel = "moderate";
				else if (clampedPct < 60) riskLevel = "high";
				else riskLevel = "critical";
				const recommendations: Record<CustodyRiskLevel, string> = {
					low: "Good custody hygiene. Less than 10% on exchange minimises counterparty risk. Keep only what you need for active trading.",
					moderate: `${clampedPct.toFixed(0)}% on exchange is manageable but elevated. Move excess to cold storage — aim for under 10% on exchange.`,
					high: `${clampedPct.toFixed(0)}% on exchange is high-risk. Exchange failures (FTX, Mt. Gox) can be total losses. Withdraw to hardware wallet urgently.`,
					critical: `${clampedPct.toFixed(0)}% on exchange is critical. "Not your keys, not your coins." This level of exchange exposure can be catastrophic if an exchange fails. Withdraw immediately.`,
				};
				setResult({
					exchangeValueUsd,
					selfCustodyValueUsd,
					exchangeBtc,
					selfCustodyBtc,
					riskLevel,
					recommendation: recommendations[riskLevel],
					exchangeRiskExposure: exchangeValueUsd,
				});
			} finally {
				setLoading(false);
			}
		},
		[totalBtcValueUsd, btcPriceUsd],
	);

	useEffect(() => {
		calculate(exchangePct);
	}, [calculate, exchangePct]);

	const risk = result ? RISK_CONFIG[result.riskLevel] : null;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6 space-y-5">
				{/* Header */}
				<div className="flex items-start justify-between gap-3">
					<div>
						<h3 className="text-base sm:text-lg font-semibold text-white mb-0.5">
							Custody Tracker
						</h3>
						<p className="text-xs text-slate-400">
							Exchange BTC carries counterparty risk — not your keys, not your coins
						</p>
					</div>
					{result && risk && (
						<span
							className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${risk.badgeClass}`}
						>
							{risk.label}
						</span>
					)}
				</div>

				{/* Slider */}
				<div className="space-y-1.5">
					<div className="flex justify-between items-center">
						<span className="text-xs text-slate-400">% of BTC on exchanges</span>
						<span className="text-sm font-mono font-semibold text-orange-400">
							{exchangePct}%
						</span>
					</div>
					<input
						type="range"
						min={0}
						max={100}
						step={1}
						value={exchangePct}
						onChange={(e) => setExchangePct(Number(e.target.value))}
						className="w-full h-1.5 rounded-full accent-orange-500 bg-slate-700 cursor-pointer"
					/>
					<div className="flex justify-between text-xs text-slate-600">
						<span>0% (all self-custody)</span>
						<span>100% (all exchange)</span>
					</div>
				</div>

				{/* Split bar */}
				<CustodySplitBar exchangePct={exchangePct} />

				{/* Dollar breakdown */}
				{result && (
					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-lg bg-slate-900/60 px-3 py-2.5 border border-orange-500/20">
							<p className="text-xs text-slate-500">On Exchange</p>
							<p className="text-base font-bold font-mono text-orange-400 mt-0.5">
								{fmtUsd(result.exchangeValueUsd, currencySymbol, currencyRate)}
							</p>
							<p className="text-xs text-slate-500 mt-0.5">{fmtBtc(result.exchangeBtc)}</p>
						</div>
						<div className="rounded-lg bg-slate-900/60 px-3 py-2.5 border border-emerald-500/20">
							<p className="text-xs text-slate-500">Self-Custody</p>
							<p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
								{fmtUsd(result.selfCustodyValueUsd, currencySymbol, currencyRate)}
							</p>
							<p className="text-xs text-slate-500 mt-0.5">{fmtBtc(result.selfCustodyBtc)}</p>
						</div>
					</div>
				)}

				{/* Risk exposure callout */}
				{result && result.exchangeRiskExposure > 0 && risk && (
					<div
						className={`rounded-xl px-4 py-3 border transition-colors duration-300 ${risk.bgClass} ${risk.borderClass}`}
					>
						<p className="text-xs text-slate-400 mb-1">At risk from exchange failure</p>
						<p className={`text-lg font-bold font-mono ${
							result.riskLevel === "low"
								? "text-emerald-400"
								: result.riskLevel === "moderate"
									? "text-amber-400"
									: result.riskLevel === "high"
										? "text-orange-400"
										: "text-red-400"
						}`}>
							{fmtUsd(result.exchangeRiskExposure, currencySymbol, currencyRate)}
						</p>
						<p className="text-xs text-slate-400 mt-0.5">
							This amount could be lost if an exchange is hacked, insolvent, or freezes withdrawals.
						</p>
					</div>
				)}

				{/* Recommendation */}
				{result && risk && (
					<div className={`rounded-xl px-4 py-3 border ${risk.bgClass} ${risk.borderClass}`}>
						<p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
							Recommendation
						</p>
						<p className="text-sm text-slate-300 leading-relaxed">{result.recommendation}</p>
					</div>
				)}

				{/* Loading spinner */}
				{loading && (
					<div className="flex justify-center py-2">
						<div className="w-4 h-4 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />
					</div>
				)}
			</CardContent>
		</Card>
	);
}
