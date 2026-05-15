import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const HERMES_BASE = process.env.HERMES_API_URL || "http://localhost:8642/v1";
const HERMES_KEY = process.env.HERMES_API_KEY || "";

// Auth-related paths that don't require a user session
const PUBLIC_UPSTREAM = new Set(["auth/has-admin", "auth/init"]);

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (HERMES_KEY) {
    headers["Authorization"] = `Bearer ${HERMES_KEY}`;
  }
  return headers;
}

async function proxyRequest(
  method: "GET" | "POST",
  req: Request,
  upstreamPath: string,
) {
  const session = await auth();
  const isPublic = PUBLIC_UPSTREAM.has(upstreamPath);

  if (!isPublic && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = buildHeaders();
  if (session?.user) {
    headers["X-Hermes-User"] = (session.user as any).id || session.user.email || "unknown";
    const spaceId = (session as any).currentSpaceId;
    if (spaceId) {
      headers["X-Hermes-Space"] = spaceId;
    }
  }

  const upstreamUrl = `${HERMES_BASE}/${upstreamPath}`;

  const init: RequestInit = { method, headers };
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    init.body = await req.text();
  }

  try {
    const upstream = await fetch(upstreamUrl, init);

    if (!upstream.ok) {
      const err = await upstream.text();
      return NextResponse.json(
        { error: `Upstream error: ${err}` },
        { status: upstream.status },
      );
    }

    // SSE streaming — pipe through
    if (upstream.headers.get("content-type")?.includes("text/event-stream")) {
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: `Hermes unreachable: ${String(err)}` },
      { status: 502 },
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest("GET", req, path.join("/"));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest("POST", req, path.join("/"));
}
