/**
 * Worker (Hono) のルーティングと 404 / 500 の仕様
 *
 * 静的アセットは Worker より先に配信されるため、Worker に届くのは
 * アセットに一致しないパスのみ。SPA の既知ルート（収支管理）には
 * アプリ本体を 200 で返し、未知のパスにはステータスを 404 に差し替えて返す。
 * 未処理例外には 500 を返す（API パスには内部情報を含まない最小 JSON）。
 * 404 / 500 画面の描画はフロントエンド（React）が担う。
 * テストでは Worker 単体にモックの ASSETS バインディングを注入して呼び出す。
 */
import { describe, expect, test } from "bun:test";
import app from "../../worker/index";

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

function cacheableIndexResponse() {
  return new Response("<html>app</html>", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ETag: '"abc123"',
      "Last-Modified": "Mon, 01 Jan 2026 00:00:00 GMT",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function throwingEnv() {
  return {
    ASSETS: {
      fetch: () => Promise.reject(new Error("secret internal stack trace")),
    },
  };
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

describe("SPA ルートの配信", () => {
  test("収支管理のパスにはアプリ本体を 200 で返す", async () => {
    const { calls, env } = mockEnv(indexHtmlResponse());
    const res = await app.request("/balance", {}, env);
    expect(res.status).toBe(200);
    expect(new URL(calls[0].url).pathname).toBe("/");
    expect(await res.text()).toBe("<html>app</html>");
  });

  test("未知のパスは引き続き 404 を返す（既存仕様の維持）", async () => {
    const { env } = mockEnv(indexHtmlResponse());
    const res = await app.request("/unknown-path", {}, env);
    expect(res.status).toBe(404);
  });

  test("ログインエラーのパスにはアプリ本体を 403 で返す", async () => {
    const { calls, env } = mockEnv(indexHtmlResponse());
    const res = await app.request("/login-error", {}, env);
    expect(res.status).toBe(403);
    expect(new URL(calls[0].url).pathname).toBe("/");
    expect(await res.text()).toBe("<html>app</html>");
  });
});

describe("サーバーエラー応答", () => {
  test("ハンドラで未処理例外が発生した場合は 500 を返す", async () => {
    const res = await app.request("/boom", {}, throwingEnv());
    expect(res.status).toBe(500);
  });

  test("API パスへの 500 応答に内部情報（例外メッセージ・スタックトレース）を含めない", async () => {
    const res = await app.request("/api/boom", {}, throwingEnv());
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).not.toContain("secret internal stack trace");
    expect(body.toLowerCase()).not.toContain("stack");
  });
});

describe("エラーページのキャッシュ抑止", () => {
  test("404 応答はアプリ本体の ETag を引き継がない", async () => {
    const { env } = mockEnv(cacheableIndexResponse());
    const res = await app.request("/unknown-path", {}, env);
    expect(res.headers.get("ETag")).toBeNull();
    expect(res.headers.get("Last-Modified")).toBeNull();
  });

  test("404 応答は Cache-Control: no-store になる", async () => {
    const { env } = mockEnv(cacheableIndexResponse());
    const res = await app.request("/unknown-path", {}, env);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  test("ログインエラー（403）応答も ETag を持たず no-store になる", async () => {
    const { env } = mockEnv(cacheableIndexResponse());
    const res = await app.request("/login-error", {}, env);
    expect(res.headers.get("ETag")).toBeNull();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("セキュリティヘッダー", () => {
  test("HTML 応答にフレーム埋め込みを禁止する CSP（frame-ancestors none）が含まれる", async () => {
    const { env } = mockEnv(indexHtmlResponse());
    const res = await app.request("/balance", {}, env);
    expect(res.headers.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
  });

  test("HTML 応答に X-Content-Type-Options: nosniff が含まれる", async () => {
    const { env } = mockEnv(indexHtmlResponse());
    const res = await app.request("/balance", {}, env);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  test("HTML 応答に Referrer-Policy が含まれる", async () => {
    const { env } = mockEnv(indexHtmlResponse());
    const res = await app.request("/balance", {}, env);
    expect(res.headers.get("Referrer-Policy")).toBeTruthy();
  });

  test("静的アセット以外の Worker 応答にも共通セキュリティヘッダーが付与される", async () => {
    const { env } = mockEnv(indexHtmlResponse());
    const res = await app.request("/unknown-path", {}, env);
    expect(res.headers.get("Content-Security-Policy")).toBeTruthy();
    expect(res.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(res.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
    expect(res.headers.get("Permissions-Policy")).toBeTruthy();
  });
});
