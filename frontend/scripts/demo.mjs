// One-command Caliber demo launcher: zero external services.
//
// Boots an embedded Postgres (PGlite) exposed over the real wire protocol,
// pushes the schema + seeds demo data on first run, then starts `next dev`.
// The embedded DB's process data lives OUTSIDE frontend/ (../.pglite-data)
// so Next's file watcher never sees its writes.
import { spawn } from "node:child_process";
import { Client } from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..");
const port = Number(process.env.PGLITE_PORT || 5433);

// Self-sufficient: works even with no .env file. Anything already set in the
// environment (e.g. a real JWT_SECRET) is respected via the ?? fallback.
const demoEnv = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable`,
  JWT_SECRET: process.env.JWT_SECRET ?? "local-demo-secret-not-for-prod",
  // PGlite serves one connection at a time; keep node-postgres from opening more.
  DB_POOL_MAX: process.env.DB_POOL_MAX ?? "1",
};

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: frontendDir, stdio: "inherit", env: demoEnv, ...opts });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))));
  });
}

async function waitForDb() {
  for (let i = 0; i < 30; i++) {
    try {
      const c = new Client({ host: "127.0.0.1", port, user: "postgres", password: "postgres", database: "postgres" });
      await c.connect();
      await c.end();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error("Embedded Postgres did not become ready in time");
}

async function hasData() {
  const c = new Client({ host: "127.0.0.1", port, user: "postgres", password: "postgres", database: "postgres" });
  await c.connect();
  try {
    const r = await c.query(`select to_regclass('public."User"') as t`);
    if (!r.rows[0].t) return false; // schema not pushed yet
    const u = await c.query(`select count(*)::int as n from "User"`);
    return u.rows[0].n > 0;
  } finally {
    await c.end();
  }
}

console.log("[demo] starting embedded Postgres...");
const dbProcess = spawn("node", ["scripts/pglite-server.mjs"], { cwd: frontendDir, stdio: "inherit" });

process.on("SIGINT", () => { dbProcess.kill(); process.exit(0); });
process.on("SIGTERM", () => { dbProcess.kill(); process.exit(0); });

await waitForDb();
console.log("[demo] embedded Postgres ready.");

if (!(await hasData())) {
  console.log("[demo] first run — pushing schema and seeding demo data...");
  await run("npx", ["prisma", "db", "push", "--accept-data-loss"]);
  await run("npx", ["prisma", "generate"]);
  await run("npx", ["tsx", "prisma/seed.ts"]);
} else {
  console.log("[demo] existing demo data found — skipping seed.");
}

console.log("\n[demo] Log in at /login with demo@caliber.dev / caliber1234 (see DEMO.md for more)\n");
console.log("[demo] starting Next.js dev server...");
await run("npx", ["next", "dev"]);
