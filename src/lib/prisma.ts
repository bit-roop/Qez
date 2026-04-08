import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  return new PrismaClient();
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export class DatabaseConnectionError extends Error {
  constructor(message = "Database connection is temporarily unavailable.") {
    super(message);
    this.name = "DatabaseConnectionError";
  }
}

function isTransientDatabaseError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("terminating connection due to administrator command") ||
    message.includes("server has closed the connection") ||
    message.includes("can't reach database server") ||
    message.includes("connection closed") ||
    message.includes("connection terminated unexpectedly") ||
    message.includes("too many connections")
  );
}

export async function withDatabaseRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientDatabaseError(error)) {
      throw error;
    }

    try {
      await prisma.$disconnect();
    } catch {
      // Ignore cleanup failures before reconnecting.
    }

    try {
      await prisma.$connect();
      return await operation();
    } catch (retryError) {
      if (isTransientDatabaseError(retryError)) {
        throw new DatabaseConnectionError();
      }

      throw retryError;
    }
  }
}
