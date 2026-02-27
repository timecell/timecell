import type { SurvivalResult } from "../hooks/usePortfolio";
import { CrashCard } from "./CrashCard";

export function CrashGrid({ result }: { result: SurvivalResult }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
			{result.scenarios.map((scenario) => (
				<CrashCard key={scenario.drawdownPct} scenario={scenario} />
			))}
		</div>
	);
}
