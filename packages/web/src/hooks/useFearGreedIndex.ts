import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FearGreedData {
	score: number;
	label: string;
	timestamp: string;
	loading: boolean;
}

interface CachedFng {
	score: number;
	label: string;
	timestamp: string;
	cachedAt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LS_KEY = "timecell_fng";
const TTL_MS = 60 * 60 * 1_000; // 1 hour
const FNG_URL = "https://api.alternative.me/fng/?limit=1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadCache(): CachedFng | null {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return null;
		const cached = JSON.parse(raw) as CachedFng;
		if (Date.now() - cached.cachedAt > TTL_MS) return null;
		return cached;
	} catch {
		return null;
	}
}

function saveCache(score: number, label: string, timestamp: string): void {
	try {
		const entry: CachedFng = { score, label, timestamp, cachedAt: Date.now() };
		localStorage.setItem(LS_KEY, JSON.stringify(entry));
	} catch {
		// ignore storage errors
	}
}

function loadStaleCache(): CachedFng | null {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as CachedFng;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFearGreedIndex(): FearGreedData | null {
	const [data, setData] = useState<FearGreedData | null>(() => {
		// Initialise from cache (fresh or stale) so there is no flicker on mount
		const cached = loadStaleCache();
		if (!cached) return null;
		return {
			score: cached.score,
			label: cached.label,
			timestamp: cached.timestamp,
			loading: false,
		};
	});

	useEffect(() => {
		// If we already have a fresh cache, no need to fetch
		const fresh = loadCache();
		if (fresh) {
			setData({
				score: fresh.score,
				label: fresh.label,
				timestamp: fresh.timestamp,
				loading: false,
			});
			return;
		}

		let cancelled = false;

		setData((prev) =>
			prev
				? { ...prev, loading: true }
				: { score: 0, label: "", timestamp: "", loading: true },
		);

		async function fetchFng() {
			try {
				const res = await fetch(FNG_URL);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = await res.json();
				const entry = json?.data?.[0];
				if (!entry) throw new Error("Unexpected FNG response shape");

				const score = Number(entry.value);
				const label = entry.value_classification as string;
				// API returns a Unix timestamp string
				const timestamp = new Date(Number(entry.timestamp) * 1000).toISOString();

				if (!cancelled) {
					saveCache(score, label, timestamp);
					setData({ score, label, timestamp, loading: false });
				}
			} catch {
				if (!cancelled) {
					// Fall back to stale cache (any age) rather than showing nothing
					const stale = loadStaleCache();
					if (stale) {
						setData({
							score: stale.score,
							label: stale.label,
							timestamp: stale.timestamp,
							loading: false,
						});
					} else {
						// No cache at all — return null (component will handle gracefully)
						setData(null);
					}
				}
			}
		}

		fetchFng();

		return () => {
			cancelled = true;
		};
	}, []);

	return data;
}
