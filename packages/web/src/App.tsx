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
import { GuidedFlow, WelcomeHero } from "./components/GuidedFlow";
import { ChatPanel } from "./components/ChatPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { calculateSleepTest, scoreToZone } from "@timecell/engine";
import { PanelRight, PanelRightClose, ChevronDown, ChevronRight } from "lucide-react";

export default function App() {
	const { portfolio, result, loading, error, savedAt, loadPortfolio, updatePortfolio } = usePortfolio();
	const { currency, symbol: currencySymbol, rate: currencyRate, setCurrency } = useCurrencyRate();
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [reportCardOpen, setReportCardOpen] = useState(false);
	const [whatIfOpen, setWhatIfOpen] = useState(false);
	const [temperatureScore, setTemperatureScore] = useState(55);
	const reportCardRef = useRef<HTMLDivElement>(null);
	const { showOnboarding, dismiss: dismissOnboarding } = useOnboarding();
	const [chatVisible, setChatVisible] = useState(true);

	// Sidebar state — persisted in localStorage
	const [sidebarOpen, setSidebarOpen] = useState(() => {
		const stored = localStorage.getItem("timecell_sidebar_open");
		return stored === null ? true : stored === "true";
	});
	const [sidebarFullDashboard, setSidebarFullDashboard] = useState(false);

	// Persist sidebar state
	useEffect(() => {
		localStorage.setItem("timecell_sidebar_open", String(sidebarOpen));
	}, [sidebarOpen]);

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

	// ── Full dashboard content (reused in sidebar full mode and mobile) ──
	const renderFullDashboard = () => (
		<>
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

			{/* What-If Mode — toggle from header button */}
			{whatIfOpen && result && (
				<WhatIfComparison
					currentPortfolio={portfolio}
					currencySymbol={currencySymbol}
				/>
			)}

			{/* STAGE 1: KNOW YOUR POSITION */}
			<section id="stage-position" className="scroll-mt-20 space-y-6">
				<div className="flex items-center gap-3 pt-2">
					<span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">1</span>
					<div>
						<h2 className="text-sm font-semibold text-white">Know Your Position</h2>
						<p className="text-xs text-slate-500">Enter YOUR numbers. The dashboard personalizes to your situation.</p>
					</div>
				</div>

				{result && <SurvivalHero result={result} />}
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

				<SleepTest
					totalValueUsd={portfolio.totalValueUsd}
					btcPercentage={portfolio.btcPercentage}
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
			</section>

			{/* STAGE 2: READ THE MARKET */}
			<section id="stage-risk" className="scroll-mt-20 space-y-6">
				<div className="flex items-center gap-3 pt-4 border-t border-slate-800">
					<span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">2</span>
					<div>
						<h2 className="text-sm font-semibold text-white">Read the Market</h2>
						<p className="text-xs text-slate-500">Where are we in the cycle? These signals tell you if it's time to buy, hold, or sell.</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<TemperatureGauge onTemperatureChange={setTemperatureScore} />
					<MarketSentiment
						temperatureScore={temperatureScore}
						temperatureZone={scoreToZone(temperatureScore)}
					/>
				</div>
				<FourYearMA btcPriceUsd={portfolio.btcPriceUsd} />
				<ThesisHealthCheck />
			</section>

			{/* STAGE 3: TAKE ACTION */}
			<section id="stage-action" className="scroll-mt-20 space-y-6">
				<div className="flex items-center gap-3 pt-4 border-t border-slate-800">
					<span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">3</span>
					<div>
						<h2 className="text-sm font-semibold text-white">Take Action</h2>
						<p className="text-xs text-slate-500">Your personalized action steps based on risk profile and market temperature.</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<ActionPlan
						btcPercentage={portfolio.btcPercentage}
						ruinTestPassed={result?.ruinTestPassed ?? true}
						runwayMonths={result?.scenarios?.[result.scenarios.length - 1]?.runwayMonths ?? Infinity}
						temperatureScore={temperatureScore}
						liquidReserveUsd={portfolio.liquidReserveUsd}
						monthlyBurnUsd={portfolio.monthlyBurnUsd}
						totalValueUsd={portfolio.totalValueUsd}
					/>
					<PositionSizing
						totalValueUsd={portfolio.totalValueUsd}
						currentBtcPct={portfolio.btcPercentage}
						monthlyBurnUsd={portfolio.monthlyBurnUsd}
						liquidReserveUsd={portfolio.liquidReserveUsd}
						btcPriceUsd={portfolio.btcPriceUsd}
						currencySymbol={currencySymbol}
						currencyRate={currencyRate}
					/>
				</div>
				<ConvictionGates
					btcPercentage={portfolio.btcPercentage}
					ruinTestPassed={result?.ruinTestPassed ?? true}
					sleepTestSeverity={sleepTestSeverity}
				/>
				<DCACalculator
					currentBtcPrice={portfolio.btcPriceUsd}
					temperatureScore={temperatureScore}
					currencySymbol={currencySymbol}
					currencyRate={currencyRate}
				/>
				<SellingRules
					temperatureScore={temperatureScore}
					btcPercentage={portfolio.btcPercentage}
					totalValueUsd={portfolio.totalValueUsd}
					btcPriceUsd={portfolio.btcPriceUsd}
					currencySymbol={currencySymbol}
					currencyRate={currencyRate}
				/>
			</section>

			{/* STAGE 4: PROTECT YOURSELF */}
			<section id="stage-protect" className="scroll-mt-20 space-y-6">
				<div className="flex items-center gap-3 pt-4 border-t border-slate-800">
					<span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">4</span>
					<div>
						<h2 className="text-sm font-semibold text-white">Protect Yourself</h2>
						<p className="text-xs text-slate-500">Set your safety net. Written rules prevent panic decisions.</p>
					</div>
				</div>

				<DeRiskTriggers
					temperatureScore={temperatureScore}
					ruinTestPassed={result?.ruinTestPassed ?? true}
					runwayMonths={result?.scenarios?.[result.scenarios.length - 1]?.runwayMonths ?? Infinity}
				/>
				<DownsideInsurance
					totalBtcValueUsd={portfolio.totalValueUsd * (portfolio.btcPercentage / 100)}
					btcPriceUsd={portfolio.btcPriceUsd}
					currencySymbol={currencySymbol}
					currencyRate={currencyRate}
				/>
				<CustodyTracker
					totalBtcValueUsd={portfolio.totalValueUsd * (portfolio.btcPercentage / 100)}
					btcPriceUsd={portfolio.btcPriceUsd}
					currencySymbol={currencySymbol}
					currencyRate={currencyRate}
				/>
				<HistoricalCrashOverlay
					totalValueUsd={portfolio.totalValueUsd}
					btcPercentage={portfolio.btcPercentage}
					monthlyBurnUsd={portfolio.monthlyBurnUsd}
					liquidReserveUsd={portfolio.liquidReserveUsd}
					btcPriceUsd={portfolio.btcPriceUsd}
					currencySymbol={currencySymbol}
					currencyRate={currencyRate}
				/>
			</section>

			{/* REFERENCE: Crash details + framework knowledge */}
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

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<ConvictionLadder btcPercentage={portfolio.btcPercentage} />
				<JourneyTracker btcPercentage={portfolio.btcPercentage} />
				<InfoPanel />
			</div>
		</>
	);

	// ── Key metrics for condensed sidebar ──
	const renderKeyMetrics = () => (
		<div className="space-y-4">
			{/* Action Plan */}
			<ActionPlan
				btcPercentage={portfolio.btcPercentage}
				ruinTestPassed={result?.ruinTestPassed ?? true}
				runwayMonths={result?.scenarios?.[result.scenarios.length - 1]?.runwayMonths ?? Infinity}
				temperatureScore={temperatureScore}
				liquidReserveUsd={portfolio.liquidReserveUsd}
				monthlyBurnUsd={portfolio.monthlyBurnUsd}
				totalValueUsd={portfolio.totalValueUsd}
			/>

			{/* Temperature Gauge */}
			<TemperatureGauge onTemperatureChange={setTemperatureScore} />

			{/* Survival Hero */}
			{result && <SurvivalHero result={result} />}

			{/* Position Sizing */}
			<PositionSizing
				totalValueUsd={portfolio.totalValueUsd}
				currentBtcPct={portfolio.btcPercentage}
				monthlyBurnUsd={portfolio.monthlyBurnUsd}
				liquidReserveUsd={portfolio.liquidReserveUsd}
				btcPriceUsd={portfolio.btcPriceUsd}
				currencySymbol={currencySymbol}
				currencyRate={currencyRate}
			/>

			{/* Portfolio Form */}
			<PortfolioForm
				portfolio={portfolio}
				onUpdate={updatePortfolio}
				savedAt={savedAt}
				currencySymbol={currencySymbol}
				currencyRate={currencyRate}
			/>
		</div>
	);

	return (
		<TooltipProvider delayDuration={300}>
			<div className="h-[100dvh] overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 text-white flex flex-col">
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
							<img src="/logo.png" alt="TimeCell" className="h-9 sm:h-10 brightness-110 flex-shrink-0" />
							<span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded flex-shrink-0">v0.3</span>
							<BtcPriceTicker
								fallbackPrice={portfolio.btcPriceUsd}
								currencySymbol={currencySymbol}
								currencyRate={currencyRate}
							/>
						</div>
						<div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
							<CurrencySelector currency={currency} onChange={setCurrency} />
							<span className="hidden md:block text-sm text-slate-500">Your AI CIO</span>
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
							{/* Sidebar toggle — desktop only */}
							<button
								type="button"
								onClick={() => setSidebarOpen((o) => !o)}
								className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors min-h-[36px]"
								title={sidebarOpen ? "Hide dashboard" : "Show dashboard"}
							>
								{sidebarOpen ? (
									<PanelRightClose className="w-4 h-4" />
								) : (
									<PanelRight className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>
				</header>

				{/* Mobile tab bar */}
				<div className="lg:hidden flex border-b border-slate-800">
					<button
						type="button"
						onClick={() => setChatVisible(true)}
						className={`flex-1 min-h-[44px] py-3 text-sm font-medium text-center transition-colors ${
							chatVisible
								? "text-orange-400 border-b-2 border-orange-400 bg-slate-900/50"
								: "text-slate-500 hover:text-slate-300"
						}`}
					>
						Chat
					</button>
					<button
						type="button"
						onClick={() => setChatVisible(false)}
						className={`flex-1 min-h-[44px] py-3 text-sm font-medium text-center transition-colors ${
							!chatVisible
								? "text-orange-400 border-b-2 border-orange-400 bg-slate-900/50"
								: "text-slate-500 hover:text-slate-300"
						}`}
					>
						Dashboard
					</button>
				</div>

				{/* Mobile: header(~57px) + tab bar(~44px) = ~101px. Desktop: header only (~57px). dvh fixes mobile Safari. */}
				<div className="flex flex-1 overflow-hidden h-[calc(100dvh-101px)] lg:h-[calc(100dvh-57px)]">
					{/* Chat area — primary, takes remaining space */}
					<div className={`${chatVisible ? "flex" : "hidden"} lg:flex flex-col flex-1 min-w-0 bg-slate-950`}>
						<ChatPanel
							portfolio={portfolio}
							temperatureScore={temperatureScore}
							currencySymbol={currencySymbol}
						/>
					</div>

					{/* Mobile dashboard — full screen when tab selected */}
					<div className={`${!chatVisible ? "flex" : "hidden"} lg:hidden flex-col flex-1 overflow-y-auto`}>
						<main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
							{renderFullDashboard()}
						</main>
						<footer className="border-t border-slate-800 px-4 sm:px-6 py-4 mt-8 sm:mt-12">
							<div className="max-w-6xl mx-auto text-center text-xs text-slate-600">
								TimeCell — Local-first. Your data stays on your machine.
							</div>
						</footer>
					</div>

					{/* Desktop sidebar — collapsible right panel */}
					<div
						className={`hidden lg:flex flex-col border-l border-slate-800 bg-slate-950/80 transition-all duration-300 overflow-hidden ${
							sidebarOpen ? "w-[380px] min-w-[380px]" : "w-0 min-w-0"
						}`}
					>
						{sidebarOpen && (
							<>
								{/* Sidebar header with mode toggle */}
								<div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
									<span className="text-xs font-medium text-slate-400">
										{sidebarFullDashboard ? "Full Dashboard" : "Key Metrics"}
									</span>
									<button
										type="button"
										onClick={() => setSidebarFullDashboard((o) => !o)}
										className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
									>
										{sidebarFullDashboard ? (
											<>
												<ChevronDown className="w-3 h-3" />
												<span>Key Metrics</span>
											</>
										) : (
											<>
												<ChevronRight className="w-3 h-3" />
												<span>Full Dashboard</span>
											</>
										)}
									</button>
								</div>

								{/* Sidebar content — scrollable */}
								<div className="flex-1 overflow-y-auto px-4 py-4">
									{sidebarFullDashboard ? (
										<div className="space-y-6">
											{renderFullDashboard()}
										</div>
									) : (
										renderKeyMetrics()
									)}
								</div>

								{/* Sidebar footer */}
								<div className="border-t border-slate-800 px-4 py-3 flex-shrink-0">
									<div className="text-center text-xs text-slate-600">
										TimeCell — Local-first. Your data stays on your machine.
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
