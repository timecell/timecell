import { useEffect, useRef, useState } from "react";
import { useBtcPrice } from "@/hooks/useBtcPrice";

interface BtcPriceTickerProps {
	/** Fallback price if live fetch fails (e.g. portfolio's btcPriceUsd) */
	fallbackPrice?: number;
	/** Currency symbol to display (e.g. "$", "₹", "€") */
	currencySymbol?: string;
	/** Exchange rate — multiply USD values by this to display in local currency */
	currencyRate?: number;
}

type FlashDirection = "up" | "down" | null;

function formatPrice(price: number, symbol: string): string {
	return `${symbol}${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function secondsAgo(date: Date): number {
	return Math.floor((Date.now() - date.getTime()) / 1_000);
}

function useSecondsAgo(lastUpdated: Date | null): number | null {
	const [secs, setSecs] = useState<number | null>(
		lastUpdated ? secondsAgo(lastUpdated) : null,
	);

	useEffect(() => {
		if (!lastUpdated) return;
		setSecs(secondsAgo(lastUpdated));
		const t = setInterval(() => setSecs(secondsAgo(lastUpdated)), 5_000);
		return () => clearInterval(t);
	}, [lastUpdated]);

	return secs;
}

export function BtcPriceTicker({
	fallbackPrice,
	currencySymbol = "$",
	currencyRate = 1,
}: BtcPriceTickerProps) {
	const { price, loading, lastUpdated, source } = useBtcPrice(fallbackPrice);
	const displayPrice = price !== null ? price * currencyRate : null;
	const prevPriceRef = useRef<number | null>(null);
	const [flash, setFlash] = useState<FlashDirection>(null);
	const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const secs = useSecondsAgo(lastUpdated);

	// Detect price direction change and trigger flash (based on raw USD price)
	useEffect(() => {
		if (price === null) return;
		const prev = prevPriceRef.current;

		if (prev !== null && prev !== price) {
			const direction: FlashDirection = price > prev ? "up" : "down";
			setFlash(direction);

			if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
			flashTimerRef.current = setTimeout(() => setFlash(null), 1_500);
		}

		prevPriceRef.current = price;

		return () => {
			if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
		};
	}, [price]);

	// Price text colour transitions: green flash on up, red flash on down, neutral otherwise
	const priceColorClass =
		flash === "up"
			? "text-emerald-400"
			: flash === "down"
				? "text-red-400"
				: "text-white";

	const lastUpdatedLabel =
		secs === null
			? null
			: secs < 10
				? "just now"
				: secs < 60
					? `${secs}s ago`
					: `${Math.floor(secs / 60)}m ago`;

	return (
		<div className="flex items-center gap-2">
			{/* Pulsing live indicator dot */}
			<span className="relative flex h-2 w-2 flex-shrink-0">
				<span
					className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
						source === null ? "bg-slate-500" : "bg-emerald-500"
					}`}
				/>
				<span
					className={`relative inline-flex h-2 w-2 rounded-full ${
						source === null ? "bg-slate-500" : "bg-emerald-500"
					}`}
				/>
			</span>

			<div className="flex flex-col items-end leading-none">
				{/* Price */}
				<span
					className={`tabular-nums text-sm font-semibold transition-colors duration-700 ${priceColorClass}`}
				>
					{loading && displayPrice === null ? (
						<span className="inline-block h-4 w-20 animate-pulse rounded bg-slate-700" />
					) : displayPrice !== null ? (
						formatPrice(displayPrice, currencySymbol)
					) : (
						<span className="text-slate-500">—</span>
					)}
				</span>

				{/* "Last updated" sub-label */}
				<span className="text-[10px] text-slate-500 mt-0.5">
					{lastUpdatedLabel
						? `updated ${lastUpdatedLabel}`
						: source === null
							? "fetching…"
							: null}
				</span>
			</div>
		</div>
	);
}
