import { input, number } from "@inquirer/prompts";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { PortfolioInput } from "@timecell/engine";

const CONFIG_DIR = join(homedir(), ".timecell");
const PORTFOLIO_PATH = join(CONFIG_DIR, "portfolio.json");

export interface WizardResult {
  portfolio: PortfolioInput;
}

function parseNumber(raw: string): number | undefined {
  // Strip commas, currency symbols, whitespace
  const cleaned = raw.replace(/[$,\s]/g, "");
  const num = Number(cleaned);
  return Number.isNaN(num) ? undefined : num;
}

async function askUsd(message: string, defaultVal: number): Promise<number> {
  const formatted = defaultVal.toLocaleString("en-US");
  const raw = await input({
    message,
    default: formatted,
    validate: (v) => {
      const num = parseNumber(v);
      if (num === undefined || num <= 0) return "Enter a positive number (commas OK, e.g. 5,000,000)";
      return true;
    },
  });
  return parseNumber(raw)!;
}

async function fetchBtcPrice(): Promise<number> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    const data = await res.json();
    return Math.round(data.bitcoin.usd);
  } catch {
    return 84_000; // fallback
  }
}

export async function runWizard(): Promise<WizardResult> {
  console.log("\nLet's configure your portfolio.\n");
  console.log("  All values in USD. Your data stays local (~/.timecell/).\n");

  const btcPrice = await fetchBtcPrice();
  console.log(`  Current BTC price: $${btcPrice.toLocaleString("en-US")} (live)\n`);

  const totalValueUsd = await askUsd("Total portfolio value (USD):", 5_000_000);

  const btcPercentage = await number({
    message: "Bitcoin allocation (%):",
    default: 35,
    validate: (v) => (v !== undefined && v >= 0 && v <= 100 ? true : "Must be between 0 and 100"),
  }) as number;

  const monthlyBurnUsd = await askUsd("Monthly burn rate (USD):", 25_000);

  const liquidReserveUsd = await askUsd("Liquid reserve (USD):", 600_000);

  const portfolio: PortfolioInput = {
    totalValueUsd,
    btcPercentage,
    monthlyBurnUsd,
    liquidReserveUsd,
    btcPriceUsd: btcPrice,
  };

  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(PORTFOLIO_PATH, JSON.stringify({ portfolio }, null, 2));
  console.log(`\nPortfolio saved to ${PORTFOLIO_PATH}`);

  return { portfolio };
}
