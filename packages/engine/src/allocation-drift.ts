// =============================================================================
// Allocation Drift Detection (Framework Part 3 — Position Sizing)
// =============================================================================
// Detects when BTC price movement causes the portfolio to drift outside
// the user's chosen conviction rung, and generates a rebalance action.

import { getConvictionRung } from "./position-sizing.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AllocationDriftInput {
	initialBtcPct: number; // BTC % when user last set their allocation
	initialBtcPrice: number; // BTC price at that time
	currentBtcPrice: number; // Current BTC price
	otherAssetsValue: number; // Non-BTC portfolio value (assumed stable)
	btcHoldings: number; // Amount of BTC held (in BTC)
}

export interface AllocationDriftResult {
	currentBtcPct: number; // Current BTC % after price movement
	driftPct: number; // How much allocation has drifted (positive = BTC grew)
	originalRung: string; // Conviction rung at initial allocation
	currentRung: string; // Conviction rung now
	rungChanged: boolean; // Did the drift push into a different rung?
	rebalanceNeeded: boolean; // True if drift > 5% or rung changed
	rebalanceAction: string; // e.g., "Sell $X of BTC to return to Y%"
}

// ---------------------------------------------------------------------------
// Pure calculation
// ---------------------------------------------------------------------------

/**
 * Detect allocation drift caused by BTC price movement.
 *
 * Compares the current BTC allocation (after price movement) to the original
 * allocation, maps both to conviction rungs, and generates a rebalance
 * recommendation if drift exceeds 5% or crosses a rung boundary.
 *
 * Pure function — no side effects.
 */
export function calculateAllocationDrift(input: AllocationDriftInput): AllocationDriftResult {
	const { initialBtcPct, initialBtcPrice, currentBtcPrice, otherAssetsValue, btcHoldings } = input;

	// Current BTC value at current price
	const currentBtcValue = btcHoldings * currentBtcPrice;

	// Total portfolio value: BTC at current price + stable non-BTC assets
	const currentTotalValue = currentBtcValue + otherAssetsValue;

	// Current allocation as a percentage (guard against zero total)
	const currentBtcPct = currentTotalValue > 0 ? (currentBtcValue / currentTotalValue) * 100 : 0;

	// How much has the allocation drifted from the original target
	const driftPct = currentBtcPct - initialBtcPct;

	// Map both percentages to conviction rungs
	const originalRung = getConvictionRung(initialBtcPct);
	const currentRung = getConvictionRung(currentBtcPct);
	const rungChanged = originalRung !== currentRung;

	// Rebalance is needed if drift exceeds 5% threshold or crosses a rung
	const rebalanceNeeded = Math.abs(driftPct) > 5 || rungChanged;

	// Generate a human-readable rebalance action
	const rebalanceAction = buildRebalanceAction({
		initialBtcPct,
		currentBtcPct,
		driftPct,
		currentBtcValue,
		currentTotalValue,
		currentBtcPrice,
		rebalanceNeeded,
		btcHoldings,
	});

	return {
		currentBtcPct,
		driftPct,
		originalRung,
		currentRung,
		rungChanged,
		rebalanceNeeded,
		rebalanceAction,
	};
}

// ---------------------------------------------------------------------------
// Rebalance action string builder
// ---------------------------------------------------------------------------

interface RebalanceParams {
	initialBtcPct: number;
	currentBtcPct: number;
	driftPct: number;
	currentBtcValue: number;
	currentTotalValue: number;
	currentBtcPrice: number;
	rebalanceNeeded: boolean;
	btcHoldings: number;
}

function buildRebalanceAction(p: RebalanceParams): string {
	if (!p.rebalanceNeeded) {
		return `Allocation is on target at ${p.currentBtcPct.toFixed(1)}% BTC.`;
	}

	// USD value at target allocation
	const targetBtcUsd = p.currentTotalValue * (p.initialBtcPct / 100);
	const gapUsd = Math.abs(p.currentBtcValue - targetBtcUsd);
	const gapBtc = p.currentBtcPrice > 0 ? gapUsd / p.currentBtcPrice : 0;

	const formattedUsd = formatUsd(gapUsd);
	const formattedBtc = gapBtc.toFixed(4);
	const targetPct = p.initialBtcPct.toFixed(1);

	if (p.driftPct > 0) {
		// BTC grew — need to sell to return to target
		return `Sell ${formattedUsd} (${formattedBtc} BTC) to return to ${targetPct}% target allocation.`;
	}

	// BTC shrank — need to buy to return to target
	return `Buy ${formattedUsd} (${formattedBtc} BTC) to return to ${targetPct}% target allocation.`;
}

function formatUsd(value: number): string {
	if (value >= 1_000_000) {
		return `$${(value / 1_000_000).toFixed(2)}M`;
	}
	if (value >= 1_000) {
		return `$${Math.round(value / 1_000)}k`;
	}
	return `$${Math.round(value).toLocaleString("en-US")}`;
}
