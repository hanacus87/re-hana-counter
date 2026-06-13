import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
  buildAuthorizationUrl,
  createPkce,
  exchangeCodeForIdToken,
  randomToken,
} from "./lib/oauth";
import { verifyIdToken } from "./lib/oidc";
import { buildContentSecurityPolicy } from "./lib/security";
import { signSession, verifySession } from "./lib/session";
import { findUserName, upsertUser } from "./lib/users";

const SESSION_COOKIE = "__Host-session";
const STATE_COOKIE = "__Host-oauth_state";
const NONCE_COOKIE = "__Host-oauth_nonce";
const VERIFIER_COOKIE = "__Host-oauth_verifier";
const TEMP_COOKIE_MAX_AGE = 600;

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

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
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

const tempCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
  path: "/",
  maxAge: TEMP_COOKIE_MAX_AGE,
} as const;

const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
  path: "/",
} as const;

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await next();
  applySecurityHeaders(c.res.headers);
});

app.use("/auth/logout", async (c, next) => {
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    const requestOrigin = new URL(c.req.url).origin;
    const sameOriginBySecFetch =
      c.req.header("Sec-Fetch-Site") === "same-origin";
    const sameOriginByOrigin = c.req.header("Origin") === requestOrigin;
    if (!sameOriginBySecFetch && !sameOriginByOrigin) {
      return c.body(null, 403);
    }
  }
  await next();
});

app.get("/auth/login", async (c) => {
  const { verifier, challenge } = await createPkce();
  const state = randomToken();
  const nonce = randomToken();
  setCookie(c, STATE_COOKIE, state, tempCookieOptions);
  setCookie(c, NONCE_COOKIE, nonce, tempCookieOptions);
  setCookie(c, VERIFIER_COOKIE, verifier, tempCookieOptions);
  return c.redirect(
    buildAuthorizationUrl({
      clientId: c.env.GOOGLE_CLIENT_ID,
      redirectUri: c.env.GOOGLE_REDIRECT_URI,
      state,
      nonce,
      codeChallenge: challenge,
    }),
    302,
  );
});

app.get("/auth/callback", async (c) => {
  const state = getCookie(c, STATE_COOKIE);
  const nonce = getCookie(c, NONCE_COOKIE);
  const verifier = getCookie(c, VERIFIER_COOKIE);
  const clearTempCookies = () => {
    deleteCookie(c, STATE_COOKIE, { path: "/", secure: true });
    deleteCookie(c, NONCE_COOKIE, { path: "/", secure: true });
    deleteCookie(c, VERIFIER_COOKIE, { path: "/", secure: true });
  };

  try {
    const code = c.req.query("code");
    if (!state || !nonce || !verifier || !code) {
      throw new Error("missing authorization context");
    }
    if (c.req.query("state") !== state) {
      throw new Error("state mismatch");
    }
    const idToken = await exchangeCodeForIdToken({
      code,
      codeVerifier: verifier,
      clientId: c.env.GOOGLE_CLIENT_ID,
      clientSecret: c.env.GOOGLE_CLIENT_SECRET,
      redirectUri: c.env.GOOGLE_REDIRECT_URI,
    });
    const claims = await verifyIdToken(idToken, {
      clientId: c.env.GOOGLE_CLIENT_ID,
      expectedNonce: nonce,
      nowSeconds: nowSeconds(),
    });
    await upsertUser(c.env.DB, { sub: claims.sub, userName: claims.name });
    const session = await signSession(
      { sub: claims.sub },
      c.env.SESSION_SECRET,
      nowSeconds(),
    );
    setCookie(c, SESSION_COOKIE, session, sessionCookieOptions);
    clearTempCookies();
    return c.redirect("/", 302);
  } catch {
    clearTempCookies();
    return c.redirect("/login-error", 302);
  }
});

app.get("/api/me", async (c) => {
  c.header("Cache-Control", "no-store");
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) {
    return c.body(null, 401);
  }
  try {
    const { sub } = await verifySession(
      token,
      c.env.SESSION_SECRET,
      nowSeconds(),
    );
    const userName = await findUserName(c.env.DB, sub);
    if (!userName) {
      return c.body(null, 401);
    }
    return c.json({ userName });
  } catch {
    return c.body(null, 401);
  }
});

app.post("/auth/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: true });
  return c.body(null, 204);
});

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
