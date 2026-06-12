/**
 * Worker (Hono) のルーティングと 404 の仕様
 *
 * 静的アセットは Worker より先に配信されるため、Worker に届くのは
 * アセットに一致しない未知のパスのみ。Worker は ASSETS バインディングから
 * アプリ本体（/ の index.html）を取得し、ステータスを 404 に差し替えて返す。
 * 404 画面の描画はフロントエンド（React のルーティング）が担う。
 * テストでは Worker 単体にモックの ASSETS バインディングを注入して呼び出す。
 */
import { describe, expect, test } from "bun:test";
import app from "../worker/index";

function mockEnv(response: Response) {
  const calls: Request[] = [];
  return {
    calls,
    env: {
      ASSETS: {
        fetch: (req: Request) => {
          calls.push(req);
          return Promise.resolve(response);
        },
      },
    },
  };
}

function indexHtmlResponse() {
  return new Response("<html>app</html>", {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

describe("404 応答", () => {
  test("未知のパスでは ASSETS へアプリ本体（/）を要求する", async () => {
    const { calls, env } = mockEnv(indexHtmlResponse());
    await app.request("/foo", {}, env);
    expect(calls).toHaveLength(1);
    expect(new URL(calls[0].url).pathname).toBe("/");
  });

  test("アプリ本体の HTML を 404 ステータスで返す（本文・Content-Type は維持）", async () => {
    const { env } = mockEnv(indexHtmlResponse());
    const res = await app.request("/foo/bar?x=1", {}, env);
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(await res.text()).toBe("<html>app</html>");
  });
});
