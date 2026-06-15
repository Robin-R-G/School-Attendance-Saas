import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || "file:dev.db",
  });
  prismaInstance = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaLibSql({
      url: "file:dev.db",
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const db = prismaInstance;
