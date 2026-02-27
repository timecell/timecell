import type { PortfolioInput } from "../hooks/usePortfolio";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface Props {
	portfolio: PortfolioInput;
	onUpdate: (updates: Partial<PortfolioInput>) => void;
}

function formatLabel(value: number): string {
	if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
	return `$${value.toFixed(0)}`;
}

function InputField({
	label,
	value,
	onChange,
	min = 0,
	max,
	step = 1,
	format,
	suffix,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	min?: number;
	max?: number;
	step?: number;
	format?: (v: number) => string;
	suffix?: string;
}) {
	return (
		<div>
			<div className="flex justify-between mb-2 sm:mb-1.5">
				<label className="text-xs sm:text-sm text-slate-400">{label}</label>
				<span className="text-xs sm:text-sm font-mono text-white">
					{format ? format(value) : value}
					{suffix}
				</span>
			</div>
			<Slider
				min={min}
				max={max}
				step={step}
				value={[value]}
				onValueChange={(vals) => onChange(vals[0])}
			/>
		</div>
	);
}

export function PortfolioForm({ portfolio, onUpdate }: Props) {
	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
				<CardTitle className="text-base sm:text-lg text-white">Portfolio</CardTitle>
			</CardHeader>

			<CardContent className="p-4 sm:p-6 pt-4 sm:pt-5 space-y-4 sm:space-y-5">
				<InputField
					label="Total Value"
					value={portfolio.totalValueUsd}
					onChange={(v) => onUpdate({ totalValueUsd: v })}
					min={100_000}
					max={50_000_000}
					step={100_000}
					format={formatLabel}
				/>

				<InputField
					label="Bitcoin Allocation"
					value={portfolio.btcPercentage}
					onChange={(v) => onUpdate({ btcPercentage: v })}
					min={0}
					max={100}
					step={1}
					suffix="%"
				/>

				<InputField
					label="Monthly Burn"
					value={portfolio.monthlyBurnUsd}
					onChange={(v) => onUpdate({ monthlyBurnUsd: v })}
					min={0}
					max={200_000}
					step={1_000}
					format={formatLabel}
				/>

				<InputField
					label="Liquid Reserve"
					value={portfolio.liquidReserveUsd}
					onChange={(v) => onUpdate({ liquidReserveUsd: v })}
					min={0}
					max={5_000_000}
					step={10_000}
					format={formatLabel}
				/>

				<InputField
					label="BTC Price"
					value={portfolio.btcPriceUsd}
					onChange={(v) => onUpdate({ btcPriceUsd: v })}
					min={10_000}
					max={200_000}
					step={1_000}
					format={formatLabel}
				/>
			</CardContent>
		</Card>
	);
}
