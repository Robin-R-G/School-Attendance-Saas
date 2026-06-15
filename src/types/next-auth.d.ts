import { Role } from "../generated/prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    schoolId?: string | null;
    schoolCode?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      schoolId?: string | null;
      schoolCode?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    schoolId?: string | null;
    schoolCode?: string | null;
  }
}
