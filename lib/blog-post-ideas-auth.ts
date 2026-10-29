import { createHmac, timingSafeEqual } from "node:crypto";

export const BLOG_IDEAS_COOKIE = "blog_ideas_session";
export const BLOG_IDEAS_SESSION_SECONDS = 12 * 60 * 60;

export type BlogIdeasSession = { name: string; expiresAt: number; token: string };

function accessPassword(): string | undefined {
  const value = process.env.BLOG_IDEAS_ACCESS_PASSWORD;
  return value && value.length >= 12 ? value : undefined;
}

function sessionSecret(): string | undefined {
  const value = process.env.BLOG_IDEAS_SESSION_SECRET;
  return value && value.length >= 32 ? value : undefined;
}

export function blogIdeasConfigured(): boolean {
  return Boolean(accessPassword() && sessionSecret() && process.env.BLOG_IDEAS_CONDUIT_API_URL);
}

function constantTimeEqual(expected: string, received: string): boolean {
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(received, "utf8");
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function authenticatePassword(password: unknown): boolean {
  const expected = accessPassword();
  return Boolean(expected && typeof password === "string" && constantTimeEqual(expected, password));
}

export function createBlogIdeasSession(name: string): { token: string; expiresAt: number } {
  const secret = sessionSecret();
  if (!secret) throw new Error("Blog Post Ideas authentication is not configured.");
  const expiresAt = Date.now() + BLOG_IDEAS_SESSION_SECONDS * 1_000;
  const payload = Buffer.from(JSON.stringify({ name, expiresAt }), "utf8").toString("base64url");
  return { token: `${payload}.${signature(payload, secret)}`, expiresAt };
}

export function readBlogIdeasSession(request: Request): BlogIdeasSession | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${BLOG_IDEAS_COOKIE}=`))?.slice(BLOG_IDEAS_COOKIE.length + 1);
  if (!token) return null;
  const [payload, receivedSignature, extra] = token.split(".");
  if (!payload || !receivedSignature || extra) return null;
  const expected = Buffer.from(signature(payload, secret), "base64url");
  let received: Buffer;
  try { received = Buffer.from(receivedSignature, "base64url"); } catch { return null; }
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  let value: unknown;
  try { value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { return null; }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const session = value as { name?: unknown; expiresAt?: unknown };
  if (typeof session.name !== "string" || !session.name.trim() || session.name.length > 80 || typeof session.expiresAt !== "number" || session.expiresAt <= Date.now()) return null;
  return { name: session.name.trim(), expiresAt: session.expiresAt, token };
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${BLOG_IDEAS_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${BLOG_IDEAS_SESSION_SECONDS}${secure}`;
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${BLOG_IDEAS_COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secure}`;
}
