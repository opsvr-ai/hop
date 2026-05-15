import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = new Set(["/login", "/setup", "/join", "/api/auth", "/api/hermes/auth"]);

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  const isPublic = [...PUBLIC_PATHS].some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};
