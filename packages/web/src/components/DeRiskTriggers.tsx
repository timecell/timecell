import { useCallback, useEffect, useId, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeRiskTrigger {
	id: string;
	condition: string;
	action: string;
	enabled: boolean;
	isDefault: boolean;
}

export interface DeRiskTriggersProps {
	temperatureScore: number;
	ruinTestPassed: boolean;
	runwayMonths: number;
}

// ---------------------------------------------------------------------------
// Default rules (cannot be deleted, only disabled)
// ---------------------------------------------------------------------------

const DEFAULT_TRIGGERS: DeRiskTrigger[] = [
	{
		id: "default-1",
		condition: "Temperature > 80",
		action: "Sell 10% of BTC",
		enabled: true,
		isDefault: true,
	},
	{
		id: "default-2",
		condition: "Ruin test fails",
		action: "Reduce BTC to 20%",
		enabled: true,
		isDefault: true,
	},
	{
		id: "default-3",
		condition: "Runway < 12 months",
		action: "Sell enough BTC to restore 18-month runway",
		enabled: true,
		isDefault: true,
	},
];

const STORAGE_KEY = "timecell_derisk_triggers";
const MAX_RULES = 10;

// ---------------------------------------------------------------------------
// Trigger matching — determines if a rule's condition is currently active
// ---------------------------------------------------------------------------

function isTriggerActive(
	trigger: DeRiskTrigger,
	temperatureScore: number,
	ruinTestPassed: boolean,
	runwayMonths: number,
): boolean {
	if (!trigger.enabled) return false;

	const cond = trigger.condition.trim().toLowerCase();

	// Temperature threshold checks: "temperature > N" or "temperature >= N"
	const tempGtMatch = cond.match(/temperature\s*>\s*(\d+(?:\.\d+)?)/);
	if (tempGtMatch) {
		return temperatureScore > Number(tempGtMatch[1]);
	}

	const tempGteMatch = cond.match(/temperature\s*>=\s*(\d+(?:\.\d+)?)/);
	if (tempGteMatch) {
		return temperatureScore >= Number(tempGteMatch[1]);
	}

	// Ruin test checks
	if (cond.includes("ruin test fails") || cond.includes("ruin test fail")) {
		return !ruinTestPassed;
	}

	// Runway threshold checks: "runway < N" or "runway <= N"
	const runwayLtMatch = cond.match(/runway\s*<\s*(\d+(?:\.\d+)?)/);
	if (runwayLtMatch) {
		const threshold = Number(runwayLtMatch[1]);
		const effectiveRunway = runwayMonths === Infinity ? 999 : runwayMonths;
		return effectiveRunway < threshold;
	}

	const runwayLteMatch = cond.match(/runway\s*<=\s*(\d+(?:\.\d+)?)/);
	if (runwayLteMatch) {
		const threshold = Number(runwayLteMatch[1]);
		const effectiveRunway = runwayMonths === Infinity ? 999 : runwayMonths;
		return effectiveRunway <= threshold;
	}

	return false;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function loadFromStorage(): DeRiskTrigger[] | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as DeRiskTrigger[];
		if (!Array.isArray(parsed)) return null;
		return parsed;
	} catch {
		return null;
	}
}

function saveToStorage(triggers: DeRiskTrigger[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(triggers));
	} catch {
		// silently ignore write failures (private browsing, full storage, etc.)
	}
}

// ---------------------------------------------------------------------------
// Toggle switch sub-component
// ---------------------------------------------------------------------------

interface ToggleSwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	id: string;
}

function ToggleSwitch({ checked, onChange, id }: ToggleSwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			id={id}
			onClick={() => onChange(!checked)}
			className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
				checked ? "bg-orange-500" : "bg-slate-600"
			}`}
		>
			<span
				className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
					checked ? "translate-x-4" : "translate-x-0"
				}`}
			/>
		</button>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DeRiskTriggers({
	temperatureScore,
	ruinTestPassed,
	runwayMonths,
}: DeRiskTriggersProps) {
	const newRuleBaseId = useId();
	const [triggers, setTriggers] = useState<DeRiskTrigger[]>(() => {
		const stored = loadFromStorage();
		if (stored && stored.length > 0) {
			// Merge: ensure all defaults are present (in case new defaults were added)
			const storedIds = new Set(stored.map((t) => t.id));
			const missingDefaults = DEFAULT_TRIGGERS.filter((d) => !storedIds.has(d.id));
			return [...missingDefaults, ...stored];
		}
		return DEFAULT_TRIGGERS;
	});

	// Persist on every change
	useEffect(() => {
		saveToStorage(triggers);
	}, [triggers]);

	// ---------------------------------------------------------------------------
	// Mutations
	// ---------------------------------------------------------------------------

	const updateTrigger = useCallback(
		(id: string, patch: Partial<DeRiskTrigger>) => {
			setTriggers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
		},
		[],
	);

	const deleteTrigger = useCallback((id: string) => {
		setTriggers((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const addTrigger = useCallback(() => {
		if (triggers.length >= MAX_RULES) return;
		const newTrigger: DeRiskTrigger = {
			id: `custom-${newRuleBaseId}-${Date.now()}`,
			condition: "",
			action: "",
			enabled: true,
			isDefault: false,
		};
		setTriggers((prev) => [...prev, newTrigger]);
	}, [triggers.length, newRuleBaseId]);

	// ---------------------------------------------------------------------------
	// Derived state
	// ---------------------------------------------------------------------------

	const triggeredIds = new Set(
		triggers
			.filter((t) => isTriggerActive(t, temperatureScore, ruinTestPassed, runwayMonths))
			.map((t) => t.id),
	);

	const triggeredCount = triggeredIds.size;
	const canAddMore = triggers.length < MAX_RULES;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				{/* Header */}
				<div className="flex items-start justify-between mb-1">
					<div>
						<h3 className="text-base sm:text-lg font-semibold text-white">
							De-Risk Triggers
						</h3>
						<p className="text-xs text-slate-400 mt-0.5">
							Written rules you commit to before emotions take over
						</p>
					</div>
					{triggeredCount > 0 && (
						<div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
							<span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
							<span className="text-xs font-medium text-amber-400">
								{triggeredCount} triggered
							</span>
						</div>
					)}
				</div>

				{/* Live state summary */}
				<div className="flex flex-wrap gap-2 mt-3 mb-4">
					<span className={`text-xs px-2 py-0.5 rounded-full border ${
						temperatureScore >= 80
							? "bg-red-500/10 border-red-500/30 text-red-400"
							: temperatureScore >= 70
								? "bg-amber-500/10 border-amber-500/30 text-amber-400"
								: "bg-slate-700/50 border-slate-600/50 text-slate-400"
					}`}>
						Temp: {temperatureScore}
					</span>
					<span className={`text-xs px-2 py-0.5 rounded-full border ${
						!ruinTestPassed
							? "bg-red-500/10 border-red-500/30 text-red-400"
							: "bg-slate-700/50 border-slate-600/50 text-slate-400"
					}`}>
						Ruin test: {ruinTestPassed ? "pass" : "FAIL"}
					</span>
					<span className={`text-xs px-2 py-0.5 rounded-full border ${
						runwayMonths !== Infinity && runwayMonths < 12
							? "bg-red-500/10 border-red-500/30 text-red-400"
							: runwayMonths !== Infinity && runwayMonths < 18
								? "bg-amber-500/10 border-amber-500/30 text-amber-400"
								: "bg-slate-700/50 border-slate-600/50 text-slate-400"
					}`}>
						Runway: {runwayMonths === Infinity ? "unlimited" : `${Math.round(runwayMonths)}mo`}
					</span>
				</div>

				{/* Column headers */}
				<div className="hidden sm:grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 px-1 mb-1">
					<div />
					<span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Condition</span>
					<span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Action</span>
					<div />
				</div>

				{/* Rule rows */}
				<div className="space-y-2">
					{triggers.map((trigger) => {
						const isTriggered = triggeredIds.has(trigger.id);
						return (
							<div
								key={trigger.id}
								className={`flex items-start gap-2 rounded-lg px-3 py-2.5 border transition-all duration-300 ${
									isTriggered && trigger.enabled
										? "border-amber-500/40 bg-amber-950/20"
										: trigger.enabled
											? "border-slate-700/50 bg-slate-900/30"
											: "border-slate-700/30 bg-slate-900/10 opacity-50"
								}`}
							>
								{/* Toggle */}
								<div className="flex-shrink-0 pt-0.5">
									<ToggleSwitch
										id={`toggle-${trigger.id}`}
										checked={trigger.enabled}
										onChange={(val) => updateTrigger(trigger.id, { enabled: val })}
									/>
								</div>

								{/* Condition input */}
								<div className="flex-1 min-w-0">
									<label className="sr-only" htmlFor={`cond-${trigger.id}`}>Condition</label>
									<input
										id={`cond-${trigger.id}`}
										type="text"
										value={trigger.condition}
										onChange={(e) => updateTrigger(trigger.id, { condition: e.target.value })}
										placeholder="e.g. Temperature > 80"
										className={`w-full bg-transparent text-sm rounded px-2 py-1 border transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500/50 ${
											isTriggered && trigger.enabled
												? "border-amber-500/30 text-amber-300 placeholder-amber-900"
												: "border-slate-700/50 text-slate-200 placeholder-slate-600"
										}`}
									/>
								</div>

								{/* Arrow separator */}
								<span className="flex-shrink-0 text-slate-600 text-sm pt-1.5 select-none">→</span>

								{/* Action input */}
								<div className="flex-1 min-w-0">
									<label className="sr-only" htmlFor={`action-${trigger.id}`}>Action</label>
									<input
										id={`action-${trigger.id}`}
										type="text"
										value={trigger.action}
										onChange={(e) => updateTrigger(trigger.id, { action: e.target.value })}
										placeholder="e.g. Sell 10% of BTC"
										className={`w-full bg-transparent text-sm rounded px-2 py-1 border transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500/50 ${
											isTriggered && trigger.enabled
												? "border-amber-500/30 text-amber-300 placeholder-amber-900"
												: "border-slate-700/50 text-slate-200 placeholder-slate-600"
										}`}
									/>
								</div>

								{/* Active indicator (triggered) or delete button */}
								<div className="flex-shrink-0 flex items-center pt-1">
									{isTriggered && trigger.enabled ? (
										<span
											className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"
											title="This rule is currently triggered"
										/>
									) : trigger.isDefault ? (
										<span className="w-5 h-5" /> /* spacer to keep alignment */
									) : (
										<button
											type="button"
											onClick={() => deleteTrigger(trigger.id)}
											className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors rounded"
											title="Delete rule"
											aria-label="Delete rule"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 16 16"
												fill="currentColor"
												className="w-3.5 h-3.5"
											>
												<path
													fillRule="evenodd"
													d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.712Z"
													clipRule="evenodd"
												/>
											</svg>
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* Add rule button */}
				<div className="mt-3">
					{canAddMore ? (
						<button
							type="button"
							onClick={addTrigger}
							className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-400 transition-colors py-1"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								className="w-3.5 h-3.5"
							>
								<path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
							</svg>
							Add rule
							<span className="text-slate-600">({triggers.length}/{MAX_RULES})</span>
						</button>
					) : (
						<p className="text-xs text-slate-600 py-1">
							Maximum {MAX_RULES} rules reached.
						</p>
					)}
				</div>

				{/* Footer note */}
				<p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-700/50 leading-relaxed">
					Framework Part 3, Step 5 — Conditions auto-detect from your live data. Write your rules now, before the market moves.
				</p>
			</CardContent>
		</Card>
	);
}
