import { Card, CardContent } from "@/components/ui/card";

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
	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				<h3 className="text-base sm:text-lg font-semibold text-white mb-4">
					How Does This Work?
				</h3>
				<div className="space-y-4">
					{sections.map((s) => (
						<div key={s.title}>
							<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
								{s.title}
							</h4>
							<p className="text-sm text-slate-300 leading-relaxed">
								{s.body}
							</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
