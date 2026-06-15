import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaD1 } from "@prisma/adapter-d1";

let prismaInstance: PrismaClient;

let d1Database: any = null;
try {
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  d1Database = getCloudflareContext().env.DB;
} catch (e) {
  d1Database = (process.env as any).DB;
}

if (d1Database) {
  // Cloudflare D1 serverless database adapter used at runtime
  const adapter = new PrismaD1(d1Database);
  prismaInstance = new PrismaClient({ adapter });
} else {
  // Local file-based LibSQL adapter used locally or at build time
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaLibSql({
      url: "file:dev.db",
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const db = prismaInstance;
