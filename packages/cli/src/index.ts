#!/usr/bin/env node

import { buildServer } from "@timecell/api";
import open from "open";
import { runWizard } from "./wizard.js";

const APP_URL = "http://localhost:3737";

function printBanner() {
  console.log("─────────────────────────────────────────────");
  console.log("  TimeCell v0.1.0 — Crash Survival Calculator");
  console.log("─────────────────────────────────────────────");
}

async function main() {
  printBanner();

  await runWizard();

  console.log("\nStarting TimeCell API server...");

  const server = await buildServer();

  try {
    await server.listen({ port: 3737, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  console.log(`\nTimeCell is running at ${APP_URL}`);
  console.log("Opening browser...\n");

  await open(APP_URL);

  console.log("Press Ctrl+C to stop.\n");

  const shutdown = async () => {
    console.log("\nShutting down TimeCell...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
