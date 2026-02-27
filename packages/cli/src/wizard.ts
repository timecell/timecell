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

export async function runWizard(): Promise<WizardResult> {
  console.log("\nLet's configure your portfolio.\n");

  const totalValueUsd = await number({
    message: "Total portfolio value (USD):",
    default: 5_000_000,
    validate: (v) => (v !== undefined && v > 0 ? true : "Must be a positive number"),
  }) as number;

  const btcPercentage = await number({
    message: "Bitcoin allocation (%):",
    default: 35,
    validate: (v) => (v !== undefined && v >= 0 && v <= 100 ? true : "Must be between 0 and 100"),
  }) as number;

  const monthlyBurnUsd = await number({
    message: "Monthly burn rate (USD):",
    default: 25_000,
    validate: (v) => (v !== undefined && v > 0 ? true : "Must be a positive number"),
  }) as number;

  const liquidReserveUsd = await number({
    message: "Liquid reserve (USD):",
    default: 600_000,
    validate: (v) => (v !== undefined && v >= 0 ? true : "Must be a non-negative number"),
  }) as number;

  const btcPriceUsd = await number({
    message: "Current BTC price (USD):",
    default: 84_000,
    validate: (v) => (v !== undefined && v > 0 ? true : "Must be a positive number"),
  }) as number;

  const portfolio: PortfolioInput = {
    totalValueUsd,
    btcPercentage,
    monthlyBurnUsd,
    liquidReserveUsd,
    btcPriceUsd,
  };

  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(PORTFOLIO_PATH, JSON.stringify({ portfolio }, null, 2));
  console.log(`\nPortfolio saved to ${PORTFOLIO_PATH}`);

  return { portfolio };
}
