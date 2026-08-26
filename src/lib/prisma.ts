import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

const connectionString = process.env.DATABASE_URL || "";

function createPrismaClient(): PrismaClient {
  try {
    if (!globalForPrisma.pgPool) {
      globalForPrisma.pgPool = new pg.Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 25000, // 25 seconds to gracefully handle Neon cold-starts
        keepAlive: true,
        allowExitOnIdle: false,
      });

      // Handle pool errors silently so process doesn't crash on reconnect
      globalForPrisma.pgPool.on("error", (err) => {
        console.warn("Prisma pgPool background connection warning:", err.message);
      });
    }

    const adapter = new PrismaPg(globalForPrisma.pgPool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (err) {
    console.error("Failed to initialize PrismaPg adapter, falling back to standard client:", err);
    return new PrismaClient({
      log: ["error"],
    });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
