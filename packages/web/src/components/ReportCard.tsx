import { useEffect, useState, useCallback, useRef } from "react";
import type { SurvivalResult, PortfolioInput } from "../hooks/usePortfolio";
import { generateActionPlanLocally } from "../lib/engine-standalone";
import { exportReportCardPdf } from "../utils/exportPdf";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionSeverity = "red" | "amber" | "green";

interface ActionItem {
	severity: ActionSeverity;
	message: string;
	rule: string;
}

// ---------------------------------------------------------------------------
// Conviction Ladder (local copy to avoid circular deps)
// ---------------------------------------------------------------------------

const RUNGS = [
	{ level: 6, name: "Single-Asset Core", range: "50%+", min: 50 },
	{ level: 5, name: "Owner-Class", range: "25-50%", min: 25 },
	{ level: 4, name: "High Conviction", range: "10-25%", min: 10 },
	{ level: 3, name: "Diversifier", range: "5-10%", min: 5 },
	{ level: 2, name: "Experimenter", range: "1-3%", min: 1 },
	{ level: 1, name: "Observer", range: "0%", min: 0 },
] as const;

function getConvictionRung(btcPct: number) {
	if (btcPct >= 50) return RUNGS[0];
	if (btcPct >= 25) return RUNGS[1];
	if (btcPct >= 10) return RUNGS[2];
	if (btcPct >= 5) return RUNGS[3];
	if (btcPct >= 1) return RUNGS[4];
	return RUNGS[5];
}

// ---------------------------------------------------------------------------
// Temperature zone helper
// ---------------------------------------------------------------------------

type TemperatureZone = "Extreme Fear" | "Fear" | "Neutral" | "Caution" | "Greed" | "Extreme Greed";

function getTemperatureZone(score: number): TemperatureZone {
	if (score < 20) return "Extreme Fear";
	if (score < 40) return "Fear";
	if (score < 60) return "Neutral";
	if (score < 70) return "Caution";
	if (score < 80) return "Greed";
	return "Extreme Greed";
}

function temperatureColor(score: number): string {
	if (score < 30) return "#3b82f6";
	if (score < 50) return "#22c55e";
	if (score < 60) return "#eab308";
	if (score < 70) return "#facc15";
	if (score < 80) return "#f97316";
	return "#ef4444";
}

function temperatureTextClass(zone: TemperatureZone): string {
	switch (zone) {
		case "Extreme Fear": return "text-blue-400";
		case "Fear": return "text-green-400";
		case "Neutral": return "text-yellow-400";
		case "Caution": return "text-yellow-300";
		case "Greed": return "text-orange-400";
		case "Extreme Greed": return "text-red-400";
	}
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtCurrency(n: number, symbol = "$", rate = 1): string {
	const converted = n * rate;
	const abs = Math.abs(converted);
	if (abs >= 1_000_000) return `${symbol}${(converted / 1_000_000).toFixed(2)}M`;
	if (abs >= 1_000) return `${symbol}${(converted / 1_000).toFixed(1)}K`;
	return `${symbol}${Math.round(converted).toLocaleString("en-US")}`;
}

function formatMonths(months: number): string {
	if (months === Number.POSITIVE_INFINITY) return "\u221e";
	if (months > 120) return "120+";
	return `${Math.round(months)}`;
}

// ---------------------------------------------------------------------------
// Severity styling for action items
// ---------------------------------------------------------------------------

function severityDotClass(severity: ActionSeverity): string {
	switch (severity) {
		case "red": return "bg-red-400";
		case "amber": return "bg-amber-400";
		case "green": return "bg-emerald-400";
	}
}

function severityTextClass(severity: ActionSeverity): string {
	switch (severity) {
		case "red": return "text-red-400";
		case "amber": return "text-amber-400";
		case "green": return "text-emerald-400";
	}
}

// ---------------------------------------------------------------------------
// Score color logic (matches SurvivalHero)
// ---------------------------------------------------------------------------

function getScoreStyle(maxDrawdown: number, ruinPassed: boolean) {
	if (!ruinPassed) return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
	if (maxDrawdown >= 80) return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
	if (maxDrawdown >= 70) return { text: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/20" };
	if (maxDrawdown >= 50) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" };
	return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReportCardProps {
	portfolio: PortfolioInput;
	result: SurvivalResult | null;
	temperatureScore: number;
	currencySymbol: string;
	currencyRate?: number;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ReportCard({ portfolio, result, temperatureScore, currencySymbol, currencyRate = 1 }: ReportCardProps) {
	const [actionItems, setActionItems] = useState<ActionItem[]>([]);
	const [exporting, setExporting] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleExport = useCallback(async () => {
		if (!containerRef.current) return;
		setExporting(true);
		try {
			await exportReportCardPdf(containerRef.current);
		} finally {
			setExporting(false);
		}
	}, []);

	// Calculate action plan items locally
	useEffect(() => {
		if (!result) return;
		try {
			const worstScenario = result.scenarios[result.scenarios.length - 1];
			const items = generateActionPlanLocally({
				btcPercentage: portfolio.btcPercentage,
				ruinTestPassed: result.ruinTestPassed,
				runwayMonths: worstScenario?.runwayMonths ?? Number.POSITIVE_INFINITY,
				temperatureScore,
				liquidReserveUsd: portfolio.liquidReserveUsd,
				monthlyBurnUsd: portfolio.monthlyBurnUsd,
				totalValueUsd: portfolio.totalValueUsd,
			});
			setActionItems(items as ActionItem[]);
		} catch {
			setActionItems([]);
		}
	}, [portfolio, result, temperatureScore]);

	if (!result) return null;

	const { maxSurvivableDrawdown, ruinTestPassed, scenarios } = result;
	const worstCase = scenarios[scenarios.length - 1]; // 80% drawdown
	const scoreStyle = getScoreStyle(maxSurvivableDrawdown, ruinTestPassed);
	const rung = getConvictionRung(portfolio.btcPercentage);
	const tempZone = getTemperatureZone(temperatureScore);
	const tempColor = temperatureColor(temperatureScore);

	// Sleep test: worst case portfolio loss
	const worstCaseLoss = portfolio.totalValueUsd - worstCase.netPosition;

	// Date stamp
	const now = new Date();
	const dateStr = now.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	// Top 3 action items (prioritize red > amber > green)
	const sortedActions = [...actionItems].sort((a, b) => {
		const order = { red: 0, amber: 1, green: 2 };
		return order[a.severity] - order[b.severity];
	});
	const topActions = sortedActions.slice(0, 3);

	return (
		<div ref={containerRef} className="rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
			{/* Header bar */}
			<div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/60">
				<div className="flex items-center gap-3">
					<img src="/logo.png" alt="TimeCell" className="h-6 brightness-110" />
					<span className="text-sm font-semibold text-slate-300">Portfolio Report Card</span>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-xs text-slate-500">{dateStr}</span>
					{/* Export PDF button */}
					<button
						type="button"
						onClick={handleExport}
						disabled={exporting}
						className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{exporting ? (
							<>
								{/* Spinner */}
								<svg
									className="animate-spin h-3.5 w-3.5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
									/>
								</svg>
								Generating…
							</>
						) : (
							<>
								{/* Download icon */}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="7 10 12 15 17 10" />
									<line x1="12" x2="12" y1="3" y2="15" />
								</svg>
								Export PDF
							</>
						)}
					</button>
				</div>
			</div>

			{/* Content grid */}
			<div className="p-5 sm:p-6 space-y-5">
				{/* Row 1: Survival Score (hero) + Ruin Test */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{/* Survival Score */}
					<div className={`rounded-xl ${scoreStyle.bg} border ${scoreStyle.border} p-5 text-center`}>
						<p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
							Max Survivable Crash
						</p>
						<div className="flex items-baseline justify-center gap-1">
							<span className={`text-6xl sm:text-7xl font-black tabular-nums tracking-tight ${scoreStyle.text}`}>
								{maxSurvivableDrawdown}
							</span>
							<span className={`text-2xl sm:text-3xl font-bold ${scoreStyle.text} opacity-70`}>%</span>
						</div>
						<p className="text-xs text-slate-500 mt-2">drawdown before forced selling</p>
						<div className="mt-3 text-xs text-slate-400">
							Worst-case runway:{" "}
							<span className={`font-bold ${
								worstCase.runwayMonths >= 18 ? "text-emerald-400"
								: worstCase.runwayMonths >= 6 ? "text-amber-400"
								: "text-red-400"
							}`}>
								{formatMonths(worstCase.runwayMonths)} months
							</span>
						</div>
					</div>

					{/* Ruin Test + Sleep Test */}
					<div className="space-y-4">
						{/* Ruin Test Badge */}
						<div className={`rounded-xl p-4 border ${
							ruinTestPassed
								? "bg-emerald-500/10 border-emerald-500/30"
								: "bg-red-500/10 border-red-500/30"
						}`}>
							<div className="flex items-center gap-3">
								<span className={`text-3xl ${ruinTestPassed ? "text-emerald-400" : "text-red-400"}`}>
									{ruinTestPassed ? "\u2713" : "\u2717"}
								</span>
								<div>
									<p className={`text-lg font-bold ${ruinTestPassed ? "text-emerald-400" : "text-red-400"}`}>
										Ruin Test {ruinTestPassed ? "PASSED" : "FAILED"}
									</p>
									<p className="text-xs text-slate-400">
										BTC -80% & assets -40% simultaneously
									</p>
								</div>
							</div>
						</div>

						{/* Sleep Test */}
						<div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
							<p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Sleep Test</p>
							<p className="text-sm text-slate-300">
								Worst-case loss:{" "}
								<span className={`font-bold text-lg ${
									worstCaseLoss > portfolio.totalValueUsd * 0.7 ? "text-red-400"
									: worstCaseLoss > portfolio.totalValueUsd * 0.5 ? "text-amber-400"
									: "text-emerald-400"
								}`}>
									{fmtCurrency(worstCaseLoss, currencySymbol, currencyRate)}
								</span>
							</p>
							<p className="text-xs text-slate-500 mt-1">
								Portfolio drops from {fmtCurrency(portfolio.totalValueUsd, currencySymbol, currencyRate)} to{" "}
								{fmtCurrency(worstCase.netPosition, currencySymbol, currencyRate)} in an 80% crash
							</p>
						</div>
					</div>
				</div>

				{/* Row 2: Conviction + Temperature */}
				<div className="grid grid-cols-2 gap-4">
					{/* Conviction Rung */}
					<div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
						<p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Conviction Rung</p>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-lg">
								{rung.level}
							</div>
							<div>
								<p className="text-sm font-semibold text-orange-400">{rung.name}</p>
								<p className="text-xs text-slate-400">
									{portfolio.btcPercentage}% BTC allocation ({rung.range})
								</p>
							</div>
						</div>
					</div>

					{/* Temperature */}
					<div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
						<p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Market Temperature</p>
						<div className="flex items-center gap-3">
							<span
								className="text-4xl font-black tabular-nums"
								style={{ color: tempColor }}
							>
								{temperatureScore}
							</span>
							<div>
								<p className={`text-sm font-semibold ${temperatureTextClass(tempZone)}`}>
									{tempZone}
								</p>
								<p className="text-xs text-slate-400">
									MVRV + RHODL composite
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Row 3: Top 3 Action Items */}
				{topActions.length > 0 && (
					<div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
						<p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
							Top Actions
						</p>
						<div className="space-y-2">
							{topActions.map((item) => (
								<div key={item.rule} className="flex items-start gap-2.5">
									<span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${severityDotClass(item.severity)}`} />
									<p className={`text-sm leading-snug ${severityTextClass(item.severity)}`}>
										{item.message}
									</p>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Row 4: Portfolio snapshot */}
				<div className="grid grid-cols-4 gap-3">
					<div className="rounded-lg bg-slate-800/40 border border-slate-700/40 px-3 py-2.5 text-center">
						<p className="text-xs text-slate-500">Portfolio</p>
						<p className="text-sm font-bold text-slate-200 mt-0.5">
							{fmtCurrency(portfolio.totalValueUsd, currencySymbol, currencyRate)}
						</p>
					</div>
					<div className="rounded-lg bg-slate-800/40 border border-slate-700/40 px-3 py-2.5 text-center">
						<p className="text-xs text-slate-500">BTC</p>
						<p className="text-sm font-bold text-orange-400 mt-0.5">
							{portfolio.btcPercentage}%
						</p>
					</div>
					<div className="rounded-lg bg-slate-800/40 border border-slate-700/40 px-3 py-2.5 text-center">
						<p className="text-xs text-slate-500">Monthly Burn</p>
						<p className="text-sm font-bold text-slate-200 mt-0.5">
							{fmtCurrency(portfolio.monthlyBurnUsd, currencySymbol, currencyRate)}
						</p>
					</div>
					<div className="rounded-lg bg-slate-800/40 border border-slate-700/40 px-3 py-2.5 text-center">
						<p className="text-xs text-slate-500">Reserves</p>
						<p className="text-sm font-bold text-slate-200 mt-0.5">
							{fmtCurrency(portfolio.liquidReserveUsd, currencySymbol, currencyRate)}
						</p>
					</div>
				</div>
			</div>

			{/* Footer watermark */}
			<div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/50">
				<div className="flex items-center gap-2">
					<img src="/logo.png" alt="TimeCell" className="h-4 opacity-50 brightness-110" />
					<span className="text-xs text-slate-600">timecell.ai</span>
				</div>
				<p className="text-xs text-slate-600">
					Not financial advice. Consult a qualified advisor.
				</p>
			</div>
		</div>
	);
}
