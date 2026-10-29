import { authenticatePassword, blogIdeasConfigured, clearSessionCookie, createBlogIdeasSession, readBlogIdeasSession, sameOrigin, sessionCookie } from "@/lib/blog-post-ideas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200, cookie?: string) {
  const headers = new Headers({ "cache-control": "no-store" });
  if (cookie) headers.set("set-cookie", cookie);
  return Response.json(payload, { status, headers });
}

export async function GET(request: Request) {
  if (!blogIdeasConfigured()) return json({ error: "The spreadsheet is not configured yet." }, 503);
  const session = readBlogIdeasSession(request);
  if (!session) return json({ authenticated: false }, 401);
  return json({ authenticated: true, name: session.name });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Request rejected." }, 403);
  if (!blogIdeasConfigured()) return json({ error: "The spreadsheet is not configured yet." }, 503);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > 4_096) return json({ error: "Request is too large." }, 413);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "Enter your name and password." }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Enter your name and password." }, 400);
  const value = body as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || name.length > 80) return json({ error: "Enter a name up to 80 characters." }, 400);
  if (!authenticatePassword(value.password)) return json({ error: "That password did not match." }, 401);
  try {
    const session = createBlogIdeasSession(name);
    return json({ authenticated: true, name }, 200, sessionCookie(session.token));
  } catch {
    return json({ error: "The spreadsheet is not configured yet." }, 503);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Request rejected." }, 403);
  return json({ authenticated: false }, 200, clearSessionCookie());
}
