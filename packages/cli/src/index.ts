#!/usr/bin/env node

import { buildServer } from "@timecell/api";
import open from "open";
import { runWizard } from "./wizard.js";

const DEFAULT_PORT = 3737;
const MAX_PORT_ATTEMPTS = 10;

function printBanner() {
  console.log("─────────────────────────────────────────────");
  console.log("  TimeCell v0.1.0 — Crash Survival Calculator");
  console.log("─────────────────────────────────────────────");
}

async function findAvailablePort(server: any, startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + MAX_PORT_ATTEMPTS; port++) {
    try {
      await server.listen({ port, host: "0.0.0.0" });
      return port;
    } catch (err: any) {
      if (err.code === "EADDRINUSE") {
        if (port === startPort) {
          console.log(`  Port ${port} in use, trying next...`);
        }
        continue;
      }
      throw err;
    }
  }
  throw new Error(`No available port found (tried ${startPort}-${startPort + MAX_PORT_ATTEMPTS - 1})`);
}

async function main() {
  printBanner();

  await runWizard();

  console.log("\nStarting TimeCell server...");

  const server = await buildServer();
  const port = await findAvailablePort(server, DEFAULT_PORT);
  const url = `http://localhost:${port}`;

  console.log(`\n  TimeCell is running at ${url}`);
  console.log("  Opening browser...\n");

  await open(url);

  console.log("  Press Ctrl+C to stop.\n");

  const shutdown = async () => {
    console.log("\n  Shutting down TimeCell...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
