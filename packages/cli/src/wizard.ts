import { input, number, select } from "@inquirer/prompts";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { PortfolioInput } from "@timecell/engine";

const CONFIG_DIR = join(homedir(), ".timecell");
const PORTFOLIO_PATH = join(CONFIG_DIR, "portfolio.json");

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", name: "USD ($)" },
  { code: "INR", symbol: "\u20B9", name: "INR (\u20B9)" },
  { code: "EUR", symbol: "\u20AC", name: "EUR (\u20AC)" },
  { code: "GBP", symbol: "\u00A3", name: "GBP (\u00A3)" },
  { code: "SGD", symbol: "S$", name: "SGD (S$)" },
];

export interface WizardResult {
  portfolio: PortfolioInput;
  currency: { code: string; symbol: string };
}

const SUFFIX_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000,
  cr: 10_000_000,
  lk: 100_000,
  l: 100_000,
};

// Matches optional number (with decimals) followed by optional suffix
const SHORTHAND_RE = /^([0-9]*\.?[0-9]+)\s*(k|m|b|cr|lk|l)$/i;

function parseNumber(raw: string): number | undefined {
  // Strip commas, currency symbols, whitespace (but preserve suffix letters)
  const cleaned = raw.replace(/[$\u20B9\u20AC\u00A3,\s]|S\$/g, "");
  if (cleaned === "") return undefined;

  // Try shorthand suffix match first (e.g. "5m", "25k", "1.5b", "50cr", "10l")
  const match = cleaned.match(SHORTHAND_RE);
  if (match) {
    const num = Number.parseFloat(match[1]);
    const suffix = match[2].toLowerCase();
    const multiplier = SUFFIX_MULTIPLIERS[suffix];
    if (Number.isNaN(num) || !multiplier) return undefined;
    return num * multiplier;
  }

  // Fall back to standard number parsing
  const num = Number(cleaned);
  return Number.isNaN(num) ? undefined : num;
}

async function askAmount(message: string, defaultVal: number, currencySymbol: string): Promise<number> {
  const formatted = defaultVal.toLocaleString("en-US");
  const raw = await input({
    message,
    default: formatted,
    validate: (v) => {
      const num = parseNumber(v);
      if (num === undefined || num <= 0) return `Enter a positive number (e.g. ${currencySymbol}5,000,000 or 5m or 50cr)`;
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

  const currencyCode = await select({
    message: "Select your currency:",
    choices: CURRENCIES.map((c) => ({ name: c.name, value: c.code })),
    default: "USD",
  });
  const currency = CURRENCIES.find((c) => c.code === currencyCode)!;
  const sym = currency.symbol;

  console.log(`\n  Your data stays local (~/.timecell/).\n`);

  const btcPrice = await fetchBtcPrice();
  console.log(`  Current BTC price: ${sym}${btcPrice.toLocaleString("en-US")} (live)\n`);

  const totalValueUsd = await askAmount(`Total portfolio value (${currency.code}):`, 5_000_000, sym);

  const btcPercentage = await number({
    message: "Bitcoin allocation (%):",
    default: 35,
    validate: (v) => (v !== undefined && v >= 0 && v <= 100 ? true : "Must be between 0 and 100"),
  }) as number;

  const monthlyBurnUsd = await askAmount(`Monthly burn rate (${currency.code}):`, 25_000, sym);

  const liquidReserveUsd = await askAmount(`Liquid reserve (${currency.code}):`, 600_000, sym);

  const portfolio: PortfolioInput = {
    totalValueUsd,
    btcPercentage,
    monthlyBurnUsd,
    liquidReserveUsd,
    btcPriceUsd: btcPrice,
  };

  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(PORTFOLIO_PATH, JSON.stringify({ portfolio, currency: { code: currency.code, symbol: sym } }, null, 2));
  console.log(`\nPortfolio saved to ${PORTFOLIO_PATH}`);

  return { portfolio, currency: { code: currency.code, symbol: sym } };
}
