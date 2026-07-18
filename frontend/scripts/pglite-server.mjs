// Boots an embedded Postgres (PGlite) and exposes it over the real Postgres
// wire protocol on localhost, so Prisma (migrate/db push + the runtime `pg`
// adapter) can talk to it exactly like a normal Postgres server — zero
// external services, zero installs. Demo/local-dev only.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// IMPORTANT: this must live OUTSIDE the frontend/ tree. Next's dev file
// watcher treats any write inside the project as a source change, and
// PGlite's continuous disk writes would otherwise trigger an endless
// Fast Refresh loop that can swallow UI interactions.
const dataDir = path.join(__dirname, "..", "..", ".pglite-data");
const port = Number(process.env.PGLITE_PORT || 5433);

const db = new PGlite(dataDir);
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });

await server.start();
console.log(`[pglite] embedded Postgres listening on 127.0.0.1:${port} (data: ${dataDir})`);

function shutdown() {
  console.log("[pglite] shutting down...");
  server.stop().finally(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
