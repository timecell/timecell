import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

const API_BASE = "/api";

// ---------------------------------------------------------------------------
// Types (mirroring engine — no direct engine dep in web)
// ---------------------------------------------------------------------------

type ActionSeverity = "red" | "amber" | "green";

interface ActionItem {
	severity: ActionSeverity;
	message: string;
	rule: string;
}

// ---------------------------------------------------------------------------
// Severity styling
// ---------------------------------------------------------------------------

function severityDotClass(severity: ActionSeverity): string {
	switch (severity) {
		case "red":
			return "bg-red-400";
		case "amber":
			return "bg-amber-400";
		case "green":
			return "bg-emerald-400";
	}
}

function severityTextClass(severity: ActionSeverity): string {
	switch (severity) {
		case "red":
			return "text-red-400";
		case "amber":
			return "text-amber-400";
		case "green":
			return "text-emerald-400";
	}
}

function severityBorderClass(severity: ActionSeverity): string {
	switch (severity) {
		case "red":
			return "border-l-red-400";
		case "amber":
			return "border-l-amber-400";
		case "green":
			return "border-l-emerald-400";
	}
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface ActionPlanProps {
	btcPercentage: number;
	ruinTestPassed: boolean;
	runwayMonths: number;
	temperatureScore: number;
	liquidReserveUsd: number;
	monthlyBurnUsd: number;
	totalValueUsd: number;
}

export function ActionPlan({
	btcPercentage,
	ruinTestPassed,
	runwayMonths,
	temperatureScore,
	liquidReserveUsd,
	monthlyBurnUsd,
	totalValueUsd,
}: ActionPlanProps) {
	const [items, setItems] = useState<ActionItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const calculate = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/action-plan`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					btcPercentage,
					ruinTestPassed,
					runwayMonths,
					temperatureScore,
					liquidReserveUsd,
					monthlyBurnUsd,
					totalValueUsd,
				}),
			});
			if (!res.ok) throw new Error(`API ${res.status}`);
			setItems(await res.json());
			setError(null);
		} catch (err) {
			console.error("action-plan error:", err);
			setError(err instanceof Error ? err.message : "Failed to load action plan");
		} finally {
			setLoading(false);
		}
	}, [
		btcPercentage,
		ruinTestPassed,
		runwayMonths,
		temperatureScore,
		liquidReserveUsd,
		monthlyBurnUsd,
		totalValueUsd,
	]);

	useEffect(() => {
		calculate();
	}, [calculate]);

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardContent className="p-4 sm:p-6">
				{/* Header */}
				<h3 className="text-base sm:text-lg font-semibold text-white mb-0.5">
					What Should I Do?
				</h3>
				<p className="text-xs text-slate-400 mb-4">
					Personalized actions based on your portfolio, market temperature, and risk profile
				</p>

				{/* Loading */}
				{loading && (
					<div className="flex items-center justify-center h-32 text-slate-500 text-sm">
						<div className="w-4 h-4 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin mr-2" />
						Analyzing...
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="flex items-center justify-center h-32 text-red-400 text-sm">
						{error}
					</div>
				)}

				{/* Action items */}
				{!loading && !error && items.length > 0 && (
					<div className="space-y-2.5">
						{items.map((item) => (
							<div
								key={item.rule}
								className={`border-l-2 ${severityBorderClass(item.severity)} rounded-r-lg bg-slate-900/40 px-3 py-2.5`}
							>
								<div className="flex items-start gap-2.5">
									<span
										className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${severityDotClass(item.severity)}`}
									/>
									<p className={`text-sm leading-snug ${severityTextClass(item.severity)}`}>
										{item.message}
									</p>
								</div>
							</div>
						))}
					</div>
				)}

				{/* All clear */}
				{!loading && !error && items.length === 0 && (
					<div className="flex items-center justify-center h-32 text-emerald-400 text-sm font-medium">
						All clear — your portfolio is well-positioned.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
