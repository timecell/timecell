import { useState, useCallback } from "react";
import type { PortfolioInput } from "../hooks/usePortfolio";

const STORAGE_KEY = "timecell_onboarded";

interface Props {
	currencySymbol?: string;
	onComplete: (values: Partial<PortfolioInput>) => void;
	onSkip: () => void;
}

function formatCurrency(value: number, symbol = "$"): string {
	if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${symbol}${Math.round(value / 1_000)}K`;
	return `${symbol}${value.toFixed(0)}`;
}

function parseInput(raw: string): number {
	const trimmed = raw.trim().toLowerCase().replace(/,/g, "");
	// Support shorthand: 8m, 1.5m, 500k, 2b, 50cr, 10l, 5lk
	const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(m|mm|mil|million|k|thousand|b|billion|cr|crore|l|lakh|lk)?$/);
	if (!match) {
		const cleaned = trimmed.replace(/[^0-9.]/g, "");
		return Number.parseFloat(cleaned) || 0;
	}
	const num = Number.parseFloat(match[1]);
	const suffix = match[2];
	if (!suffix) return num;
	const multipliers: Record<string, number> = {
		k: 1_000, thousand: 1_000,
		l: 100_000, lakh: 100_000, lk: 100_000,
		m: 1_000_000, mm: 1_000_000, mil: 1_000_000, million: 1_000_000,
		cr: 10_000_000, crore: 10_000_000,
		b: 1_000_000_000, billion: 1_000_000_000,
	};
	return num * (multipliers[suffix] || 1);
}

function formatInput(value: number): string {
	if (value === 0) return "";
	return value.toLocaleString("en-US");
}

const STEPS = [
	{
		key: "totalValueUsd" as const,
		question: "What's your total portfolio value?",
		subtitle: "Everything — stocks, crypto, real estate, cash. A rough number is fine.",
		placeholder: "e.g. 1,000,000",
		prefix: true,
	},
	{
		key: "btcPercentage" as const,
		question: "What percentage is Bitcoin?",
		subtitle: "How much of that total is allocated to BTC right now?",
		placeholder: "",
		prefix: false,
		isSlider: true,
	},
	{
		key: "monthlyBurnUsd" as const,
		question: "What's your monthly burn rate?",
		subtitle: "Rent, food, subscriptions, everything that goes out each month.",
		placeholder: "e.g. 15,000",
		prefix: true,
	},
	{
		key: "liquidReserveUsd" as const,
		question: "How much liquid cash do you have?",
		subtitle: "Savings accounts, money market — cash you can access in 48 hours.",
		placeholder: "e.g. 200,000",
		prefix: true,
	},
];

export function OnboardingModal({ currencySymbol = "$", onComplete, onSkip }: Props) {
	const [step, setStep] = useState(0);
	const [values, setValues] = useState<Record<string, number>>({
		totalValueUsd: 0,
		btcPercentage: 25,
		monthlyBurnUsd: 0,
		liquidReserveUsd: 0,
	});
	const [inputText, setInputText] = useState("");
	const [done, setDone] = useState(false);

	const currentStep = STEPS[step];

	const handleNext = useCallback(() => {
		if (!currentStep) return;

		// For text inputs, parse the current input text
		if (!currentStep.isSlider) {
			const parsed = parseInput(inputText);
			if (parsed > 0) {
				setValues((prev) => ({ ...prev, [currentStep.key]: parsed }));
			}
		}

		if (step < STEPS.length - 1) {
			setStep(step + 1);
			setInputText("");
		} else {
			setDone(true);
		}
	}, [step, inputText, currentStep]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleNext();
			}
		},
		[handleNext],
	);

	const handleReveal = useCallback(() => {
		// Parse the last input if we're on the final step
		const finalValues = { ...values };
		if (currentStep && !currentStep.isSlider && inputText) {
			const parsed = parseInput(inputText);
			if (parsed > 0) {
				finalValues[currentStep.key] = parsed;
			}
		}

		localStorage.setItem(STORAGE_KEY, "true");
		onComplete(finalValues);
	}, [values, currentStep, inputText, onComplete]);

	const handleSkip = useCallback(() => {
		localStorage.setItem(STORAGE_KEY, "true");
		onSkip();
	}, [onSkip]);

	const handleSliderChange = useCallback(
		(val: number) => {
			if (!currentStep) return;
			setValues((prev) => ({ ...prev, [currentStep.key]: val }));
		},
		[currentStep],
	);

	// --- Reveal screen ---
	if (done) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
				<div className="w-full max-w-md mx-4 rounded-2xl bg-slate-900 border border-slate-700 p-8 text-center space-y-6 animate-in fade-in duration-300">
					<div className="text-5xl">🛡️</div>
					<h2 className="text-2xl font-bold text-white">You're all set.</h2>
					<p className="text-slate-400 text-sm leading-relaxed">
						We'll stress-test your {formatCurrency(values.totalValueUsd, currencySymbol)} portfolio
						with {values.btcPercentage}% in Bitcoin across multiple crash scenarios.
					</p>
					<div className="grid grid-cols-2 gap-3 text-left">
						<div className="rounded-lg bg-slate-800/80 p-3">
							<div className="text-xs text-slate-500">Portfolio</div>
							<div className="text-sm font-mono text-white">
								{formatCurrency(values.totalValueUsd, currencySymbol)}
							</div>
						</div>
						<div className="rounded-lg bg-slate-800/80 p-3">
							<div className="text-xs text-slate-500">Bitcoin</div>
							<div className="text-sm font-mono text-white">{values.btcPercentage}%</div>
						</div>
						<div className="rounded-lg bg-slate-800/80 p-3">
							<div className="text-xs text-slate-500">Monthly burn</div>
							<div className="text-sm font-mono text-white">
								{formatCurrency(values.monthlyBurnUsd, currencySymbol)}
							</div>
						</div>
						<div className="rounded-lg bg-slate-800/80 p-3">
							<div className="text-xs text-slate-500">Cash reserve</div>
							<div className="text-sm font-mono text-white">
								{formatCurrency(values.liquidReserveUsd, currencySymbol)}
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={handleReveal}
						className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 px-6 transition-colors text-lg"
					>
						Reveal Your Dashboard
					</button>
				</div>
			</div>
		);
	}

	// --- Wizard steps ---
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			<div className="w-full max-w-md mx-4 rounded-2xl bg-slate-900 border border-slate-700 p-8 space-y-6 animate-in fade-in duration-300">
				{/* Header — only on first step */}
				{step === 0 && (
					<div className="text-center space-y-2 mb-2">
						<h1 className="text-2xl font-bold text-white">
							Let's see if your portfolio can survive a crash.
						</h1>
						<p className="text-slate-400 text-sm">
							4 quick questions. 30 seconds. Your data never leaves this device.
						</p>
					</div>
				)}

				{/* Progress bar */}
				<div className="flex gap-1.5">
					{STEPS.map((_, i) => (
						<div
							key={`step-${STEPS[i].key}`}
							className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
								i <= step ? "bg-orange-500" : "bg-slate-700"
							}`}
						/>
					))}
				</div>

				{/* Question */}
				<div className="space-y-2">
					<h2 className="text-lg font-semibold text-white">{currentStep.question}</h2>
					<p className="text-sm text-slate-400">{currentStep.subtitle}</p>
				</div>

				{/* Input */}
				{currentStep.isSlider ? (
					<div className="space-y-4">
						<div className="text-center">
							<span className="text-4xl font-bold text-orange-400 font-mono">
								{values.btcPercentage}%
							</span>
						</div>
						<input
							type="range"
							min={0}
							max={100}
							step={1}
							value={values.btcPercentage}
							onChange={(e) => handleSliderChange(Number(e.target.value))}
							className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
						/>
						<div className="flex justify-between text-xs text-slate-500">
							<span>0%</span>
							<span>50%</span>
							<span>100%</span>
						</div>
					</div>
				) : (
					<div className="relative">
						{currentStep.prefix && (
							<span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
								{currencySymbol}
							</span>
						)}
						<input
							type="text"
							inputMode="numeric"
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							onBlur={() => {
								const parsed = parseInput(inputText);
								if (parsed > 0) {
									setInputText(formatInput(parsed));
									setValues((prev) => ({
										...prev,
										[currentStep.key]: parsed,
									}));
								}
							}}
							onKeyDown={handleKeyDown}
							placeholder={currentStep.placeholder}
							autoFocus
							className={`w-full rounded-xl bg-slate-800 border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white text-lg py-3 outline-none transition-colors ${
								currentStep.prefix ? "pl-10 pr-4" : "pl-4 pr-4"
							}`}
						/>
					</div>
				)}

				{/* Actions */}
				<div className="flex items-center justify-between pt-2">
					<button
						type="button"
						onClick={handleSkip}
						className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
					>
						Skip, use defaults
					</button>
					<button
						type="button"
						onClick={handleNext}
						className="rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-medium py-2.5 px-6 transition-colors"
					>
						{step === STEPS.length - 1 ? "Finish" : "Next"}
					</button>
				</div>
			</div>
		</div>
	);
}

export function useOnboarding() {
	const [showOnboarding, setShowOnboarding] = useState(() => {
		return !localStorage.getItem(STORAGE_KEY);
	});

	const dismiss = useCallback(() => {
		setShowOnboarding(false);
	}, []);

	return { showOnboarding, dismiss };
}
