import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────────────

type Stage = "Learning" | "Tested" | "Systems";

type Answers = {
	holdingDuration: "lt1" | "1to2" | "2to5" | "5plus" | null;
	survivedDrawdown: "yes" | "no" | null;
	writtenRules: "yes" | "no" | null;
	panicSold: "yes" | "no" | "na" | null;
	sizingMethod: "framework" | "gut" | "mix" | null;
	usesHedging: "yes" | "no" | "unknown" | null;
};

type Question = {
	id: keyof Answers;
	text: string;
	options: { value: string; label: string }[];
};

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "timecell_journey";

const QUESTIONS: Question[] = [
	{
		id: "holdingDuration",
		text: "How long have you held Bitcoin?",
		options: [
			{ value: "lt1", label: "Less than 1 year" },
			{ value: "1to2", label: "1–2 years" },
			{ value: "2to5", label: "2–5 years" },
			{ value: "5plus", label: "5+ years" },
		],
	},
	{
		id: "survivedDrawdown",
		text: "Have you experienced an 80%+ drawdown while holding?",
		options: [
			{ value: "yes", label: "Yes" },
			{ value: "no", label: "No" },
		],
	},
	{
		id: "writtenRules",
		text: "Do you have written buy/sell rules?",
		options: [
			{ value: "yes", label: "Yes" },
			{ value: "no", label: "No" },
		],
	},
	{
		id: "panicSold",
		text: "Have you ever panic sold during a crash?",
		options: [
			{ value: "yes", label: "Yes" },
			{ value: "no", label: "No, I held" },
			{ value: "na", label: "Haven't been through one" },
		],
	},
	{
		id: "sizingMethod",
		text: "Is your position sizing based on a framework or gut feeling?",
		options: [
			{ value: "framework", label: "Framework / Rules" },
			{ value: "mix", label: "Mix of both" },
			{ value: "gut", label: "Gut feeling" },
		],
	},
	{
		id: "usesHedging",
		text: "Do you use hedging or insurance strategies?",
		options: [
			{ value: "yes", label: "Yes" },
			{ value: "no", label: "No, but I understand them" },
			{ value: "unknown", label: "Don't know what this is" },
		],
	},
];

const STAGE_INFO: Record<
	Stage,
	{
		label: string;
		index: number;
		color: string;
		bgColor: string;
		borderColor: string;
		dotColor: string;
		description: string;
		focus: string;
		next: string;
		tips: string[];
	}
> = {
	Learning: {
		label: "Learning",
		index: 0,
		color: "text-sky-400",
		bgColor: "bg-sky-500/15",
		borderColor: "border-sky-500/40",
		dotColor: "bg-sky-400",
		description:
			"You're in the reading-and-absorbing phase. Volatility is new and emotionally challenging. The biggest risk here is buying too much before conviction is earned, or dismissing Bitcoin because someone you respect called it worthless.",
		focus: "Keep positions small (1–3%). Start DCA. Read widely. Your first milestone: survive a −30% drop without selling.",
		next: "Milestone to advance: survive your first major drawdown without panic selling.",
		tips: [
			"Focus on education over allocation — understanding first, size later.",
			"Keep positions small enough that a crash won't force a lifestyle change.",
			"Don't overreact to volatility — it's the tuition for the Tested stage.",
		],
	},
	Tested: {
		label: "Tested",
		index: 1,
		color: "text-amber-400",
		bgColor: "bg-amber-500/15",
		borderColor: "border-amber-500/40",
		dotColor: "bg-amber-400",
		description:
			"You've lived through at least one major correction. If you held, your conviction is now earned, not borrowed. If you sold in panic, that's valuable information about your real risk tolerance — not a failure.",
		focus: "If conviction deepened, increase allocation deliberately. Build written rules before the next crash, not during it.",
		next: "Milestone to advance: hold through a full cycle (crash AND recovery). See the pattern with real money at stake.",
		tips: [
			"Document your rules now, while you're calm — not during the next crash.",
			"Build systematic de-risk triggers based on Temperature, not emotion.",
			"Increase allocation slowly with evidence, not excitement.",
		],
	},
	Systems: {
		label: "Systems",
		index: 2,
		color: "text-emerald-400",
		bgColor: "bg-emerald-500/15",
		borderColor: "border-emerald-500/40",
		dotColor: "bg-emerald-400",
		description:
			"Your thinking has shifted from 'should I own Bitcoin?' to 'how do I structure my life around this position?' Buying and selling decisions are rule-based. You don't check the price daily.",
		focus: "Build the safety net (barbell / buckets). Consider downside insurance. Think about custody, tax efficiency, estate planning, generational transfer.",
		next: "You're at the destination. Now optimize and mentor.",
		tips: [
			"Optimize tax efficiency — a single jurisdiction change can save 20–40% of portfolio value.",
			"Consider downside insurance (put options, 1–3% annual cost) to protect compounding.",
			"Share what you've learned — helping others is the Systems-stage contribution.",
		],
	},
};

// ── Scoring ────────────────────────────────────────────────────────────────

function scoreAnswers(answers: Answers): Stage {
	let systemsPoints = 0;
	let testedPoints = 0;
	let learningPoints = 0;

	// Holding duration
	if (answers.holdingDuration === "5plus") systemsPoints += 3;
	else if (answers.holdingDuration === "2to5") testedPoints += 3;
	else if (answers.holdingDuration === "1to2") testedPoints += 1;
	else if (answers.holdingDuration === "lt1") learningPoints += 3;

	// Survived drawdown
	if (answers.survivedDrawdown === "yes") testedPoints += 2;
	else learningPoints += 2;

	// Written rules
	if (answers.writtenRules === "yes") systemsPoints += 3;
	else learningPoints += 1;

	// Panic sold
	if (answers.panicSold === "yes") learningPoints += 2;
	else if (answers.panicSold === "no") testedPoints += 2;
	else learningPoints += 1; // na — hasn't been tested

	// Sizing method
	if (answers.sizingMethod === "framework") systemsPoints += 2;
	else if (answers.sizingMethod === "mix") testedPoints += 1;
	else learningPoints += 2;

	// Hedging
	if (answers.usesHedging === "yes") systemsPoints += 2;
	else if (answers.usesHedging === "no") testedPoints += 1;
	else learningPoints += 2; // unknown

	// Determine stage
	const max = Math.max(systemsPoints, testedPoints, learningPoints);
	if (systemsPoints === max) return "Systems";
	if (testedPoints === max) return "Tested";
	return "Learning";
}

function isComplete(answers: Answers): boolean {
	return Object.values(answers).every((v) => v !== null);
}

// ── Stage Progress Bar ─────────────────────────────────────────────────────

function StageBar({ stage }: { stage: Stage }) {
	const stages: Stage[] = ["Learning", "Tested", "Systems"];
	const activeIndex = STAGE_INFO[stage].index;

	return (
		<div className="flex items-center gap-0 mb-6">
			{stages.map((s, i) => {
				const info = STAGE_INFO[s];
				const isActive = s === stage;
				const isPast = i < activeIndex;

				return (
					<div key={s} className="flex items-center flex-1">
						{/* Connector line before (skip first) */}
						{i > 0 && (
							<div
								className={`flex-1 h-0.5 transition-colors ${
									isPast || isActive ? "bg-gradient-to-r from-slate-600 to-slate-600" : "bg-slate-700"
								}`}
							/>
						)}

						{/* Stage node */}
						<div className="flex flex-col items-center gap-1.5 flex-shrink-0">
							<div
								className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
									isActive
										? `${info.bgColor} ${info.borderColor}`
										: isPast
											? "bg-slate-700/50 border-slate-600"
											: "bg-slate-800/50 border-slate-700"
								}`}
							>
								{isPast ? (
									<svg
										className="w-4 h-4 text-slate-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2.5}
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								) : isActive ? (
									<div className={`w-3 h-3 rounded-full ${info.dotColor} animate-pulse`} />
								) : (
									<div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
								)}
							</div>
							<span
								className={`text-xs font-medium ${
									isActive ? info.color : isPast ? "text-slate-500" : "text-slate-600"
								}`}
							>
								{s}
							</span>
						</div>

						{/* Connector line after (skip last) */}
						{i < stages.length - 1 && (
							<div
								className={`flex-1 h-0.5 transition-colors ${
									i < activeIndex ? "bg-slate-600" : "bg-slate-700"
								}`}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

// ── Warning Banner ─────────────────────────────────────────────────────────

function AllocationWarning({ btcPercentage, stage }: { btcPercentage: number; stage: Stage }) {
	const isLearning = stage === "Learning";
	const isTested = stage === "Tested";

	if (isLearning && btcPercentage > 10) {
		return (
			<div className="mt-4 rounded-lg border border-red-500/30 bg-red-900/15 px-3 py-2.5">
				<div className="flex items-start gap-2">
					<span className="text-red-400 text-sm flex-shrink-0 mt-0.5">!</span>
					<div>
						<p className="text-xs font-medium text-red-400 mb-1">Allocation mismatch</p>
						<p className="text-xs text-red-300/70 leading-relaxed">
							Your {btcPercentage}% BTC allocation is high for a Learning-stage investor. The framework
							recommends 1–3% while you're building conviction. A crash at this size could force an
							emotional decision.
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (isTested && btcPercentage > 25) {
		return (
			<div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-900/15 px-3 py-2.5">
				<div className="flex items-start gap-2">
					<span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">!</span>
					<div>
						<p className="text-xs font-medium text-amber-400 mb-1">High allocation for Tested stage</p>
						<p className="text-xs text-amber-300/70 leading-relaxed">
							At {btcPercentage}% BTC, the framework gates apply: multi-cycle experience, 2 years of
							expenses outside BTC, and written de-risk triggers. Make sure you've cleared them.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return null;
}

// ── Main Component ─────────────────────────────────────────────────────────

const EMPTY_ANSWERS: Answers = {
	holdingDuration: null,
	survivedDrawdown: null,
	writtenRules: null,
	panicSold: null,
	sizingMethod: null,
	usesHedging: null,
};

export function JourneyTracker({ btcPercentage }: { btcPercentage: number }) {
	const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
	const [showResult, setShowResult] = useState(false);

	// Load from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved) as { answers: Answers; showResult: boolean };
				setAnswers(parsed.answers ?? EMPTY_ANSWERS);
				setShowResult(parsed.showResult ?? false);
			}
		} catch {
			// ignore corrupt storage
		}
	}, []);

	// Persist to localStorage on change
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, showResult }));
		} catch {
			// ignore write failure
		}
	}, [answers, showResult]);

	const complete = isComplete(answers);
	const stage = complete ? scoreAnswers(answers) : null;
	const stageInfo = stage ? STAGE_INFO[stage] : null;

	function handleAnswer(id: keyof Answers, value: string) {
		setAnswers((prev) => ({ ...prev, [id]: value as never }));
		setShowResult(false);
	}

	function handleReset() {
		setAnswers(EMPTY_ANSWERS);
		setShowResult(false);
	}

	const answeredCount = Object.values(answers).filter((v) => v !== null).length;
	const totalQuestions = QUESTIONS.length;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				{/* Header */}
				<div className="flex items-start justify-between gap-4 mb-1">
					<h3 className="text-base sm:text-lg font-semibold text-white">Bitcoin Journey Stage</h3>
					{answeredCount > 0 && (
						<button
							type="button"
							onClick={handleReset}
							className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
						>
							Reset
						</button>
					)}
				</div>
				<p className="text-xs text-slate-400 mb-5">
					Where are you in your Bitcoin journey? (Framework Part 8)
				</p>

				{/* Questionnaire */}
				<div className="space-y-4 mb-5">
					{QUESTIONS.map((q, qi) => (
						<div key={q.id}>
							<p className="text-xs font-medium text-slate-300 mb-2">
								<span className="text-slate-500 mr-1.5">{qi + 1}.</span>
								{q.text}
							</p>
							<div className="flex flex-wrap gap-2">
								{q.options.map((opt) => {
									const isSelected = answers[q.id] === opt.value;
									return (
										<button
											key={opt.value}
											type="button"
											onClick={() => handleAnswer(q.id, opt.value)}
											className={`text-xs px-3 py-1.5 rounded-lg border transition-all touch-manipulation ${
												isSelected
													? "bg-orange-500/20 border-orange-500/50 text-orange-300"
													: "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
											}`}
										>
											{opt.label}
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>

				{/* Progress and submit */}
				{!showResult && (
					<div className="flex items-center gap-4">
						{/* Progress bar */}
						<div className="flex-1">
							<div className="h-1 bg-slate-700 rounded-full overflow-hidden">
								<div
									className="h-full bg-orange-500/60 rounded-full transition-all duration-300"
									style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
								/>
							</div>
						</div>
						<span className="text-xs text-slate-500 flex-shrink-0">
							{answeredCount}/{totalQuestions}
						</span>
						{complete && (
							<button
								type="button"
								onClick={() => setShowResult(true)}
								className="text-xs px-4 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/50 text-orange-300 hover:bg-orange-500/30 transition-colors flex-shrink-0"
							>
								See my stage →
							</button>
						)}
					</div>
				)}

				{/* Result */}
				{showResult && stage && stageInfo && (
					<div className={`rounded-xl border ${stageInfo.borderColor} ${stageInfo.bgColor} p-4`}>
						{/* Stage progress bar */}
						<StageBar stage={stage} />

						{/* Stage headline */}
						<div className="mb-3">
							<div className="flex items-center gap-2 mb-1">
								<span className={`text-lg font-bold ${stageInfo.color}`}>Stage: {stage}</span>
								<div className={`w-2 h-2 rounded-full ${stageInfo.dotColor} animate-pulse`} />
							</div>
							<p className="text-xs text-slate-400 leading-relaxed">{stageInfo.description}</p>
						</div>

						{/* Divider */}
						<div className="border-t border-slate-700/50 my-3" />

						{/* Focus */}
						<div className="mb-3">
							<p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
								Focus now
							</p>
							<p className="text-xs text-slate-300 leading-relaxed">{stageInfo.focus}</p>
						</div>

						{/* Tips */}
						<div className="mb-3">
							<p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
								Personalized tips
							</p>
							<ul className="space-y-1.5">
								{stageInfo.tips.map((tip) => (
									<li key={tip} className="flex items-start gap-2">
										<span className={`text-sm flex-shrink-0 leading-none mt-0.5 ${stageInfo.color}`}>
											›
										</span>
										<span className="text-xs text-slate-300 leading-relaxed">{tip}</span>
									</li>
								))}
							</ul>
						</div>

						{/* Next milestone */}
						<div className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2">
							<p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
								Next milestone
							</p>
							<p className="text-xs text-slate-400 leading-relaxed">{stageInfo.next}</p>
						</div>

						{/* Allocation warning */}
						<AllocationWarning btcPercentage={btcPercentage} stage={stage} />

						{/* Retake */}
						<div className="mt-3 text-right">
							<button
								type="button"
								onClick={() => setShowResult(false)}
								className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
							>
								Edit answers
							</button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
