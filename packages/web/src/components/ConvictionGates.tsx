import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConvictionGatesProps {
	btcPercentage: number;
	ruinTestPassed: boolean;
	sleepTestSeverity: "manageable" | "painful" | "devastating";
}

interface GateState {
	multiCycleExperience: boolean;
	twoYearExpenses: boolean;
	noForcedSaleLiabilities: boolean;
	sleepTest: boolean;
	writtenDeriskTriggers: boolean;
}

const DEFAULT_GATE_STATE: GateState = {
	multiCycleExperience: false,
	twoYearExpenses: false,
	noForcedSaleLiabilities: false,
	sleepTest: false,
	writtenDeriskTriggers: false,
};

const STORAGE_KEY = "timecell_conviction_gates";

// ---------------------------------------------------------------------------
// Gate definitions
// ---------------------------------------------------------------------------

interface GateDef {
	key: keyof GateState;
	label: string;
	description: string;
	autoCheck?: (props: ConvictionGatesProps) => boolean;
}

const GATES: GateDef[] = [
	{
		key: "multiCycleExperience",
		label: "Multi-cycle experience",
		description:
			"You have lived through at least one 80%+ Bitcoin drawdown and held without panic-selling. Knowing intellectually that crashes happen is different from surviving one emotionally.",
	},
	{
		key: "twoYearExpenses",
		label: "2 years of expenses outside BTC",
		description:
			"You hold at least 24 months of living expenses in non-Bitcoin assets (cash, bonds, or stable income). This prevents a price crash from forcing a sale at the worst moment.",
	},
	{
		key: "noForcedSaleLiabilities",
		label: "No forced-sale liabilities",
		description:
			"You have no margin loans, balloon payments, or other debt obligations that could force you to liquidate BTC at a depressed price. Your holding is truly voluntary.",
	},
	{
		key: "sleepTest",
		label: "Sleep test passed",
		description:
			"An 80% BTC crash leaves you financially uncomfortable but not ruined — you can still meet your obligations. If the potential loss would keep you up at night, allocation is too high.",
		autoCheck: (props) => props.sleepTestSeverity === "manageable",
	},
	{
		key: "writtenDeriskTriggers",
		label: "Written de-risk triggers defined",
		description:
			"You have a written plan specifying exactly when and how you will reduce exposure — e.g. 'sell 10% if BTC exceeds $500k' or 'sell 20% after halving cycle peak'. Decisions made in advance avoid emotional errors.",
	},
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadFromStorage(): GateState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULT_GATE_STATE };
		return { ...DEFAULT_GATE_STATE, ...JSON.parse(raw) };
	} catch {
		return { ...DEFAULT_GATE_STATE };
	}
}

function saveToStorage(state: GateState): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// localStorage unavailable — silently skip
	}
}

function countChecked(gates: GateState): number {
	return Object.values(gates).filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GateCheckbox({
	gate,
	checked,
	autoChecked,
	onChange,
}: {
	gate: GateDef;
	checked: boolean;
	autoChecked: boolean;
	onChange: (key: keyof GateState, value: boolean) => void;
}) {
	return (
		<label
			className={`flex gap-3 rounded-lg border px-3 py-3 cursor-pointer transition-colors duration-150 ${
				checked
					? "border-emerald-500/30 bg-emerald-950/30"
					: "border-slate-700/60 bg-slate-900/40 hover:border-slate-600/60"
			}`}
		>
			{/* Checkbox */}
			<div className="flex-shrink-0 pt-0.5">
				<input
					type="checkbox"
					checked={checked}
					disabled={autoChecked}
					onChange={(e) => onChange(gate.key, e.target.checked)}
					className="sr-only"
				/>
				<div
					className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors duration-150 ${
						checked
							? autoChecked
								? "border-emerald-500/60 bg-emerald-500/30"
								: "border-emerald-500 bg-emerald-500"
							: "border-slate-600 bg-transparent"
					}`}
				>
					{checked && (
						<svg
							viewBox="0 0 10 8"
							fill="none"
							className="w-2.5 h-2"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M1 4L3.5 6.5L9 1"
								stroke={autoChecked ? "#6ee7b7" : "white"}
								strokeWidth="1.6"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					)}
				</div>
			</div>

			{/* Text */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<span
						className={`text-sm font-medium leading-snug ${
							checked ? "text-emerald-300" : "text-slate-300"
						}`}
					>
						{gate.label}
					</span>
					{autoChecked && (
						<span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20">
							auto
						</span>
					)}
				</div>
				<p className="text-xs text-slate-500 mt-1 leading-relaxed">{gate.description}</p>
			</div>
		</label>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ConvictionGates({
	btcPercentage,
	ruinTestPassed,
	sleepTestSeverity,
}: ConvictionGatesProps) {
	const [gates, setGates] = useState<GateState>(() => loadFromStorage());

	// Apply auto-checks from props
	const resolvedGates: GateState = {
		...gates,
		sleepTest: sleepTestSeverity === "manageable" ? true : gates.sleepTest,
	};

	const checkedCount = countChecked(resolvedGates);
	const allPassed = checkedCount === 5;
	const isHighConcentration = btcPercentage >= 50;

	// Sync sleep test auto-check into stored state when severity changes to
	// "manageable" so the count reflects the auto-check correctly.
	useEffect(() => {
		if (sleepTestSeverity === "manageable" && !gates.sleepTest) {
			const updated = { ...gates, sleepTest: true };
			setGates(updated);
			saveToStorage(updated);
		}
	}, [sleepTestSeverity, gates]);

	const handleToggle = (key: keyof GateState, value: boolean) => {
		// Sleep test is auto-managed when manageable
		if (key === "sleepTest" && sleepTestSeverity === "manageable") return;
		const updated = { ...gates, [key]: value };
		setGates(updated);
		saveToStorage(updated);
	};

	// Only render when btcPercentage >= 25
	if (btcPercentage < 25) return null;

	// Status banner config
	const statusConfig = allPassed
		? {
				border: "border-emerald-500/30",
				bg: "bg-emerald-950/40",
				icon: "✓",
				iconColor: "text-emerald-400",
				text: "All gates met. Position is within framework guidelines.",
				textColor: "text-emerald-400",
			}
		: isHighConcentration
			? {
					border: "border-red-500/40",
					bg: "bg-red-950/40",
					icon: "!",
					iconColor: "text-red-400",
					text: `${checkedCount} of 5 gates met. High concentration without all gates. Reduce or complete gates.`,
					textColor: "text-red-400",
				}
			: {
					border: "border-amber-500/30",
					bg: "bg-amber-950/30",
					icon: "!",
					iconColor: "text-amber-400",
					text: `${checkedCount} of 5 gates met. Review before increasing allocation.`,
					textColor: "text-amber-400",
				};

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6 space-y-5">
				{/* Header */}
				<div>
					<div className="flex items-center gap-2 mb-0.5">
						<h3 className="text-base sm:text-lg font-semibold text-white">
							Conviction Gates
						</h3>
						<span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
							25%+ required
						</span>
					</div>
					<p className="text-xs text-slate-400">
						At {btcPercentage}% BTC, these 5 gates must be met before increasing allocation.
					</p>
				</div>

				{/* Progress bar */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<span className="text-xs text-slate-500">Gates cleared</span>
						<span
							className={`text-xs font-mono font-semibold ${
								allPassed
									? "text-emerald-400"
									: isHighConcentration
										? "text-red-400"
										: "text-amber-400"
							}`}
						>
							{checkedCount} / 5
						</span>
					</div>
					<div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
						<div
							className={`h-full rounded-full transition-all duration-500 ${
								allPassed
									? "bg-emerald-500"
									: isHighConcentration
										? "bg-red-500"
										: "bg-amber-500"
							}`}
							style={{ width: `${(checkedCount / 5) * 100}%` }}
						/>
					</div>
				</div>

				{/* Gate checkboxes */}
				<div className="space-y-2">
					{GATES.map((gate) => {
						const autoChecked =
							gate.key === "sleepTest" && sleepTestSeverity === "manageable";
						return (
							<GateCheckbox
								key={gate.key}
								gate={gate}
								checked={resolvedGates[gate.key]}
								autoChecked={autoChecked}
								onChange={handleToggle}
							/>
						);
					})}
				</div>

				{/* Ruin test context row */}
				{!ruinTestPassed && (
					<div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2.5">
						<span className="text-red-400 flex-shrink-0 mt-0.5 text-sm">✗</span>
						<p className="text-xs text-red-300/80 leading-relaxed">
							Ruin test failed — your portfolio does not survive an 80% crash with 18 months runway. Resolve survival before advancing gates.
						</p>
					</div>
				)}

				{/* Status banner */}
				<div
					className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${statusConfig.border} ${statusConfig.bg}`}
				>
					<span className={`text-lg flex-shrink-0 font-bold ${statusConfig.iconColor}`}>
						{statusConfig.icon}
					</span>
					<p className={`text-sm font-medium leading-snug ${statusConfig.textColor}`}>
						{statusConfig.text}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
