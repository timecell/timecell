import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { usePortfolio } from "./hooks/usePortfolio";
import type { PortfolioInput } from "./hooks/usePortfolio";
import { useCurrencyRate } from "./hooks/useCurrencyRate";
import { SurvivalHero } from "./components/SurvivalHero";
import { PortfolioForm } from "./components/PortfolioForm";
import { CrashChart } from "./components/CrashChart";
import { CrashGrid } from "./components/CrashGrid";
import { BtcPriceTicker } from "./components/BtcPriceTicker";
import { TemperatureGauge } from "./components/TemperatureGauge";
import { PositionSizing } from "./components/PositionSizing";
import { ActionPlan } from "./components/ActionPlan";
import { CapacityGate } from "./components/CapacityGate";
import { SleepTest } from "./components/SleepTest";
import { ConvictionLadder } from "./components/ConvictionLadder";
import { JourneyTracker } from "./components/JourneyTracker";
import { ConvictionGates } from "./components/ConvictionGates";
import { DeRiskTriggers } from "./components/DeRiskTriggers";
import { SellingRules } from "./components/SellingRules";
import { DownsideInsurance } from "./components/DownsideInsurance";
import { CustodyTracker } from "./components/CustodyTracker";
import { MarketSentiment } from "./components/MarketSentiment";
import { FourYearMA } from "./components/FourYearMA";
import { InfoPanel } from "./components/InfoPanel";
import { ThesisHealthCheck } from "./components/ThesisHealthCheck";
import { DCACalculator } from "./components/DCACalculator";
import { ReportCard } from "./components/ReportCard";
import { WhatIfComparison } from "./components/WhatIfComparison";
import { HistoricalCrashOverlay } from "./components/HistoricalCrashOverlay";
import { OnboardingModal, useOnboarding } from "./components/OnboardingModal";
import { CurrencySelector } from "./components/CurrencySelector";
import { TooltipProvider } from "@/components/ui/tooltip";
import { calculateSleepTest, scoreToZone } from "@timecell/engine";

export default function App() {
	const { portfolio, result, loading, error, savedAt, loadPortfolio, updatePortfolio } = usePortfolio();
	const { currency, symbol: currencySymbol, rate: currencyRate, setCurrency } = useCurrencyRate();
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [reportCardOpen, setReportCardOpen] = useState(false);
	const [whatIfOpen, setWhatIfOpen] = useState(false);
	const [temperatureScore, setTemperatureScore] = useState(55);
	const reportCardRef = useRef<HTMLDivElement>(null);
	const { showOnboarding, dismiss: dismissOnboarding } = useOnboarding();

	// Derive conviction rung max allocation from current BTC%
	const convictionRungMax = useMemo((): number => {
		const pct = portfolio.btcPercentage;
		if (pct >= 50) return 100; // Single-Asset Core
		if (pct >= 25) return 50; // Owner-Class
		if (pct >= 10) return 25; // High Conviction
		if (pct >= 5) return 10; // Diversifier
		if (pct >= 1) return 3; // Experimenter
		return 0; // Observer
	}, [portfolio.btcPercentage]);

	// Derive sleep test severity from portfolio (same thresholds as SleepTest component)
	const sleepTestSeverity = useMemo((): "manageable" | "painful" | "devastating" => {
		const { lossPercentage } = calculateSleepTest({
			totalPortfolioValue: portfolio.totalValueUsd,
			btcPercentage: portfolio.btcPercentage,
		});
		if (lossPercentage < 20) return "manageable";
		if (lossPercentage <= 50) return "painful";
		return "devastating";
	}, [portfolio.totalValueUsd, portfolio.btcPercentage]);

	useEffect(() => {
		loadPortfolio();
	}, []);

	const handleOnboardingComplete = useCallback(
		(values: Partial<PortfolioInput>) => {
			dismissOnboarding();
			updatePortfolio(values);
		},
		[dismissOnboarding, updatePortfolio],
	);

	const handleOnboardingSkip = useCallback(() => {
		dismissOnboarding();
	}, [dismissOnboarding]);

	return (
		<TooltipProvider delayDuration={300}>
			<div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
				{/* Onboarding wizard — first visit only */}
				{showOnboarding && (
					<OnboardingModal
						currencySymbol={currencySymbol}
						onComplete={handleOnboardingComplete}
						onSkip={handleOnboardingSkip}
					/>
				)}

				{/* Header */}
				<header className="border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-4">
					<div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 sm:gap-3 min-w-0">
							<img src="/logo.png" alt="TimeCell" className="h-7 sm:h-8 brightness-110 flex-shrink-0" />
							<span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded flex-shrink-0">v0.2</span>
							<BtcPriceTicker
								fallbackPrice={portfolio.btcPriceUsd}
								currencySymbol={currencySymbol}
								currencyRate={currencyRate}
							/>
						</div>
						<div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
							<CurrencySelector currency={currency} onChange={setCurrency} />
							<span className="hidden md:block text-sm text-slate-500">Crash Survival Calculator</span>
							{result && (
								<>
									<button
										type="button"
										onClick={() => setWhatIfOpen((o) => !o)}
										className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border transition-colors touch-manipulation min-h-[36px] ${
											whatIfOpen
												? "bg-blue-500/20 border-blue-500/50 text-blue-400"
												: "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
										}`}
									>
										{whatIfOpen ? "Hide" : "What If"}
									</button>
									<button
										type="button"
										onClick={() => {
											setReportCardOpen((o) => !o);
											setTimeout(
												() =>
													reportCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
												100,
											);
										}}
										className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border transition-colors touch-manipulation min-h-[36px] ${
											reportCardOpen
												? "bg-orange-500/20 border-orange-500/50 text-orange-400"
												: "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
										}`}
									>
										{reportCardOpen ? "Hide Report" : "Report Card"}
									</button>
								</>
							)}
						</div>
					</div>
				</header>

				{/* Main content */}
				<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
					{/* Error banner */}
					{error && (
						<div className="rounded-lg border border-red-500/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
							{error}
						</div>
					)}

					{/* Report Card — toggle from header button */}
					{reportCardOpen && result && (
						<div ref={reportCardRef}>
							<ReportCard
								portfolio={portfolio}
								result={result}
								temperatureScore={temperatureScore}
								currencySymbol={currencySymbol}
								currencyRate={currencyRate}
							/>
						</div>
					)}

					{/* ZONE 1: Hero — Big survival score + ruin test */}
					{result && <SurvivalHero result={result} />}

					{/* Loading skeleton for hero */}
					{!result && loading && (
						<div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-5 sm:p-8 animate-pulse">
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-10">
								<div>
									<div className="h-4 w-32 bg-slate-700 rounded mb-4" />
									<div className="h-20 w-36 bg-slate-700 rounded" />
								</div>
								<div className="hidden sm:block w-px h-24 bg-slate-700" />
								<div className="flex-1 w-full space-y-4">
									<div className="h-12 w-full sm:w-48 bg-slate-700 rounded" />
									<div className="flex gap-4">
										<div className="h-10 flex-1 sm:w-28 bg-slate-700 rounded" />
										<div className="h-10 flex-1 sm:w-28 bg-slate-700 rounded" />
									</div>
								</div>
							</div>
						</div>
					)}

					{/* ZONE 2: Interactive — Sliders + Chart side by side */}
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
						<div className="lg:col-span-2">
							<PortfolioForm
								portfolio={portfolio}
								onUpdate={updatePortfolio}
								savedAt={savedAt}
								currencySymbol={currencySymbol}
								currencyRate={currencyRate}
							/>
						</div>
						<div className="lg:col-span-3">
							{result && !loading && (
								<CrashChart result={result} currencySymbol={currencySymbol} currencyRate={currencyRate} />
							)}
							{loading && (
								<div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 animate-pulse h-full min-h-[300px]">
									<div className="h-5 w-48 bg-slate-700 rounded mb-6" />
									<div className="h-full bg-slate-700/30 rounded" />
								</div>
							)}
						</div>
					</div>

					{/* ZONE 2.5: Sleep Test — visceral gut-check */}
					<SleepTest
						totalValueUsd={portfolio.totalValueUsd}
						btcPercentage={portfolio.btcPercentage}
						currencySymbol={currencySymbol}
						currencyRate={currencyRate}
					/>

					{/* ZONE 3: Market Intelligence — Temperature + Position Sizing + Capacity Gate + Action Plan */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<TemperatureGauge onTemperatureChange={setTemperatureScore} />
						<PositionSizing
							totalValueUsd={portfolio.totalValueUsd}
							currentBtcPct={portfolio.btcPercentage}
							monthlyBurnUsd={portfolio.monthlyBurnUsd}
							liquidReserveUsd={portfolio.liquidReserveUsd}
							btcPriceUsd={portfolio.btcPriceUsd}
							currencySymbol={currencySymbol}
							currencyRate={currencyRate}
						/>
						<CapacityGate
							totalValueUsd={portfolio.totalValueUsd}
							currentBtcPct={portfolio.btcPercentage}
							convictionRungMax={convictionRungMax}
							currencySymbol={currencySymbol}
							currencyRate={currencyRate}
						/>
						<ActionPlan
							btcPercentage={portfolio.btcPercentage}
							ruinTestPassed={result?.ruinTestPassed ?? true}
							runwayMonths={result?.scenarios?.[result.scenarios.length - 1]?.runwayMonths ?? Infinity}
							temperatureScore={temperatureScore}
							liquidReserveUsd={portfolio.liquidReserveUsd}
							monthlyBurnUsd={portfolio.monthlyBurnUsd}
							totalValueUsd={portfolio.totalValueUsd}
						/>
						{/* ConvictionGates — only renders when btcPercentage >= 25 */}
						<div className="sm:col-span-2">
							<ConvictionGates
								btcPercentage={portfolio.btcPercentage}
								ruinTestPassed={result?.ruinTestPassed ?? true}
								sleepTestSeverity={sleepTestSeverity}
							/>
						</div>
					</div>

					{/* ZONE 3.5: De-Risk Triggers — written rules committed before emotions take over */}
					<DeRiskTriggers
						temperatureScore={temperatureScore}
						ruinTestPassed={result?.ruinTestPassed ?? true}
						runwayMonths={result?.scenarios?.[result.scenarios.length - 1]?.runwayMonths ?? Infinity}
					/>

					{/* ZONE 3.6: Selling Rules — temperature-based de-accumulation ladder */}
				<SellingRules
					temperatureScore={temperatureScore}
					btcPercentage={portfolio.btcPercentage}
					totalValueUsd={portfolio.totalValueUsd}
					btcPriceUsd={portfolio.btcPriceUsd}
					currencySymbol={currencySymbol}
					currencyRate={currencyRate}
				/>

				{/* ZONE 3.65: DCA Calculator — temperature-aware buying strategy (Framework Part 4) */}
				<DCACalculator
					currentBtcPrice={portfolio.btcPriceUsd}
					temperatureScore={temperatureScore}
					currencySymbol={currencySymbol}
					currencyRate={currencyRate}
				/>

				{/* ZONE 3.7: Downside Insurance — put option budgeting + break-even calculator (Framework Part 6) */}
				<DownsideInsurance
					totalBtcValueUsd={portfolio.totalValueUsd * (portfolio.btcPercentage / 100)}
					btcPriceUsd={portfolio.btcPriceUsd}
					currencySymbol={currencySymbol}
					currencyRate={currencyRate}
				/>

				{/* ZONE 3.72: Custody Tracker — exchange vs self-custody risk (Framework Part 7) */}
				<CustodyTracker
					totalBtcValueUsd={portfolio.totalValueUsd * (portfolio.btcPercentage / 100)}
					btcPriceUsd={portfolio.btcPriceUsd}
					currencySymbol={currencySymbol}
					currencyRate={currencyRate}
				/>

				{/* ZONE 3.75: Market Sentiment — TimeCell temperature vs Fear & Greed cross-validation */}
					<MarketSentiment
						temperatureScore={temperatureScore}
						temperatureZone={scoreToZone(temperatureScore)}
					/>

				{/* ZONE 3.8: 4-Year Moving Average — Framework Part 4.3, cycle timing */}
				<FourYearMA btcPriceUsd={portfolio.btcPriceUsd} />

					{/* ZONE 4: Crash details — collapsed by default */}
					{result && !loading && (
						<div>
							<button
								type="button"
								onClick={() => setDetailsOpen((o) => !o)}
								className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
							>
								<span
									className={`inline-block w-3 h-3 border-r-2 border-b-2 border-current transform transition-transform duration-200 ${
										detailsOpen ? "-rotate-[135deg] translate-y-0.5" : "rotate-45 -translate-y-0.5"
									}`}
								/>
								<span>Crash Scenario Details</span>
								<span className="text-xs text-slate-600">({result.scenarios.length} scenarios)</span>
							</button>
							{detailsOpen && (
								<CrashGrid result={result} currencySymbol={currencySymbol} currencyRate={currencyRate} />
							)}
						</div>
					)}

					{/* ZONE 4.5: Historical Crash Overlay — how you would have fared in past crashes */}
					<HistoricalCrashOverlay
						totalValueUsd={portfolio.totalValueUsd}
						btcPercentage={portfolio.btcPercentage}
						monthlyBurnUsd={portfolio.monthlyBurnUsd}
						liquidReserveUsd={portfolio.liquidReserveUsd}
						btcPriceUsd={portfolio.btcPriceUsd}
						currencySymbol={currencySymbol}
						currencyRate={currencyRate}
					/>

					{/* ZONE 5: Framework — below fold */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<ConvictionLadder btcPercentage={portfolio.btcPercentage} />
						<JourneyTracker btcPercentage={portfolio.btcPercentage} />
						<InfoPanel />
					</div>
					<ThesisHealthCheck />
				</main>

				{/* Footer */}
				<footer className="border-t border-slate-800 px-4 sm:px-6 py-4 mt-8 sm:mt-12">
					<div className="max-w-7xl mx-auto text-center text-xs text-slate-600">
						TimeCell — Local-first. Your data stays on your machine.
					</div>
				</footer>
			</div>
		</TooltipProvider>
	);
}
