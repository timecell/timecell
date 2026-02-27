import { CURRENCIES, type CurrencyCode } from "@/hooks/useCurrencyRate";

interface CurrencySelectorProps {
	currency: CurrencyCode;
	onChange: (code: CurrencyCode) => void;
}

export function CurrencySelector({ currency, onChange }: CurrencySelectorProps) {
	return (
		<select
			value={currency}
			onChange={(e) => onChange(e.target.value as CurrencyCode)}
			className="rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300 px-2 py-1 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-colors cursor-pointer hover:border-slate-600"
			aria-label="Select currency"
		>
			{CURRENCIES.map((c) => (
				<option key={c.code} value={c.code} className="bg-slate-800 text-slate-200">
					{c.label}
				</option>
			))}
		</select>
	);
}
