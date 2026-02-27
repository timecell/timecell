/**
 * Assemble the Vercel output directory.
 * - Landing page (site/) at root
 * - Web dashboard (packages/web/dist/) at /app/
 */

import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const out = resolve(root, "dist-vercel");

// Clean and create output dir
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// Copy landing page to root
cpSync(resolve(root, "site"), out, { recursive: true });

// Copy web dashboard to /app/
mkdirSync(resolve(out, "app"), { recursive: true });
cpSync(resolve(root, "packages/web/dist"), resolve(out, "app"), { recursive: true });

console.log("Vercel output assembled in dist-vercel/");
