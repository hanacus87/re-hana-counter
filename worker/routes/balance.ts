import { Hono } from "hono";
import { deleteBalance, listBalances, upsertBalance } from "../lib/balance";
import { requireSameOrigin } from "../lib/csrf";
import { sessionSub } from "../lib/request-auth";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT = 999999;

function isValidAmount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_AMOUNT
  );
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export const balanceRoutes = new Hono<{ Bindings: Env }>();

balanceRoutes.use("/balance", requireSameOrigin);

balanceRoutes.get("/balance", async (c) => {
  const sub = await sessionSub(c);
  if (!sub) {
    return c.body(null, 401);
  }
  const records = await listBalances(c.env.DB, sub);
  return c.json({ records });
});

balanceRoutes.put("/balance", async (c) => {
  const sub = await sessionSub(c);
  if (!sub) {
    return c.body(null, 401);
  }
  let body: Record<string, unknown>;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.body(null, 400);
  }
  if (
    !isValidDate(body.date) ||
    !isValidAmount(body.bet) ||
    !isValidAmount(body.recovery)
  ) {
    return c.body(null, 400);
  }
  await upsertBalance(c.env.DB, sub, body.date, body.bet, body.recovery);
  return c.body(null, 204);
});

balanceRoutes.delete("/balance", async (c) => {
  const sub = await sessionSub(c);
  if (!sub) {
    return c.body(null, 401);
  }
  let body: Record<string, unknown>;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.body(null, 400);
  }
  if (!isValidDate(body.date)) {
    return c.body(null, 400);
  }
  await deleteBalance(c.env.DB, sub, body.date);
  return c.body(null, 204);
});
