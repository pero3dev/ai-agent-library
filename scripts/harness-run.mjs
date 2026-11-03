#!/usr/bin/env node
// Keep the documented CLI/import path while Node executes the typed implementation.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { main } from "./harness-run.mts";
export * from "./harness-run.mts";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await main(), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
