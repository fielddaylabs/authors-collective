import { blogIdeasConfigured, readBlogIdeasSession, sameOrigin } from "@/lib/blog-post-ideas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24 * 1024;

async function forward(request: Request, method: "GET" | "POST" | "PATCH" | "DELETE") {
  if (method !== "GET" && !sameOrigin(request)) return Response.json({ error: "Request rejected." }, { status: 403, headers: { "cache-control": "no-store" } });
  if (!blogIdeasConfigured()) return Response.json({ error: "The spreadsheet is not configured yet." }, { status: 503, headers: { "cache-control": "no-store" } });
  const session = readBlogIdeasSession(request);
  if (!session) return Response.json({ error: "Your session expired. Sign in again." }, { status: 401, headers: { "cache-control": "no-store" } });

  let body: string | undefined;
  if (method !== "GET") {
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return Response.json({ error: "Request is too large." }, { status: 413 });
    body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) return Response.json({ error: "Request is too large." }, { status: 413 });
  }

  const base = process.env.BLOG_IDEAS_CONDUIT_API_URL;
  const password = process.env.BLOG_IDEAS_ACCESS_PASSWORD;
  if (!base || !password) return Response.json({ error: "The spreadsheet is not configured yet." }, { status: 503, headers: { "cache-control": "no-store" } });
  let url: URL;
  try {
    const origin = new URL(base);
    if (process.env.NODE_ENV === "production" && origin.protocol !== "https:") throw new Error("HTTPS required");
    url = new URL("/api/blog-post-ideas", origin);
  } catch {
    return Response.json({ error: "The spreadsheet connection is not configured correctly." }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${password}`,
        "X-Blog-Ideas-Session": session.token,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const payload = await response.json().catch(() => ({ error: "The spreadsheet service returned an invalid response." }));
    return Response.json(payload, { status: response.status, headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "The spreadsheet service could not be reached." }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

export async function GET(request: Request) { return forward(request, "GET"); }
export async function POST(request: Request) { return forward(request, "POST"); }
export async function PATCH(request: Request) { return forward(request, "PATCH"); }
export async function DELETE(request: Request) { return forward(request, "DELETE"); }
