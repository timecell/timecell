import { useState, useEffect, useMemo } from "react";
import { calculateCapacityGate } from "@timecell/engine";
import type { CapacityGateInput, CapacityGateResult } from "@timecell/engine";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LS_KEY = "timecell_capacity_gate";

// Conviction rung level derived from BTC percentage
// Mirrors RUNGS in position-sizing.ts
function btcPctToConvictionRung(btcPct: number): number {
	if (btcPct >= 50) return 6; // Single-Asset Core
	if (btcPct >= 25) return 5; // Owner-Class
	if (btcPct >= 10) return 4; // High Conviction
	if (btcPct >= 5) return 3;  // Diversifier
	if (btcPct >= 1) return 2;  // Experimenter
	return 1;                   // Observer
}

// Conviction rung name
const RUNG_NAMES: Record<number, string> = {
	1: "Observer",
	2: "Experimenter",
	3: "Diversifier",
	4: "High Conviction",
	5: "Owner-Class",
	6: "Single-Asset Core",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoredInputs {
	age: number;
	annualIncome: number;
	btcIncomeCorrelation: number; // 0-100 — informational, affects reasons display
	withdrawalHorizonYears: number;
	totalLiabilitiesAnnual: number;
}

export interface CapacityGateProps {
	totalValueUsd: number;
	currentBtcPct: number;
	convictionRungMax: number; // max % allowed by current rung
	currencySymbol?: string;
	currencyRate?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, v));
}

function fmt(n: number, decimals = 0): string {
	if (!Number.isFinite(n)) return "\u221e";
	return n.toLocaleString("en-US", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

function fmtCurrency(n: number, symbol = "$", rate = 1): string {
	const converted = n * rate;
	const abs = Math.abs(converted);
	if (abs >= 1_000_000) return `${symbol}${fmt(converted / 1_000_000, 2)}M`;
	if (abs >= 1_000) return `${symbol}${fmt(converted / 1_000, 1)}K`;
	return `${symbol}${fmt(converted)}`;
}

function loadStored(): StoredInputs {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (raw) return JSON.parse(raw) as StoredInputs;
	} catch {
		// ignore
	}
	return {
		age: 35,
		annualIncome: 200_000,
		btcIncomeCorrelation: 20,
		withdrawalHorizonYears: 20,
		totalLiabilitiesAnnual: 0,
	};
}

function saveStored(inputs: StoredInputs): void {
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(inputs));
	} catch {
		// ignore
	}
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FactorBar({
	label,
	value,
	max = 100,
	color = "orange",
}: {
	label: string;
	value: number;
	max?: number;
	color?: "orange" | "emerald" | "red" | "blue";
}) {
	const pct = clamp((value / max) * 100, 0, 100);
	const colorMap = {
		orange: "bg-orange-500/70",
		emerald: "bg-emerald-500/70",
		red: "bg-red-500/70",
		blue: "bg-blue-500/70",
	};
	return (
		<div className="space-y-1">
			<div className="flex justify-between items-center text-xs text-slate-400">
				<span>{label}</span>
				<span className="font-mono text-slate-300">{fmt(value, 0)}%</span>
			</div>
			<div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
				<div
					className={`h-full rounded-full transition-all duration-500 ${colorMap[color]}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

function NumberInput({
	label,
	value,
	onChange,
	min = 0,
	max,
	step = 1,
	prefix,
	hint,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	min?: number;
	max?: number;
	step?: number;
	prefix?: string;
	hint?: string;
}) {
	const [raw, setRaw] = useState(String(value));

	// Sync when value changes externally (e.g. reset)
	useEffect(() => {
		setRaw(String(value));
	}, [value]);

	function commit(s: string) {
		const n = Number(s.replace(/,/g, ""));
		if (!Number.isNaN(n)) {
			const clamped = max !== undefined ? clamp(n, min, max) : Math.max(min, n);
			onChange(clamped);
			setRaw(String(clamped));
		} else {
			setRaw(String(value));
		}
	}

	return (
		<div className="space-y-1">
			<label className="block text-xs text-slate-400">{label}</label>
			<div className="relative flex items-center">
				{prefix && (
					<span className="absolute left-3 text-xs text-slate-500 pointer-events-none select-none">
						{prefix}
					</span>
				)}
				<input
					type="text"
					inputMode="numeric"
					value={raw}
					onChange={(e) => setRaw(e.target.value)}
					onBlur={(e) => commit(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
					}}
					className={`w-full rounded-lg bg-slate-900/60 border border-slate-700 text-sm text-white px-3 py-2 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-colors ${prefix ? "pl-7" : ""}`}
				/>
			</div>
			{hint && <p className="text-xs text-slate-600">{hint}</p>}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CapacityGate({
	totalValueUsd,
	currentBtcPct,
	convictionRungMax,
	currencySymbol = "$",
	currencyRate = 1,
}: CapacityGateProps) {
	const [inputs, setInputs] = useState<StoredInputs>(loadStored);
	const [inputsOpen, setInputsOpen] = useState(false);

	// Persist whenever inputs change
	useEffect(() => {
		saveStored(inputs);
	}, [inputs]);

	function patch(partial: Partial<StoredInputs>) {
		setInputs((prev) => ({ ...prev, ...partial }));
	}

	// Derive conviction rung from current BTC%
	const convictionRung = btcPctToConvictionRung(currentBtcPct);

	// Build engine input
	const engineInput: CapacityGateInput = useMemo(
		() => ({
			age: inputs.age,
			annualIncome: inputs.annualIncome,
			withdrawalHorizonYears: inputs.withdrawalHorizonYears,
			totalLiabilitiesAnnual: inputs.totalLiabilitiesAnnual,
			totalPortfolioValue: totalValueUsd > 0 ? totalValueUsd : 1,
			convictionRung,
		}),
		[inputs, totalValueUsd, convictionRung],
	);

	const result: CapacityGateResult = useMemo(
		() => calculateCapacityGate(engineInput),
		[engineInput],
	);

	// Effective allocation uses the prop convictionRungMax (already derived from rung)
	const effectiveAllocation = Math.min(convictionRungMax, result.capacityCeiling);
	const isOverCeiling = currentBtcPct > effectiveAllocation;
	const overBy = currentBtcPct - effectiveAllocation;

	// Capacity ceiling color
	function ceilingColor(pct: number): string {
		if (pct <= 10) return "text-red-400";
		if (pct <= 25) return "text-amber-400";
		if (pct <= 50) return "text-orange-400";
		return "text-emerald-400";
	}

	// Human capital breakdown factors (derived from engine logic for display)
	const incomeRatio = totalValueUsd > 0 ? inputs.annualIncome / totalValueUsd : 1;
	const incomeScore = Math.min(incomeRatio, 1) * 100;
	const ageFactor = Math.max(0, Math.min(1, (75 - inputs.age) / 50)) * 100;
	const liabilityRatio =
		inputs.annualIncome > 0 ? inputs.totalLiabilitiesAnnual / inputs.annualIncome : 1;
	const liabilityFactor = Math.max(0, 1 - liabilityRatio) * 100;
	const horizonFactor =
		inputs.withdrawalHorizonYears >= 10
			? 100
			: inputs.withdrawalHorizonYears >= 5
				? 50
				: 5;

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6 space-y-5">
				{/* Header */}
				<div>
					<h3 className="text-base sm:text-lg font-semibold text-white mb-0.5">
						Capacity Gate
					</h3>
					<p className="text-xs text-slate-400">
						What your financial situation can actually support — regardless of conviction
					</p>
				</div>

				{/* Primary result: Capacity Ceiling */}
				<div className="rounded-xl bg-slate-900/60 border border-slate-700/60 px-4 py-4 flex items-center gap-4">
					<div className="flex-1 min-w-0">
						<p className="text-xs text-slate-500 mb-0.5">Capacity Ceiling</p>
						<p className={`text-4xl font-bold font-mono ${ceilingColor(result.capacityCeiling)}`}>
							{result.capacityCeiling}%
						</p>
						<p className="text-xs text-slate-500 mt-1">
							Binding:{" "}
							<span className="text-slate-300 font-medium capitalize">{result.binding}</span>
						</p>
					</div>
					<div className="h-16 w-px bg-slate-700/60 flex-shrink-0" />
					<div className="flex-1 min-w-0">
						<p className="text-xs text-slate-500 mb-0.5">Effective Allocation</p>
						<p className="text-4xl font-bold font-mono text-white">
							{effectiveAllocation}%
						</p>
						<p className="text-xs text-slate-500 mt-1">
							min(
							<span className="text-orange-400">{convictionRungMax}%</span>
							{" conviction, "}
							<span className={ceilingColor(result.capacityCeiling)}>
								{result.capacityCeiling}%
							</span>
							{" capacity)"}
						</p>
					</div>
				</div>

				{/* Status badge */}
				<div
					className={`flex items-start gap-3 rounded-xl px-4 py-3 border transition-colors duration-300 ${
						isOverCeiling
							? "bg-red-950/50 border-red-500/30"
							: "bg-emerald-950/50 border-emerald-500/30"
					}`}
				>
					<span
						className={`text-xl flex-shrink-0 mt-0.5 ${isOverCeiling ? "text-red-400" : "text-emerald-400"}`}
					>
						{isOverCeiling ? "\u26a0" : "\u2713"}
					</span>
					<div className="flex-1 min-w-0">
						<p
							className={`text-sm font-semibold ${isOverCeiling ? "text-red-400" : "text-emerald-400"}`}
						>
							{isOverCeiling
								? `You are ${fmt(overBy, 1)}% over your capacity ceiling`
								: "Within capacity limits"}
						</p>
						<p className="text-xs text-slate-400 mt-0.5">
							{isOverCeiling
								? `Current ${fmt(currentBtcPct, 1)}% BTC exceeds effective ceiling of ${effectiveAllocation}%. Consider reducing exposure.`
								: `Current ${fmt(currentBtcPct, 1)}% BTC is within your ${effectiveAllocation}% effective ceiling.`}
						</p>
					</div>
				</div>

				{/* Factor breakdown */}
				<div className="space-y-3">
					<p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
						Capacity Factors
					</p>
					<div className="space-y-2.5">
						<FactorBar
							label="Human capital — age"
							value={ageFactor}
							color={ageFactor >= 60 ? "emerald" : ageFactor >= 30 ? "orange" : "red"}
						/>
						<FactorBar
							label="Human capital — income vs portfolio"
							value={incomeScore}
							color={incomeScore >= 60 ? "emerald" : incomeScore >= 30 ? "orange" : "red"}
						/>
						<FactorBar
							label="Liability drag (free income)"
							value={liabilityFactor}
							color={liabilityFactor >= 70 ? "emerald" : liabilityFactor >= 40 ? "orange" : "red"}
						/>
						<FactorBar
							label="Withdrawal horizon headroom"
							value={horizonFactor}
							color={horizonFactor === 100 ? "emerald" : horizonFactor === 50 ? "orange" : "red"}
						/>
					</div>
				</div>

				{/* Conviction context */}
				<div className="rounded-lg bg-slate-900/40 border border-slate-700/40 px-3 py-2.5 flex items-center justify-between gap-2">
					<div>
						<p className="text-xs text-slate-500">Current conviction rung</p>
						<p className="text-sm font-semibold text-orange-400">
							{RUNG_NAMES[convictionRung]} ({convictionRungMax}% max)
						</p>
					</div>
					<div className="text-right">
						<p className="text-xs text-slate-500">At {fmt(currentBtcPct, 1)}% BTC</p>
					</div>
				</div>

				{/* Reasons */}
				{result.reasons.length > 0 && (
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
							Why
						</p>
						<ul className="space-y-1">
							{result.reasons.map((reason) => (
								<li
									key={reason}
									className="flex items-start gap-2 text-xs text-slate-400"
								>
									<span className="text-slate-600 mt-0.5 flex-shrink-0">&middot;</span>
									<span>{reason}</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Collapsible inputs */}
				<div>
					<button
						type="button"
						onClick={() => setInputsOpen((o) => !o)}
						className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors w-full text-left"
					>
						<span
							className={`inline-block w-2.5 h-2.5 border-r-2 border-b-2 border-current transform transition-transform duration-200 ${
								inputsOpen ? "-rotate-[135deg] translate-y-0.5" : "rotate-45 -translate-y-0.5"
							}`}
						/>
						<span>{inputsOpen ? "Hide" : "Edit"} inputs</span>
					</button>

					{inputsOpen && (
						<div className="mt-4 space-y-4 rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-4">
							{/* Age */}
							<NumberInput
								label="Age"
								value={inputs.age}
								onChange={(v) => patch({ age: clamp(v, 18, 100) })}
								min={18}
								max={100}
								hint="Affects human capital score and recovery horizon"
							/>

							{/* Annual income */}
							<NumberInput
								label="Annual Income"
								value={inputs.annualIncome}
								onChange={(v) => patch({ annualIncome: Math.max(0, v) })}
								min={0}
								prefix={currencySymbol}
								hint="Pre-tax annual income"
							/>

							{/* BTC income correlation */}
							<div className="space-y-1.5">
								<div className="flex justify-between items-center">
									<label className="text-xs text-slate-400">
										BTC / tech income correlation
									</label>
									<span className="text-sm font-mono font-semibold text-orange-400">
										{inputs.btcIncomeCorrelation}%
									</span>
								</div>
								<input
									type="range"
									min={0}
									max={100}
									step={5}
									value={inputs.btcIncomeCorrelation}
									onChange={(e) =>
										patch({ btcIncomeCorrelation: Number(e.target.value) })
									}
									className="w-full h-1.5 rounded-full accent-orange-500 bg-slate-700 cursor-pointer"
								/>
								<div className="flex justify-between text-xs text-slate-600">
									<span>0% — unrelated</span>
									<span>100% — fully correlated</span>
								</div>
								<p className="text-xs text-slate-600">
									How much does your income depend on crypto / tech?
								</p>
							</div>

							{/* Years to withdrawal */}
							<NumberInput
								label="Years to retirement / withdrawal"
								value={inputs.withdrawalHorizonYears}
								onChange={(v) => patch({ withdrawalHorizonYears: clamp(v, 0, 60) })}
								min={0}
								max={60}
								hint="When will you need to draw down this portfolio?"
							/>

							{/* Liabilities */}
							<NumberInput
								label="Annual fixed liabilities"
								value={inputs.totalLiabilitiesAnnual}
								onChange={(v) => patch({ totalLiabilitiesAnnual: Math.max(0, v) })}
								min={0}
								prefix={currencySymbol}
								hint="Mortgage, school fees, debt payments — annual total"
							/>

							{/* Total assets — display only, from props */}
							<div className="space-y-1">
								<label className="block text-xs text-slate-400">
									Total portfolio value{" "}
									<span className="text-slate-600">(from portfolio form)</span>
								</label>
								<div className="rounded-lg bg-slate-800/60 border border-slate-700/40 px-3 py-2 text-sm text-slate-300 font-mono">
									{fmtCurrency(totalValueUsd, currencySymbol, currencyRate)}
								</div>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
