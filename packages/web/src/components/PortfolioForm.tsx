import { useState, useEffect } from "react";
import type { PortfolioInput } from "../hooks/usePortfolio";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface Props {
	portfolio: PortfolioInput;
	onUpdate: (updates: Partial<PortfolioInput>) => void;
	savedAt?: number | null;
	currencySymbol?: string;
}

function formatLabel(value: number, symbol = "$"): string {
	if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
	return `${symbol}${value.toFixed(0)}`;
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
				<label className="text-xs sm:text-sm text-slate-300">{label}</label>
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

export function PortfolioForm({ portfolio, onUpdate, savedAt, currencySymbol = "$" }: Props) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!savedAt) return;
		setVisible(true);
		const timer = setTimeout(() => setVisible(false), 2000);
		return () => clearTimeout(timer);
	}, [savedAt]);

	return (
		<Card className="border-slate-700 bg-slate-800/50 shadow-none">
			<CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base sm:text-lg text-white">Portfolio</CardTitle>
					<span
						className={`text-xs text-green-400 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
					>
						&#10003; Saved
					</span>
				</div>
			</CardHeader>

			<CardContent className="p-4 sm:p-6 pt-4 sm:pt-5 space-y-4 sm:space-y-5">
				<InputField
					label="Total Value"
					value={portfolio.totalValueUsd}
					onChange={(v) => onUpdate({ totalValueUsd: v })}
					min={100_000}
					max={50_000_000}
					step={100_000}
					format={(v) => formatLabel(v, currencySymbol)}
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
					max={500_000}
					step={1_000}
					format={(v) => formatLabel(v, currencySymbol)}
				/>

				<InputField
					label="Liquid Reserve"
					value={portfolio.liquidReserveUsd}
					onChange={(v) => onUpdate({ liquidReserveUsd: v })}
					min={0}
					max={5_000_000}
					step={10_000}
					format={(v) => formatLabel(v, currencySymbol)}
				/>

				<InputField
					label="BTC Price"
					value={portfolio.btcPriceUsd}
					onChange={(v) => onUpdate({ btcPriceUsd: v })}
					min={10_000}
					max={200_000}
					step={1_000}
					format={(v) => formatLabel(v, currencySymbol)}
				/>
			</CardContent>
		</Card>
	);
}
