import type { PortfolioInput } from "../hooks/usePortfolio";

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
			<div className="flex justify-between mb-1.5">
				<label className="text-sm text-slate-400">{label}</label>
				<span className="text-sm font-mono text-white">
					{format ? format(value) : value}
					{suffix}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
			/>
		</div>
	);
}

export function PortfolioForm({ portfolio, onUpdate }: Props) {
	return (
		<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-5">
			<h2 className="text-lg font-semibold text-white">Portfolio</h2>

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
		</div>
	);
}
