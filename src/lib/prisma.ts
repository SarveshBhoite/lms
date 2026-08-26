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
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
      });

      globalForPrisma.pgPool.on("error", (err) => {
        console.error("Unexpected error on idle PostgreSQL client pool:", err);
      });
    }

    const adapter = new PrismaPg(globalForPrisma.pgPool);
    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  } catch {
    return new PrismaClient({
      log: ["error"],
    });
  }
}

// Ensure fresh instantiation when schema models are generated
export const prisma = process.env.NODE_ENV === "development"
  ? createPrismaClient()
  : globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
