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
    // Reuse or create a tuned persistent connection pool for Neon serverless postgres
    if (!globalForPrisma.pgPool) {
      globalForPrisma.pgPool = new pg.Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        keepAlive: true,
      });
    }

    const adapter = new PrismaPg(globalForPrisma.pgPool);
    return new PrismaClient({
      adapter,
      log: ["error"], // Reduce overhead in dev
    });
  } catch {
    return new PrismaClient({
      log: ["error"],
    });
  }
}

// Reset global instance in development when schema updates
export const prisma = createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
