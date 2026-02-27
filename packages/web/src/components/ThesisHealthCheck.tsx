import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────────────

type ThesisRating = "strengthening" | "stable" | "weakening" | null;

type ThesisAnswers = {
	scarcity: ThesisRating;
	decentralization: ThesisRating;
	adoption: ThesisRating;
	networkSecurity: ThesisRating;
	regulatoryClarity: ThesisRating;
	developerActivity: ThesisRating;
	storeOfValue: ThesisRating;
};

type PropertyKey = keyof ThesisAnswers;

interface ThesisProperty {
	key: PropertyKey;
	name: string;
	description: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "timecell_thesis";

const THESIS_PROPERTIES: ThesisProperty[] = [
	{
		key: "scarcity",
		name: "Scarcity",
		description: "Fixed 21M supply, halving schedule holding",
	},
	{
		key: "decentralization",
		name: "Decentralization",
		description: "Network hash rate distribution, node count",
	},
	{
		key: "adoption",
		name: "Adoption",
		description: "Institutional, retail, and sovereign adoption trends",
	},
	{
		key: "networkSecurity",
		name: "Network Security",
		description: "Hash rate, attack cost, uptime record",
	},
	{
		key: "regulatoryClarity",
		name: "Regulatory Clarity",
		description: "ETF approvals, legal status, government stance",
	},
	{
		key: "developerActivity",
		name: "Developer Activity",
		description: "Protocol development, L2 ecosystem growth",
	},
	{
		key: "storeOfValue",
		name: "Store of Value",
		description: "Gold comparison, inflation hedge perception",
	},
];

const EMPTY_ANSWERS: ThesisAnswers = {
	scarcity: null,
	decentralization: null,
	adoption: null,
	networkSecurity: null,
	regulatoryClarity: null,
	developerActivity: null,
	storeOfValue: null,
};

const RATINGS: { value: ThesisRating; label: string }[] = [
	{ value: "strengthening", label: "Strengthening" },
	{ value: "stable", label: "Stable" },
	{ value: "weakening", label: "Weakening" },
];

// ── Scoring ────────────────────────────────────────────────────────────────

type ThesisBadge = "strong" | "mixed" | "weakening";

interface ThesisScore {
	strengthening: number;
	stable: number;
	weakening: number;
	answered: number;
	badge: ThesisBadge;
}

function scoreThesis(answers: ThesisAnswers): ThesisScore {
	const values = Object.values(answers);
	const answered = values.filter((v) => v !== null).length;
	const strengthening = values.filter((v) => v === "strengthening").length;
	const stable = values.filter((v) => v === "stable").length;
	const weakening = values.filter((v) => v === "weakening").length;

	let badge: ThesisBadge;
	if (strengthening >= 5) badge = "strong";
	else if (strengthening >= 3) badge = "mixed";
	else badge = "weakening";

	return { strengthening, stable, weakening, answered, badge };
}

// ── Badge Config ───────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<
	ThesisBadge,
	{ label: string; color: string; bg: string; border: string; barColor: string }
> = {
	strong: {
		label: "Thesis Strong",
		color: "text-emerald-400",
		bg: "bg-emerald-500/15",
		border: "border-emerald-500/40",
		barColor: "bg-emerald-500",
	},
	mixed: {
		label: "Thesis Mixed",
		color: "text-amber-400",
		bg: "bg-amber-500/15",
		border: "border-amber-500/40",
		barColor: "bg-amber-500",
	},
	weakening: {
		label: "Thesis Weakening",
		color: "text-red-400",
		bg: "bg-red-500/15",
		border: "border-red-500/40",
		barColor: "bg-red-500",
	},
};

// ── Rating Toggle ──────────────────────────────────────────────────────────

function RatingToggle({
	value,
	onChange,
}: {
	value: ThesisRating;
	onChange: (v: ThesisRating) => void;
}) {
	return (
		<div className="flex gap-1">
			{RATINGS.map((r) => {
				const isSelected = value === r.value;
				const colorClass =
					r.value === "strengthening"
						? isSelected
							? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
							: "bg-slate-800/60 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
						: r.value === "weakening"
							? isSelected
								? "bg-red-500/20 border-red-500/50 text-red-300"
								: "bg-slate-800/60 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
							: isSelected
								? "bg-slate-600/40 border-slate-500/60 text-slate-200"
								: "bg-slate-800/60 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300";

				return (
					<button
						key={r.value}
						type="button"
						onClick={() => onChange(isSelected ? null : r.value)}
						className={`text-[10px] px-2 py-1 rounded border transition-all touch-manipulation leading-tight ${colorClass}`}
					>
						{r.label}
					</button>
				);
			})}
		</div>
	);
}

// ── Summary Badge (collapsed state) ───────────────────────────────────────

function SummaryBadge({
	score,
	answered,
	total,
}: {
	score: ThesisScore;
	answered: number;
	total: number;
}) {
	if (answered === 0) {
		return (
			<span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/50 text-slate-400">
				Not assessed
			</span>
		);
	}

	const cfg = BADGE_CONFIG[score.badge];

	return (
		<div className="flex items-center gap-2">
			<span
				className={`text-xs px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} font-medium`}
			>
				{cfg.label}
			</span>
			<span className="text-xs text-slate-500">
				{score.strengthening}/{total} strengthening
			</span>
		</div>
	);
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ThesisHealthCheck() {
	const [answers, setAnswers] = useState<ThesisAnswers>(EMPTY_ANSWERS);
	const [collapsed, setCollapsed] = useState(true);

	// Load from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved) as { answers: ThesisAnswers; collapsed: boolean };
				setAnswers({ ...EMPTY_ANSWERS, ...(parsed.answers ?? {}) });
				// Respect saved collapsed state only if they had answered some
				if (parsed.collapsed !== undefined) {
					setCollapsed(parsed.collapsed);
				}
			}
		} catch {
			// ignore corrupt storage
		}
	}, []);

	// Persist to localStorage on change
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, collapsed }));
		} catch {
			// ignore write failure
		}
	}, [answers, collapsed]);

	const score = scoreThesis(answers);
	const total = THESIS_PROPERTIES.length;
	const cfg = BADGE_CONFIG[score.badge];

	function handleRating(key: PropertyKey, value: ThesisRating) {
		setAnswers((prev) => ({ ...prev, [key]: value }));
	}

	function handleReset() {
		setAnswers(EMPTY_ANSWERS);
	}

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				{/* Header row — always visible */}
				<div className="flex items-start justify-between gap-3 mb-1">
					<button
						type="button"
						onClick={() => setCollapsed((c) => !c)}
						className="flex items-center gap-2 text-left group flex-1 min-w-0"
					>
						<span
							className={`inline-block w-3 h-3 border-r-2 border-b-2 border-slate-500 transform transition-transform duration-200 flex-shrink-0 ${
								collapsed ? "rotate-45 -translate-y-0.5" : "-rotate-[135deg] translate-y-0.5"
							}`}
						/>
						<h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-slate-200 transition-colors">
							Thesis Health Check
						</h3>
					</button>
					{score.answered > 0 && !collapsed && (
						<button
							type="button"
							onClick={handleReset}
							className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
						>
							Reset
						</button>
					)}
				</div>

				{/* Subtitle */}
				<p className="text-xs text-slate-400 mb-3 ml-5">
					Is each property of the Bitcoin thesis getting stronger or weaker? (Framework Part 1.3)
				</p>

				{/* Summary badge — always visible */}
				<div className="mb-3 ml-5">
					<SummaryBadge score={score} answered={score.answered} total={total} />
				</div>

				{/* Expanded content */}
				{!collapsed && (
					<>
						{/* Score bar */}
						{score.answered > 0 && (
							<div className="mb-4 ml-5 space-y-1.5">
								<div className="flex items-center justify-between text-xs">
									<span className="text-slate-500">Overall thesis</span>
									<span className={`font-mono font-semibold ${cfg.color}`}>
										{score.strengthening} strengthening · {score.weakening} weakening
									</span>
								</div>
								<div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden flex">
									{/* Green bar for strengthening */}
									<div
										className="h-full bg-emerald-500 transition-all duration-500"
										style={{ width: `${(score.strengthening / total) * 100}%` }}
									/>
									{/* Gray bar for stable */}
									<div
										className="h-full bg-slate-600 transition-all duration-500"
										style={{ width: `${(score.stable / total) * 100}%` }}
									/>
									{/* Red bar for weakening */}
									<div
										className="h-full bg-red-500 transition-all duration-500"
										style={{ width: `${(score.weakening / total) * 100}%` }}
									/>
								</div>
								<div className="flex items-center gap-3 text-[10px] text-slate-500">
									<span className="flex items-center gap-1">
										<span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
										Strengthening
									</span>
									<span className="flex items-center gap-1">
										<span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
										Stable
									</span>
									<span className="flex items-center gap-1">
										<span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
										Weakening
									</span>
								</div>
							</div>
						)}

						{/* Property cards grid */}
						<div className="grid grid-cols-1 gap-2">
							{THESIS_PROPERTIES.map((prop) => {
								const rating = answers[prop.key];
								const isAnswered = rating !== null;

								const cardBorder =
									rating === "strengthening"
										? "border-emerald-500/25"
										: rating === "weakening"
											? "border-red-500/25"
											: isAnswered
												? "border-slate-600/60"
												: "border-slate-700/60";

								const cardBg =
									rating === "strengthening"
										? "bg-emerald-950/20"
										: rating === "weakening"
											? "bg-red-950/20"
											: "bg-slate-900/30";

								return (
									<div
										key={prop.key}
										className={`rounded-lg border px-3 py-2.5 transition-colors duration-150 ${cardBorder} ${cardBg}`}
									>
										<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
											{/* Property info */}
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-slate-200 leading-snug">
													{prop.name}
												</p>
												<p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
													{prop.description}
												</p>
											</div>

											{/* 3-state toggle */}
											<div className="flex-shrink-0">
												<RatingToggle
													value={rating}
													onChange={(v) => handleRating(prop.key, v)}
												/>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{/* Thesis verdict (shown when all 7 answered) */}
						{score.answered === total && (
							<div
								className={`mt-4 rounded-xl border px-4 py-3 transition-all duration-300 ${cfg.border} ${cfg.bg}`}
							>
								<div className="flex items-center gap-2 mb-1">
									<span className={`text-base font-bold ${cfg.color}`}>{cfg.label}</span>
								</div>
								<p className="text-xs text-slate-400 leading-relaxed">
									{score.badge === "strong"
										? `${score.strengthening} of 7 thesis properties are strengthening. The foundational case for Bitcoin is intact. Conviction is well-supported by on-chain and macro trends.`
										: score.badge === "mixed"
											? `${score.strengthening} of 7 thesis properties are strengthening, ${score.weakening} weakening. Mixed signals — revisit your allocation sizing and de-risk triggers.`
											: `Only ${score.strengthening} of 7 thesis properties are strengthening. The thesis is under pressure. Consider reducing allocation or tightening your de-risk triggers.`}
								</p>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
