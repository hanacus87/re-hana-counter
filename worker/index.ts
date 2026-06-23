import { type Context, Hono, type MiddlewareHandler } from "hono";
import { applySecurityHeaders } from "./lib/security";
import { authRoutes } from "./routes/auth";
import { balanceRoutes } from "./routes/balance";
import { meRoutes } from "./routes/me";

const isDev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;

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
  applySecurityHeaders(headers, isDev);
  return new Response(asset.body, { status, headers });
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await next();
  applySecurityHeaders(c.res.headers, isDev);
});

const noStore: MiddlewareHandler = async (c, next) => {
  await next();
  c.res.headers.set("Cache-Control", "no-store");
};

app.use("/api/*", noStore);
app.use("/auth/*", noStore);

app.route("/auth", authRoutes);
app.route("/api", meRoutes);
app.route("/api", balanceRoutes);

app.get("/balance", (c) => serveApp(c, 200));

app.get("/login-error", (c) => serveApp(c, 403));

app.notFound((c) => serveApp(c, 404));

app.onError(async (_err, c) => {
  const pathname = new URL(c.req.url).pathname;
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    applySecurityHeaders(headers, isDev);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers,
    });
  }
  try {
    return await serveApp(c, 500);
  } catch {
    const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
    applySecurityHeaders(headers, isDev);
    return new Response("<!doctype html><title>500</title>", {
      status: 500,
      headers,
    });
  }
});

export default app;
