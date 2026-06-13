import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { SESSION_COOKIE, verifySession } from "../lib/session";
import { findUserName } from "../lib/users";

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const meRoutes = new Hono<{ Bindings: Env }>();

meRoutes.get("/me", async (c) => {
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
