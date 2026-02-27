import { useState, useEffect, useCallback, useRef } from "react";

const TOUR_SEEN_KEY = "timecell_tour_seen";
const WELCOME_SEEN_KEY = "timecell_welcome_seen";

interface Stage {
	id: string;
	label: string;
	decision: string;
	callout: string;
	sectionId: string;
}

const STAGES: Stage[] = [
	{
		id: "position",
		label: "Know Your Position",
		decision: "What do I actually have?",
		callout: "Enter YOUR numbers. The dashboard personalizes to your situation.",
		sectionId: "stage-position",
	},
	{
		id: "risk",
		label: "Assess Your Risk",
		decision: "Can I survive the worst?",
		callout:
			"These tests tell you if your portfolio can survive the worst. Red = action needed.",
		sectionId: "stage-risk",
	},
	{
		id: "action",
		label: "Decide What To Do",
		decision: "What should I do next?",
		callout:
			"Based on your risk profile and market temperature, here's what to do.",
		sectionId: "stage-action",
	},
	{
		id: "protect",
		label: "Protect Yourself",
		decision: "How do I stay safe?",
		callout:
			"Set your safety net. Written rules prevent panic decisions.",
		sectionId: "stage-protect",
	},
];

/* ─── Welcome Hero (first visit only) ─── */

export function WelcomeHero() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!localStorage.getItem(WELCOME_SEEN_KEY)) {
			setVisible(true);
		}
	}, []);

	const dismiss = useCallback(() => {
		localStorage.setItem(WELCOME_SEEN_KEY, "1");
		setVisible(false);
		const target = document.getElementById("stage-position");
		if (target) {
			target.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, []);

	if (!visible) return null;

	return (
		<div className="relative rounded-2xl border border-orange-500/30 bg-gradient-to-br from-slate-900 via-slate-800/80 to-orange-950/20 p-8 sm:p-12 text-center overflow-hidden">
			{/* Decorative glow */}
			<div className="absolute inset-0 bg-gradient-radial from-orange-500/5 via-transparent to-transparent pointer-events-none" />

			<div className="relative z-10">
				<div className="inline-flex items-center gap-2 text-xs text-orange-400/80 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full mb-6">
					<span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
					4-step guided walkthrough
				</div>

				<h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
					Your Bitcoin Investment Health Check
				</h1>

				<p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
					We'll walk you through 4 steps:{" "}
					<span className="text-orange-400">Know</span>
					{" \u2192 "}
					<span className="text-orange-400">Assess</span>
					{" \u2192 "}
					<span className="text-orange-400">Decide</span>
					{" \u2192 "}
					<span className="text-orange-400">Protect</span>
				</p>

				<button
					type="button"
					onClick={dismiss}
					className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-base shadow-lg shadow-orange-500/20"
				>
					Let's Go
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
							clipRule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}

/* ─── Guided Flow Stepper ─── */

export function GuidedFlow() {
	const [activeStage, setActiveStage] = useState(0);
	const [tourActive, setTourActive] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Check first visit
	useEffect(() => {
		if (!localStorage.getItem(TOUR_SEEN_KEY)) {
			setTourActive(true);
			localStorage.setItem(TOUR_SEEN_KEY, "1");
		}
	}, []);

	// IntersectionObserver to track which stage section is in view
	useEffect(() => {
		const sectionIds = STAGES.map((s) => s.sectionId);
		const elements = sectionIds
			.map((id) => document.getElementById(id))
			.filter(Boolean) as HTMLElement[];

		if (elements.length === 0) return;

		// Track visibility ratios per section
		const ratios = new Map<string, number>();

		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					ratios.set(entry.target.id, entry.intersectionRatio);
				}
				// Pick the section with the highest visibility
				let maxRatio = 0;
				let maxIdx = 0;
				for (let i = 0; i < sectionIds.length; i++) {
					const r = ratios.get(sectionIds[i]) ?? 0;
					if (r > maxRatio) {
						maxRatio = r;
						maxIdx = i;
					}
				}
				if (maxRatio > 0) {
					setActiveStage(maxIdx);
				}
			},
			{
				threshold: [0, 0.1, 0.25, 0.5, 0.75],
				rootMargin: "-80px 0px -20% 0px",
			},
		);

		for (const el of elements) {
			observerRef.current.observe(el);
		}

		return () => observerRef.current?.disconnect();
	}, []);

	const scrollToStage = useCallback((index: number) => {
		const target = document.getElementById(STAGES[index].sectionId);
		if (target) {
			target.scrollIntoView({ behavior: "smooth", block: "start" });
		}
		setActiveStage(index);
	}, []);

	const startTour = useCallback(() => {
		setTourActive(true);
		setCollapsed(false);
		scrollToStage(0);
	}, [scrollToStage]);

	const stageStatus = (index: number): "completed" | "active" | "upcoming" => {
		if (index < activeStage) return "completed";
		if (index === activeStage) return "active";
		return "upcoming";
	};

	return (
		<>
			{/* Floating "?" button to re-trigger tour */}
			<button
				type="button"
				onClick={() => {
					setShowHelp((h) => !h);
					if (!tourActive) startTour();
				}}
				className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-orange-500/90 hover:bg-orange-400 text-white font-bold text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-110 flex items-center justify-center"
				title="Start guided tour"
			>
				?
			</button>

			{/* Desktop sidebar stepper */}
			<div
				className={`fixed z-40 transition-all duration-300 ${
					collapsed
						? "left-0 top-1/2 -translate-y-1/2"
						: "left-4 top-1/2 -translate-y-1/2 hidden lg:block"
				}`}
			>
				{/* Collapse toggle for desktop */}
				{!collapsed && (
					<div className="w-56 bg-slate-900/95 backdrop-blur-sm border border-slate-700/80 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
						<div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
							<span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
								Decision Journey
							</span>
							<button
								type="button"
								onClick={() => setCollapsed(true)}
								className="text-slate-500 hover:text-slate-300 transition-colors"
								title="Collapse"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
						</div>
						<div className="p-3 space-y-1">
							{STAGES.map((stage, i) => {
								const status = stageStatus(i);
								return (
									<button
										key={stage.id}
										type="button"
										onClick={() => scrollToStage(i)}
										className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group ${
											status === "active"
												? "bg-orange-500/15 border border-orange-500/30"
												: status === "completed"
													? "hover:bg-slate-800/50"
													: "hover:bg-slate-800/30 opacity-60"
										}`}
									>
										<div className="flex items-center gap-2.5">
											{/* Step indicator */}
											<div
												className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
													status === "active"
														? "bg-orange-500 text-white"
														: status === "completed"
															? "bg-green-500/80 text-white"
															: "bg-slate-700 text-slate-400"
												}`}
											>
												{status === "completed" ? (
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-3.5 w-3.5"
														viewBox="0 0 20 20"
														fill="currentColor"
													>
														<path
															fillRule="evenodd"
															d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
															clipRule="evenodd"
														/>
													</svg>
												) : (
													i + 1
												)}
											</div>
											<div className="min-w-0">
												<div
													className={`text-xs font-medium truncate ${
														status === "active"
															? "text-orange-400"
															: status === "completed"
																? "text-green-400"
																: "text-slate-500"
													}`}
												>
													{stage.label}
												</div>
												<div className="text-[10px] text-slate-500 truncate">
													{stage.decision}
												</div>
											</div>
										</div>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* Collapsed pill */}
				{collapsed && (
					<button
						type="button"
						onClick={() => setCollapsed(false)}
						className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/80 rounded-r-xl shadow-2xl shadow-black/40 px-2 py-4 hover:px-3 transition-all group"
						title="Show decision journey"
					>
						<div className="flex flex-col items-center gap-2">
							{STAGES.map((stage, i) => {
								const status = stageStatus(i);
								return (
									<div
										key={stage.id}
										className={`w-2.5 h-2.5 rounded-full transition-colors ${
											status === "active"
												? "bg-orange-500"
												: status === "completed"
													? "bg-green-500/70"
													: "bg-slate-600"
										}`}
									/>
								);
							})}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors mt-1"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
					</button>
				)}
			</div>

			{/* Mobile top bar */}
			<div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 shadow-lg">
				<div className="flex items-center gap-1 px-3 py-2 max-w-full overflow-x-auto scrollbar-hide">
					{STAGES.map((stage, i) => {
						const status = stageStatus(i);
						return (
							<button
								key={stage.id}
								type="button"
								onClick={() => scrollToStage(i)}
								className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
									status === "active"
										? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
										: status === "completed"
											? "text-green-400/80"
											: "text-slate-500"
								}`}
							>
								<div
									className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
										status === "active"
											? "bg-orange-500 text-white"
											: status === "completed"
												? "bg-green-500/70 text-white"
												: "bg-slate-700 text-slate-400"
									}`}
								>
									{status === "completed" ? "\u2713" : i + 1}
								</div>
								<span className="hidden sm:inline">{stage.label}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Stage callout annotation */}
			{tourActive && (
				<StageCallout
					stage={STAGES[activeStage]}
					stageIndex={activeStage}
					onDismiss={() => setTourActive(false)}
					onNext={() => {
						if (activeStage < STAGES.length - 1) {
							scrollToStage(activeStage + 1);
						} else {
							setTourActive(false);
						}
					}}
					isLast={activeStage === STAGES.length - 1}
				/>
			)}
		</>
	);
}

/* ─── Stage Callout ─── */

function StageCallout({
	stage,
	stageIndex,
	onDismiss,
	onNext,
	isLast,
}: {
	stage: Stage;
	stageIndex: number;
	onDismiss: () => void;
	onNext: () => void;
	isLast: boolean;
}) {
	const [visible, setVisible] = useState(false);
	const calloutRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setVisible(false);
		const timer = setTimeout(() => setVisible(true), 100);
		return () => clearTimeout(timer);
	}, [stageIndex]);

	// Position the callout near the section
	useEffect(() => {
		const target = document.getElementById(stage.sectionId);
		if (target && calloutRef.current) {
			const rect = target.getBoundingClientRect();
			// We use fixed positioning, placed just above the section
			calloutRef.current.style.top = `${Math.max(80, rect.top - 10)}px`;
		}
	}, [stage.sectionId, visible]);

	return (
		<div
			ref={calloutRef}
			className={`fixed left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] transition-all duration-300 ${
				visible
					? "opacity-100 translate-y-0"
					: "opacity-0 -translate-y-2"
			}`}
			style={{ top: "80px" }}
		>
			<div className="bg-slate-800/95 backdrop-blur-sm border border-orange-500/40 rounded-xl shadow-2xl shadow-orange-500/10 px-5 py-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1.5">
							<span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
								Step {stageIndex + 1} of 4
							</span>
							<span className="text-xs text-slate-500">\u2014</span>
							<span className="text-xs font-semibold text-white">
								{stage.label}
							</span>
						</div>
						<p className="text-sm text-slate-300 leading-relaxed">
							{stage.callout}
						</p>
					</div>
					<div className="flex items-center gap-2 flex-shrink-0">
						<button
							type="button"
							onClick={onNext}
							className="text-xs px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg border border-orange-500/30 transition-colors"
						>
							{isLast ? "Done" : "Next"}
						</button>
						<button
							type="button"
							onClick={onDismiss}
							className="text-slate-500 hover:text-slate-300 transition-colors"
							title="Dismiss tour"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
