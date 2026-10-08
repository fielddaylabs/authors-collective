import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultDemoOrigin = "https://dynamic-index-routing-agent-studio.authorscollective.org";
const defaultPublicOrigins = new Set([
  "https://authorscollective.org",
  "https://www.authorscollective.org",
  "https://algolia.com",
  "https://www.algolia.com",
  "https://blog.algolia.com",
]);
const maxBodyBytes = 32 * 1024;
const upstreamTimeoutMs = 15_000;

function configuredOrigins() {
  return new Set(
    (process.env.DYNAMIC_ROUTING_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function originIsAllowed(request: Request, origin: string | null) {
  if (!origin) return true;
  if (origin === new URL(request.url).origin) return true;
  return defaultPublicOrigins.has(origin) || configuredOrigins().has(origin);
}

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const headers = new Headers({ "Cache-Control": "no-store", Vary: "Origin" });
  if (origin && originIsAllowed(request, origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function json(request: Request, payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: corsHeaders(request) });
}

function upstreamOrigin() {
  return (process.env.DYNAMIC_ROUTING_DEMO_ORIGIN ?? defaultDemoOrigin).replace(/\/+$/, "");
}

async function callUpstream(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), upstreamTimeoutMs);
  try {
    const response = await fetch(upstreamOrigin() + path, { ...init, signal: controller.signal });
    const text = await response.text();
    let payload: unknown = text;
    try { payload = text ? JSON.parse(text) : {}; } catch { /* Preserve non-JSON upstream diagnostics. */ }
    return { response, payload };
  } finally {
    clearTimeout(timeout);
  }
}

function rejectDisallowedOrigin(request: Request) {
  return originIsAllowed(request, request.headers.get("origin"))
    ? null
    : json(request, { error: "origin_not_allowed" }, 403);
}

export async function OPTIONS(request: Request) {
  const rejected = rejectDisallowedOrigin(request);
  if (rejected) return rejected;
  const headers = corsHeaders(request);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "content-type");
  headers.set("Access-Control-Max-Age", "600");
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request: Request) {
  const rejected = rejectDisallowedOrigin(request);
  if (rejected) return rejected;
  try {
    const { response, payload } = await callUpstream("/api/routes", { headers: { Accept: "application/json" } });
    return json(request, payload, response.ok ? 200 : 502);
  } catch {
    return json(request, { error: "demo_unavailable", message: "The dynamic routing demo is unavailable." }, 502);
  }
}

export async function POST(request: Request) {
  const rejected = rejectDisallowedOrigin(request);
  if (rejected) return rejected;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBodyBytes) return json(request, { error: "request_too_large" }, 413);

  try {
    const body = await request.json();
    const { response, payload } = await callUpstream("/api/completion", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return json(request, payload, response.ok ? 200 : response.status >= 400 && response.status < 500 ? response.status : 502);
  } catch (error) {
    if (error instanceof SyntaxError) return json(request, { error: "invalid_json", message: "Request body must be valid JSON." }, 400);
    return json(request, { error: "demo_unavailable", message: "The dynamic routing demo is unavailable." }, 502);
  }
}
