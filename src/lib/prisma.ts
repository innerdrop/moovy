// Prisma Client Singleton for Server Components
// Configured for Prisma 7 with better-sqlite3 adapter

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
    // Create SQLite database connection
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const sqlite = new Database(dbPath);

    // Create adapter
    const adapter = new PrismaBetterSqlite3(sqlite as any);

    // Create Prisma client with adapter
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
