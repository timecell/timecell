import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "SGD";

export interface CurrencyOption {
	code: CurrencyCode;
	symbol: string;
	label: string;
}

export const CURRENCIES: CurrencyOption[] = [
	{ code: "USD", symbol: "$", label: "USD ($)" },
	{ code: "INR", symbol: "₹", label: "INR (₹)" },
	{ code: "EUR", symbol: "€", label: "EUR (€)" },
	{ code: "GBP", symbol: "£", label: "GBP (£)" },
	{ code: "SGD", symbol: "S$", label: "SGD (S$)" },
];

/** Hardcoded fallback rates (USD → currency). Updated periodically — exact values not critical. */
const FALLBACK_RATES: Record<CurrencyCode, number> = {
	USD: 1,
	INR: 83,
	EUR: 0.92,
	GBP: 0.79,
	SGD: 1.34,
};

const LS_RATE_KEY = "timecell_fx_rate";
const LS_CURRENCY_KEY = "timecell_currency";
const TTL_MS = 60 * 60 * 1_000; // 1 hour

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CurrencyRateState {
	currency: CurrencyCode;
	symbol: string;
	rate: number;
	loading: boolean;
	lastUpdated: Date | null;
	setCurrency: (code: CurrencyCode) => void;
}

interface CachedRate {
	currency: CurrencyCode;
	rate: number;
	timestamp: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadCachedRate(currency: CurrencyCode): number | null {
	try {
		const raw = localStorage.getItem(LS_RATE_KEY);
		if (!raw) return null;
		const cached = JSON.parse(raw) as CachedRate;
		if (cached.currency !== currency) return null;
		if (Date.now() - cached.timestamp > TTL_MS) return null;
		return cached.rate;
	} catch {
		return null;
	}
}

function saveCachedRate(currency: CurrencyCode, rate: number): void {
	try {
		const entry: CachedRate = { currency, rate, timestamp: Date.now() };
		localStorage.setItem(LS_RATE_KEY, JSON.stringify(entry));
	} catch {
		// ignore storage errors
	}
}

function loadSavedCurrency(): CurrencyCode {
	try {
		const raw = localStorage.getItem(LS_CURRENCY_KEY);
		if (raw && CURRENCIES.some((c) => c.code === raw)) return raw as CurrencyCode;
	} catch {
		// ignore
	}
	return "USD";
}

function saveCurrency(code: CurrencyCode): void {
	try {
		localStorage.setItem(LS_CURRENCY_KEY, code);
	} catch {
		// ignore
	}
}

function getSymbol(code: CurrencyCode): string {
	return CURRENCIES.find((c) => c.code === code)?.symbol ?? "$";
}

async function fetchRate(currency: CurrencyCode): Promise<number | null> {
	if (currency === "USD") return 1;
	try {
		const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
		if (!res.ok) return null;
		const data = await res.json();
		const rate = data?.rates?.[currency];
		if (typeof rate !== "number" || rate <= 0) return null;
		return rate;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCurrencyRate(): CurrencyRateState {
	const [currency, setCurrencyState] = useState<CurrencyCode>(loadSavedCurrency);
	const [rate, setRate] = useState<number>(() => {
		const cached = loadCachedRate(loadSavedCurrency());
		return cached ?? FALLBACK_RATES[loadSavedCurrency()];
	});
	const [loading, setLoading] = useState(false);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	const loadRate = useCallback(async (code: CurrencyCode) => {
		if (code === "USD") {
			setRate(1);
			setLastUpdated(new Date());
			setLoading(false);
			return;
		}

		// Check cache first
		const cached = loadCachedRate(code);
		if (cached !== null) {
			setRate(cached);
			setLastUpdated(new Date());
			setLoading(false);
			return;
		}

		// Fetch fresh rate
		setLoading(true);
		const fetched = await fetchRate(code);
		if (fetched !== null) {
			setRate(fetched);
			saveCachedRate(code, fetched);
			setLastUpdated(new Date());
		} else {
			// Fall back to hardcoded default
			setRate(FALLBACK_RATES[code]);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		loadRate(currency);
	}, [currency, loadRate]);

	const setCurrency = useCallback(
		(code: CurrencyCode) => {
			setCurrencyState(code);
			saveCurrency(code);
			loadRate(code);
		},
		[loadRate],
	);

	return {
		currency,
		symbol: getSymbol(currency),
		rate,
		loading,
		lastUpdated,
		setCurrency,
	};
}
