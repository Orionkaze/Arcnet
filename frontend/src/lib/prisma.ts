import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
// DB_POOL_MAX lets local/demo databases (e.g. an embedded single-connection
// engine) cap concurrent connections; unset in production for the normal
// node-postgres default pool size.
const poolMax = process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : undefined;
const pool = new Pool({ connectionString, ...(poolMax ? { max: poolMax } : {}) });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
