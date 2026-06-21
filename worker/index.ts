import { type Context, Hono } from "hono";
import { buildContentSecurityPolicy } from "./lib/security";
import { authRoutes } from "./routes/auth";
import { balanceRoutes } from "./routes/balance";
import { meRoutes } from "./routes/me";

const isDev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;

const securityHeaders: Record<string, string> = {
  "Content-Security-Policy": buildContentSecurityPolicy(isDev),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }
}

async function serveApp(
  c: Context<{ Bindings: Env }>,
  status: number,
): Promise<Response> {
  const asset = await c.env.ASSETS.fetch(new Request(new URL("/", c.req.url)));
  const headers = new Headers(asset.headers);
  if (status !== 200) {
    headers.delete("ETag");
    headers.delete("Last-Modified");
    headers.set("Cache-Control", "no-store");
  }
  applySecurityHeaders(headers);
  return new Response(asset.body, { status, headers });
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await next();
  applySecurityHeaders(c.res.headers);
});

app.route("/auth", authRoutes);
app.route("/api", meRoutes);
app.route("/api", balanceRoutes);

app.get("/balance", (c) => serveApp(c, 200));

app.get("/login-error", (c) => serveApp(c, 403));

app.notFound((c) => serveApp(c, 404));

app.onError(async (_err, c) => {
  const pathname = new URL(c.req.url).pathname;
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
    const headers = new Headers({ "Content-Type": "application/json" });
    applySecurityHeaders(headers);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers,
    });
  }
  try {
    return await serveApp(c, 500);
  } catch {
    const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
    applySecurityHeaders(headers);
    return new Response("<!doctype html><title>500</title>", {
      status: 500,
      headers,
    });
  }
});

export default app;
