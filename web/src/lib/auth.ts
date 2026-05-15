import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";

const HERMES_BASE = process.env.HERMES_BASE || "http://localhost:8642/v1";
const HERMES_KEY = process.env.HERMES_KEY || "";

function hermesHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (HERMES_KEY) h["Authorization"] = `Bearer ${HERMES_KEY}`;
  return h;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "ldap",
      name: "LDAP",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const username = (credentials as any).username as string;
        const password = (credentials as any).password as string;
        if (!username || !password) return null;

        try {
          const res = await fetch(`${HERMES_BASE}/auth/ldap`, {
            method: "POST",
            headers: hermesHeaders(),
            body: JSON.stringify({ username, password }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.display_name || data.user.username,
            email: data.user.email,
            isAdmin: Boolean(data.user.is_admin),
            personalSpaceId: data.user.personal_space_id,
          };
        } catch {
          return null;
        }
      },
    }),
    Credentials({
      id: "local",
      name: "本地账号",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const username = (credentials as any).username as string;
        const password = (credentials as any).password as string;
        if (!username || !password) return null;

        try {
          const res = await fetch(`${HERMES_BASE}/auth/local`, {
            method: "POST",
            headers: hermesHeaders(),
            body: JSON.stringify({ username, password }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.display_name || data.user.username,
            email: data.user.email,
            isAdmin: Boolean(data.user.is_admin),
            personalSpaceId: data.user.personal_space_id,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
