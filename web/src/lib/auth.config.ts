import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id as string;
        token.username = (user as any).username as string;
        token.displayName = (user as any).displayName as string;
        token.isAdmin = (user as any).isAdmin as boolean;
        token.personalSpaceId = (user as any).personalSpaceId as string;
        token.currentSpaceId = (user as any).personalSpaceId as string;
      }
      if (trigger === "update" && (session as any)?.currentSpaceId) {
        token.currentSpaceId = (session as any).currentSpaceId as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
      (session.user as any).username = token.username as string;
      (session.user as any).displayName = token.displayName as string;
      (session.user as any).isAdmin = token.isAdmin as boolean;
      (session as any).currentSpaceId = token.currentSpaceId as string;
      (session as any).personalSpaceId = token.personalSpaceId as string;
      return session;
    },
  },

  session: { strategy: "jwt" },
  trustHost: true,
  providers: [], // populated in auth.ts (DB-dependent)
};
