import {
	ComposedChart,
	Bar,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import type { SurvivalResult, CrashScenario } from "../hooks/usePortfolio";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function formatUsd(value: number): string {
	if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
	return `$${value.toFixed(0)}`;
}

function getBarColor(scenario: CrashScenario): string {
	if (scenario.survivalStatus === "critical") return "#ef4444"; // red-500
	if (scenario.survivalStatus === "warning") return "#f59e0b"; // amber-500
	if (scenario.drawdownPct <= 30) return "#10b981"; // emerald-500
	if (scenario.drawdownPct <= 50) return "#059669"; // emerald-600
	if (scenario.drawdownPct <= 70) return "#f59e0b"; // amber-500
	return "#f97316"; // orange-500
}

interface ChartDataPoint {
	label: string;
	portfolioValue: number;
	runway: number;
	scenario: CrashScenario;
}

export function CrashChart({ result }: { result: SurvivalResult }) {
	const data: ChartDataPoint[] = result.scenarios.map((s) => ({
		label: `-${s.drawdownPct}%`,
		portfolioValue: s.portfolioValueAfterCrash,
		runway: s.runwayMonths === Infinity ? 240 : Math.min(s.runwayMonths, 240),
		scenario: s,
	}));

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
				<CardTitle className="text-base sm:text-lg text-white">
					Portfolio Value & Runway by Crash Scenario
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 sm:p-6 pt-4 sm:pt-4">
			<div className="h-64">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={data}
						margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#334155"
							vertical={false}
						/>
						<XAxis
							dataKey="label"
							tick={{ fill: "#94a3b8", fontSize: 13 }}
							axisLine={{ stroke: "#475569" }}
							tickLine={false}
						/>
						<YAxis
							yAxisId="left"
							tick={{ fill: "#94a3b8", fontSize: 12 }}
							axisLine={false}
							tickLine={false}
							tickFormatter={formatUsd}
							width={64}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tick={{ fill: "#94a3b8", fontSize: 12 }}
							axisLine={false}
							tickLine={false}
							tickFormatter={(v: number) =>
								v >= 240 ? "∞" : `${v}mo`
							}
							width={48}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "#1e293b",
								border: "1px solid #475569",
								borderRadius: "8px",
								color: "#e2e8f0",
								fontSize: "13px",
							}}
							formatter={(value: number, name: string) => {
								if (name === "portfolioValue")
									return [formatUsd(value), "Portfolio Value"];
								if (name === "runway") {
									const display =
										value >= 240
											? "∞"
											: `${Math.round(value)} months`;
									return [display, "Runway"];
								}
								return [value, name];
							}}
							labelStyle={{ color: "#94a3b8" }}
						/>
						<Bar
							yAxisId="left"
							dataKey="portfolioValue"
							radius={[4, 4, 0, 0]}
							maxBarSize={56}
						>
							{data.map((entry, index) => (
								<Cell
									key={index}
									fill={getBarColor(entry.scenario)}
									fillOpacity={0.85}
								/>
							))}
						</Bar>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="runway"
							stroke="#fb923c"
							strokeWidth={2}
							dot={{ fill: "#fb923c", r: 4, strokeWidth: 0 }}
						/>
					</ComposedChart>
				</ResponsiveContainer>
			</div>
			</CardContent>
		</Card>
	);
}
