import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a USD value into the user's selected currency for display.
 * The engine always works in USD — this is purely a display-layer conversion.
 *
 * @param usdValue  Raw USD value from the engine
 * @param rate      Exchange rate (USD → target currency), e.g. 83 for INR
 * @param symbol    Currency symbol, e.g. "₹", "€", "$"
 */
export function formatCurrency(usdValue: number, rate: number, symbol: string): string {
	if (!Number.isFinite(usdValue)) return `${symbol}\u221e`;
	const converted = usdValue * rate;
	const abs = Math.abs(converted);
	const prefix = converted < 0 ? "-" : "";
	if (abs >= 1_000_000) return `${prefix}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
	if (abs >= 1_000) return `${prefix}${symbol}${(abs / 1_000).toFixed(0)}K`;
	return `${prefix}${symbol}${Math.round(abs).toLocaleString("en-US")}`;
}

/**
 * Format a USD value into the user's selected currency — full precision (no abbreviation).
 */
export function formatCurrencyFull(usdValue: number, rate: number, symbol: string): string {
	if (!Number.isFinite(usdValue)) return `${symbol}\u221e`;
	const converted = usdValue * rate;
	const prefix = converted < 0 ? "-" : "";
	const abs = Math.abs(converted);
	return `${prefix}${symbol}${Math.round(abs).toLocaleString("en-US")}`;
}
