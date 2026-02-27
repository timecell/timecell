import { useState } from "react";

const sections = [
	{
		title: "Crash Model",
		body: "Non-BTC assets drop at ~50% of BTC\u2019s drawdown (correlation model). If BTC drops 80%, non-BTC assets drop ~40%.",
	},
	{
		title: "Survival Threshold",
		body: "18+ months of runway = safe. Less than 6 months = forced seller territory.",
	},
	{
		title: "Ruin Test",
		body: "The ultimate stress test: BTC drops 80% AND everything else drops 40% simultaneously. If you survive this, you survive anything.",
	},
	{
		title: "Runway",
		body: "Net position (portfolio after crash + cash reserve) divided by monthly burn rate.",
	},
];

export function InfoPanel() {
	const [open, setOpen] = useState(false);

	return (
		<div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-700/30 transition-colors"
			>
				<span className="text-sm font-medium text-slate-300">
					How does this work?
				</span>
				<span
					className={`inline-block w-4 h-4 border-r-2 border-b-2 border-slate-400 transform transition-transform duration-200 ${
						open ? "-rotate-[135deg] translate-y-1" : "rotate-45 -translate-y-0.5"
					}`}
				/>
			</button>

			{open && (
				<div className="px-5 pb-5 space-y-4 border-t border-slate-700">
					{sections.map((s) => (
						<div key={s.title} className="pt-4">
							<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
								{s.title}
							</h4>
							<p className="text-sm text-slate-300 leading-relaxed">
								{s.body}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
