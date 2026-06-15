import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [], // Added dynamically in auth.ts
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.schoolCode = user.schoolCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as any;
        session.user.schoolId = token.schoolId as string | null | undefined;
        session.user.schoolCode = token.schoolCode as string | null | undefined;
      }
      return session;
    },
  },
};
