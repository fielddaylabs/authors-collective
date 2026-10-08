import { NextResponse } from "next/server";

export const runtime = "nodejs";

const providerTimeoutMs = 12_000;
const maxBodyBytes = 256 * 1024;
const allowedAgents = {
  sales: "SALES_AGENT_STUDIO_AGENT_ID",
  support: "SUPPORT_AGENT_STUDIO_AGENT_ID",
} as const;
const allowedDestinations = new Set(["sales", "support"] as const);

type Agent = keyof typeof allowedAgents;
type ProviderErrorKind =
  | "not_configured"
  | "rate_limited"
  | "provider_unavailable"
  | "provider_rejected"
  | "provider_invalid_response";

class ValidationError extends Error {}

function allowedOrigins() {
  return new Set(
    (process.env.AGENT_HANDOFF_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function originIsAllowed(request: Request, origin: string | null) {
  if (!origin) return true;
  if (origin === new URL(request.url).origin) return true;
  return allowedOrigins().has(origin);
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

function text(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(`${field} is required.`);
  const result = value.trim();
  if (result.length > maxLength) throw new ValidationError(`${field} is too long.`);
  return result;
}

function optionalText(value: unknown, field: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return "";
  return text(value, field, maxLength);
}

function validateAgent(value: unknown): Agent {
  if (typeof value !== "string" || !allowedDestinations.has(value as Agent)) {
    throw new ValidationError("Unknown agent destination.");
  }
  return value as Agent;
}

function validateContext(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("Approved user and tenant context is required.");
  }
  const context = value as Record<string, unknown>;
  const approved = new Set(["userId", "tenantId", "plan"]);
  if (Object.keys(context).some((key) => !approved.has(key))) {
    throw new ValidationError("Context contains an unapproved field.");
  }
  const result: { userId: string; tenantId: string; plan?: string } = {
    userId: text(context.userId, "context.userId", 120),
    tenantId: text(context.tenantId, "context.tenantId", 120),
  };
  if (context.plan !== undefined) result.plan = text(context.plan, "context.plan", 80);
  if (Buffer.byteLength(JSON.stringify(result)) > 2_000) throw new ValidationError("Approved context is too large.");
  return result;
}

function validateMessages(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) {
    throw new ValidationError("The conversation must contain between 1 and 12 messages.");
  }
  return value.map((message, index) => {
    if (!message || typeof message !== "object") throw new ValidationError(`messages[${index}] is invalid.`);
    const item = message as Record<string, unknown>;
    if (item.role !== "user" && item.role !== "assistant") throw new ValidationError(`messages[${index}].role is invalid.`);
    const content = text(item.content, `messages[${index}].content`, 4_000);
    return {
      id: typeof item.id === "string" ? item.id.slice(0, 120) : `msg_${crypto.randomUUID()}`,
      role: item.role,
      content,
      parts: [{ type: "text", text: content }],
    };
  });
}

function providerReady(agent: Agent) {
  return Boolean(
    process.env.ALGOLIA_APPLICATION_ID &&
      process.env.ALGOLIA_AGENT_STUDIO_API_KEY &&
      process.env[allowedAgents[agent]],
  );
}

function providerUrl(agent: Agent) {
  const appId = encodeURIComponent(process.env.ALGOLIA_APPLICATION_ID ?? "");
  const agentId = encodeURIComponent(process.env[allowedAgents[agent]] ?? "");
  return `https://${appId}.algolia.net/agent-studio/1/agents/${agentId}/completions?stream=false&compatibilityMode=ai-sdk-5`;
}

function providerError(status: number, detail: string) {
  const error = new Error(detail || "Agent Studio request failed.") as Error & { kind?: ProviderErrorKind; status?: number };
  error.kind = status === 429 ? "rate_limited" : status >= 500 ? "provider_unavailable" : "provider_rejected";
  error.status = status;
  return error;
}

function responseText(payload: unknown) {
  const result = payload as {
    parts?: Array<{ type?: string; text?: string }>;
    content?: string;
    messages?: Array<{ role?: string; content?: string }>;
  };
  if (Array.isArray(result.parts)) {
    const parts = result.parts.filter((part) => part?.type === "text" && typeof part.text === "string");
    if (parts.length) return parts.map((part) => part.text).join("");
  }
  if (typeof result.content === "string") return result.content;
  if (Array.isArray(result.messages)) {
    const message = result.messages.find((item) => item?.role === "assistant");
    if (typeof message?.content === "string") return message.content;
  }
  return "";
}

async function callAgent(agent: Agent, messages: ReturnType<typeof validateMessages>, signal: AbortSignal, conversationId: string) {
  if (!providerReady(agent)) {
    const error = new Error("The Agent Studio provider is not configured.") as Error & { kind?: ProviderErrorKind };
    error.kind = "not_configured";
    throw error;
  }
  const response = await fetch(providerUrl(agent), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": process.env.ALGOLIA_APPLICATION_ID ?? "",
      "X-Algolia-API-Key": process.env.ALGOLIA_AGENT_STUDIO_API_KEY ?? "",
    },
    body: JSON.stringify({ id: conversationId, messages }),
    signal,
  });
  if (!response.ok) throw providerError(response.status, (await response.text().catch(() => "")).slice(0, 240));
  const content = responseText(await response.json());
  if (!content) {
    const error = new Error("Agent Studio returned no assistant text.") as Error & { kind?: ProviderErrorKind };
    error.kind = "provider_invalid_response";
    throw error;
  }
  return content;
}

async function callWithRetry(agent: Agent, messages: ReturnType<typeof validateMessages>, signal: AbortSignal, conversationId: string) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return { content: await callAgent(agent, messages, signal, conversationId), attempts: attempt };
    } catch (error) {
      const typed = error as Error & { kind?: ProviderErrorKind };
      if (signal.aborted || !["rate_limited", "provider_unavailable"].includes(typed.kind ?? "") || attempt === 2) throw error;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 300);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(signal.reason ?? new Error("Request cancelled."));
        }, { once: true });
      });
    }
  }
  throw new Error("Agent Studio request failed.");
}

function handoffPrompt(latestQuestion: string, summary: string, context: ReturnType<typeof validateContext>) {
  return [
    "You are receiving a narrowly scoped application-owned handoff from Sales.",
    "Answer the latest question as Support. Do not infer or request additional identity data.",
    "",
    `Latest question:\n${latestQuestion}`,
    `Sales summary:\n${summary}`,
    `Approved context:\n${JSON.stringify(context)}`,
  ].join("\n");
}

function errorPayload(error: unknown) {
  const typed = error as Error & { kind?: ProviderErrorKind };
  const known = new Set<ProviderErrorKind>(["not_configured", "rate_limited", "provider_unavailable", "provider_rejected", "provider_invalid_response"]);
  return {
    error: known.has(typed.kind as ProviderErrorKind) ? typed.kind : typed.name === "AbortError" ? "cancelled" : "request_failed",
    message:
      typed.kind === "not_configured" ? typed.message :
        typed.kind === "rate_limited" ? "Agent Studio is rate limiting this demo. Try again shortly." :
          typed.kind === "provider_unavailable" ? "Agent Studio is temporarily unavailable. Try again shortly." :
            typed.kind === "provider_rejected" ? "Agent Studio rejected the request." :
              typed.message || "The request could not be completed.",
  };
}

function makeController(request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("Agent Studio request timed out.")), providerTimeoutMs);
  request.signal.addEventListener("abort", () => controller.abort(request.signal.reason), { once: true });
  return { controller, timeout };
}

export async function OPTIONS(request: Request) {
  if (!originIsAllowed(request, request.headers.get("origin"))) return json(request, { error: "origin_not_allowed" }, 403);
  const headers = corsHeaders(request);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "content-type");
  headers.set("Access-Control-Max-Age", "600");
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: Request) {
  if (!originIsAllowed(request, request.headers.get("origin"))) return json(request, { error: "origin_not_allowed" }, 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBodyBytes) return json(request, { error: "request_too_large" }, 413);
  const { controller, timeout } = makeController(request);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mode = body.mode === "handoff" ? "handoff" : "chat";
    const conversationId = optionalText(body.conversationId, "conversationId", 120) || `chat_${crypto.randomUUID()}`;
    if (mode === "chat") {
      const agent = validateAgent(body.agent);
      const result = await callWithRetry(agent, validateMessages(body.messages), controller.signal, conversationId);
      return json(request, { ...result, agent });
    }
    const latestQuestion = text(body.latestQuestion, "latestQuestion", 4_000);
    const summary = text(body.summary, "summary", 2_000);
    const context = validateContext(body.context);
    const result = await callWithRetry("support", validateMessages([{ role: "user", content: handoffPrompt(latestQuestion, summary, context) }]), controller.signal, conversationId);
    return json(request, { ...result, agent: "support", handoff: { sourceAgent: "sales", destination: "support", contextBytes: Buffer.byteLength(JSON.stringify(context)) } });
  } catch (error) {
    if (error instanceof ValidationError) return json(request, { error: "validation_failed", message: error.message }, 400);
    if (controller.signal.aborted) return json(request, { error: "timeout", message: "The request timed out or was cancelled." }, 504);
    const typed = error as Error & { status?: number };
    return json(request, errorPayload(error), typed.status ?? 502);
  } finally {
    clearTimeout(timeout);
  }
}
