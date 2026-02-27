/**
 * Vercel Serverless Function — /api/temperature
 *
 * Fetches the latest Bitcoin temperature from the shared Turso database
 * (same DB used by fo-web, open-fo, and mc-bitcoin-tools).
 *
 * Environment variables required (set in Vercel dashboard):
 *   TURSO_DATABASE_URL  — libsql://fo-web-goenkas.aws-ap-northeast-1.turso.io
 *   TURSO_AUTH_TOKEN    — read-only token for the shared DB
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@libsql/client/web";

interface TemperatureRow {
	timestamp: string;
	temperature: number;
	btc_price: number;
	zone: string;
	source: string;
	mvrv_value: number | null;
	mvrv_score: number | null;
	rhodl_value: number | null;
	rhodl_score: number | null;
}

export default async function handler(
	_req: VercelRequest,
	res: VercelResponse,
) {
	// CORS — allow timecell.ai and localhost
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (_req.method === "OPTIONS") {
		return res.status(204).end();
	}

	const url = process.env.TURSO_DATABASE_URL;
	const authToken = process.env.TURSO_AUTH_TOKEN;

	if (!url || !authToken) {
		return res.status(500).json({
			error: "Temperature service not configured",
			dataSource: "unavailable",
		});
	}

	try {
		const db = createClient({ url, authToken });

		const result = await db.execute(
			"SELECT * FROM temperature_history ORDER BY timestamp DESC LIMIT 1",
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				error: "No temperature data available",
				dataSource: "unavailable",
			});
		}

		const row = result.rows[0] as unknown as TemperatureRow;

		// Normalize zone names — Turso may store "Cool" which maps to "Fear" in TimeCell
		const ZONE_MAP: Record<string, string> = {
			Cool: "Fear",
		};
		const normalizedZone = ZONE_MAP[row.zone] ?? row.zone;

		// Map to the shape TemperatureGauge expects
		const response = {
			score: Math.round(Number(row.temperature)),
			zone: normalizedZone,
			mvrv: Number(row.mvrv_value ?? 0),
			rhodl: Number(row.rhodl_value ?? 0),
			mvrvScore: Number(row.mvrv_score ?? 0),
			rhodlScore: Number(row.rhodl_score ?? 0),
			btcPrice: Number(row.btc_price ?? 0),
			timestamp: row.timestamp,
			dataSource: "turso-live",
		};

		// Cache for 1 hour (temperature updates daily)
		res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
		return res.status(200).json(response);
	} catch (error) {
		console.error("[api/temperature] Turso query failed:", error);
		return res.status(500).json({
			error: "Failed to fetch temperature data",
			dataSource: "unavailable",
		});
	}
}
