import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.notFound(async (c) => {
  const index = await c.env.ASSETS.fetch(new Request(new URL("/", c.req.url)));
  return new Response(index.body, { status: 404, headers: index.headers });
});

export default app;
