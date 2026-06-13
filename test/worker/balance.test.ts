/**
 * 収支データの D1 リポジトリと API の仕様
 *
 * 収支は D1 にユーザー単位（Google の subject）で 1日1件保存する。
 * リポジトリは D1Database を引数で受け取り（テストではモックを注入）、
 * 登録・更新（upsert）・取得・削除を行う。データはユーザーごとに分離し、
 * 他ユーザーのレコードを取得・削除しない。
 *
 * API はセッションで認証し、保存・削除はセッションのユーザーにのみ作用する。
 * 変更系（PUT / DELETE）は同一オリジンを肯定的に確認できない要求を 403 で拒否する。
 * 投資・回収は 0 から 999999 の整数で再検証し、違反は 400。応答に内部識別子（sub）・
 * トークンを含めず、Cache-Control: no-store とし、CORS は無効。
 */
import { describe, expect, test } from "bun:test";
import app from "../../worker/index";
import {
  deleteBalance,
  listBalances,
  upsertBalance,
} from "../../worker/lib/balance";
import { signSession } from "../../worker/lib/session";
import { createTestDb } from "../helpers/d1";
import { applyNativeRequest } from "../helpers/native-request";

applyNativeRequest();

const ORIGIN = "http://localhost";
const SESSION_COOKIE = "__Host-session";

function testEnv(db = createTestDb()) {
  return {
    db,
    env: {
      ASSETS: { fetch: async () => new Response("<html>app</html>") },
      DB: db,
      SESSION_SECRET: "session-secret",
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "client-secret",
      GOOGLE_REDIRECT_URI: `${ORIGIN}/auth/callback`,
    },
  };
}

async function sessionCookie(sub: string) {
  const token = await signSession(
    { sub },
    "session-secret",
    Math.floor(Date.now() / 1000),
  );
  return `${SESSION_COOKIE}=${token}`;
}

describe("balance リポジトリ（D1）", () => {
  describe("upsertBalance", () => {
    test("新規の日付に投資と回収を登録する", async () => {
      const db = createTestDb();
      await upsertBalance(db, "sub-1", "2026-06-03", 1000, 3000);
      expect(await listBalances(db, "sub-1")).toEqual([
        { date: "2026-06-03", bet: 1000, recovery: 3000 },
      ]);
    });

    test("同一ユーザーの同一日付に再保存すると上書きされる（1日1件）", async () => {
      const db = createTestDb();
      await upsertBalance(db, "sub-1", "2026-06-03", 1000, 3000);
      await upsertBalance(db, "sub-1", "2026-06-03", 500, 800);
      expect(await listBalances(db, "sub-1")).toEqual([
        { date: "2026-06-03", bet: 500, recovery: 800 },
      ]);
    });

    test("同一日付でもユーザーが異なれば別レコードとして保存される", async () => {
      const db = createTestDb();
      await upsertBalance(db, "sub-1", "2026-06-03", 1, 2);
      await upsertBalance(db, "sub-2", "2026-06-03", 3, 4);
      expect(await listBalances(db, "sub-1")).toEqual([
        { date: "2026-06-03", bet: 1, recovery: 2 },
      ]);
      expect(await listBalances(db, "sub-2")).toEqual([
        { date: "2026-06-03", bet: 3, recovery: 4 },
      ]);
    });
  });

  describe("listBalances", () => {
    test("そのユーザーの全レコードを返す", async () => {
      const db = createTestDb();
      await upsertBalance(db, "sub-1", "2026-06-01", 1, 2);
      await upsertBalance(db, "sub-1", "2026-06-05", 3, 4);
      expect(await listBalances(db, "sub-1")).toHaveLength(2);
    });

    test("他ユーザーのレコードは含めない", async () => {
      const db = createTestDb();
      await upsertBalance(db, "sub-1", "2026-06-01", 1, 2);
      await upsertBalance(db, "sub-2", "2026-06-01", 3, 4);
      expect(await listBalances(db, "sub-1")).toEqual([
        { date: "2026-06-01", bet: 1, recovery: 2 },
      ]);
    });

    test("記録が無いユーザーには空を返す", async () => {
      const db = createTestDb();
      expect(await listBalances(db, "ghost")).toEqual([]);
    });
  });

  describe("deleteBalance", () => {
    test("指定したユーザーと日付のレコードを削除する", async () => {
      const db = createTestDb();
      await upsertBalance(db, "sub-1", "2026-06-03", 1, 2);
      await deleteBalance(db, "sub-1", "2026-06-03");
      expect(await listBalances(db, "sub-1")).toEqual([]);
    });

    test("他ユーザーの同一日付のレコードは削除しない", async () => {
      const db = createTestDb();
      await upsertBalance(db, "sub-1", "2026-06-03", 1, 2);
      await upsertBalance(db, "sub-2", "2026-06-03", 3, 4);
      await deleteBalance(db, "sub-1", "2026-06-03");
      expect(await listBalances(db, "sub-2")).toEqual([
        { date: "2026-06-03", bet: 3, recovery: 4 },
      ]);
    });
  });
});

describe("GET /api/balance", () => {
  test("有効なセッションでそのユーザーのレコードを返す", async () => {
    const { db, env } = testEnv();
    await upsertBalance(db, "sub-1", "2026-06-03", 1000, 3000);
    const res = await app.request(
      `${ORIGIN}/api/balance`,
      { headers: { Cookie: await sessionCookie("sub-1") } },
      env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      records: [{ date: "2026-06-03", bet: 1000, recovery: 3000 }],
    });
  });

  test("応答に内部識別子 sub やトークンを含めない", async () => {
    const { db, env } = testEnv();
    await upsertBalance(db, "sub-1", "2026-06-03", 1, 2);
    const res = await app.request(
      `${ORIGIN}/api/balance`,
      { headers: { Cookie: await sessionCookie("sub-1") } },
      env,
    );
    const body = await res.text();
    expect(body).not.toContain("sub-1");
    expect(body).not.toContain(SESSION_COOKIE);
  });

  test("応答に Cache-Control: no-store を含む", async () => {
    const { env } = testEnv();
    const res = await app.request(
      `${ORIGIN}/api/balance`,
      { headers: { Cookie: await sessionCookie("sub-1") } },
      env,
    );
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  test("応答に Access-Control-Allow-Origin を含めない", async () => {
    const { env } = testEnv();
    const res = await app.request(
      `${ORIGIN}/api/balance`,
      { headers: { Cookie: await sessionCookie("sub-1") } },
      env,
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  test("セッションが無い・無効のとき 401 を返す", async () => {
    const { env } = testEnv();
    const noCookie = await app.request(`${ORIGIN}/api/balance`, {}, env);
    expect(noCookie.status).toBe(401);
    const invalid = await app.request(
      `${ORIGIN}/api/balance`,
      { headers: { Cookie: `${SESSION_COOKIE}=not-a-token` } },
      env,
    );
    expect(invalid.status).toBe(401);
  });
});

describe("PUT /api/balance", () => {
  function put(
    env: ReturnType<typeof testEnv>["env"],
    body: unknown,
    headers: Record<string, string> = {},
  ) {
    return app.request(
      `${ORIGIN}/api/balance`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Origin: ORIGIN,
          ...headers,
        },
        body: JSON.stringify(body),
      },
      env,
    );
  }

  test("有効なセッションと同一オリジンで指定日の投資と回収を保存する", async () => {
    const { db, env } = testEnv();
    const res = await put(
      env,
      { date: "2026-06-03", bet: 1000, recovery: 3000 },
      { Cookie: await sessionCookie("sub-1") },
    );
    expect(res.status).toBe(204);
    expect(await listBalances(db, "sub-1")).toEqual([
      { date: "2026-06-03", bet: 1000, recovery: 3000 },
    ]);
  });

  test("投資または回収が 0 から 999999 の整数でないとき 400 を返し保存しない", async () => {
    const { db, env } = testEnv();
    const cookie = await sessionCookie("sub-1");
    for (const body of [
      { date: "2026-06-03", bet: -1, recovery: 0 },
      { date: "2026-06-03", bet: 0, recovery: 1000000 },
      { date: "2026-06-03", bet: 1.5, recovery: 0 },
      { date: "2026-06-03", bet: "x", recovery: 0 },
    ]) {
      const res = await put(env, body, { Cookie: cookie });
      expect(res.status).toBe(400);
    }
    expect(await listBalances(db, "sub-1")).toEqual([]);
  });

  test("日付が YYYY-MM-DD 形式でないとき 400 を返す", async () => {
    const { env } = testEnv();
    const res = await put(
      env,
      { date: "2026/6/3", bet: 0, recovery: 0 },
      { Cookie: await sessionCookie("sub-1") },
    );
    expect(res.status).toBe(400);
  });

  test("本文で別ユーザーを指定してもセッションのユーザーのレコードとして保存する", async () => {
    const { db, env } = testEnv();
    await put(
      env,
      { date: "2026-06-03", bet: 1, recovery: 2, sub: "victim" },
      { Cookie: await sessionCookie("sub-1") },
    );
    expect(await listBalances(db, "sub-1")).toHaveLength(1);
    expect(await listBalances(db, "victim")).toEqual([]);
  });

  test("セッションが無いとき 401 を返す", async () => {
    const { env } = testEnv();
    const res = await put(env, { date: "2026-06-03", bet: 0, recovery: 0 });
    expect(res.status).toBe(401);
  });

  test("Origin も Sec-Fetch-Site も無い要求は 403 を返す（フェイルクローズ）", async () => {
    const { env } = testEnv();
    const res = await app.request(
      `${ORIGIN}/api/balance`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: await sessionCookie("sub-1"),
        },
        body: JSON.stringify({ date: "2026-06-03", bet: 0, recovery: 0 }),
      },
      env,
    );
    expect(res.status).toBe(403);
  });

  test("別オリジンからの要求は 403 を返す", async () => {
    const { env } = testEnv();
    const res = await put(
      env,
      { date: "2026-06-03", bet: 0, recovery: 0 },
      {
        Origin: "https://evil.example.com",
        Cookie: await sessionCookie("sub-1"),
      },
    );
    expect(res.status).toBe(403);
  });

  test("本文が不正な JSON のとき 400 を返す", async () => {
    const { env } = testEnv();
    const res = await app.request(
      `${ORIGIN}/api/balance`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Origin: ORIGIN,
          Cookie: await sessionCookie("sub-1"),
        },
        body: "not-json",
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/balance", () => {
  function del(
    env: ReturnType<typeof testEnv>["env"],
    body: unknown,
    headers: Record<string, string> = {},
  ) {
    return app.request(
      `${ORIGIN}/api/balance`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Origin: ORIGIN,
          ...headers,
        },
        body: JSON.stringify(body),
      },
      env,
    );
  }

  test("有効なセッションと同一オリジンで指定日のレコードを削除する", async () => {
    const { db, env } = testEnv();
    await upsertBalance(db, "sub-1", "2026-06-03", 1, 2);
    const res = await del(
      env,
      { date: "2026-06-03" },
      { Cookie: await sessionCookie("sub-1") },
    );
    expect(res.status).toBe(204);
    expect(await listBalances(db, "sub-1")).toEqual([]);
  });

  test("削除対象はセッションのユーザー自身のレコードに限る", async () => {
    const { db, env } = testEnv();
    await upsertBalance(db, "sub-1", "2026-06-03", 1, 2);
    await upsertBalance(db, "sub-2", "2026-06-03", 3, 4);
    await del(
      env,
      { date: "2026-06-03" },
      { Cookie: await sessionCookie("sub-1") },
    );
    expect(await listBalances(db, "sub-2")).toEqual([
      { date: "2026-06-03", bet: 3, recovery: 4 },
    ]);
  });

  test("セッションが無いとき 401 を返す", async () => {
    const { env } = testEnv();
    const res = await del(env, { date: "2026-06-03" });
    expect(res.status).toBe(401);
  });

  test("別オリジンからの要求は 403 を返す", async () => {
    const { env } = testEnv();
    const res = await del(
      env,
      { date: "2026-06-03" },
      {
        Origin: "https://evil.example.com",
        Cookie: await sessionCookie("sub-1"),
      },
    );
    expect(res.status).toBe(403);
  });

  test("本文が不正な JSON のとき 400 を返す", async () => {
    const { env } = testEnv();
    const res = await app.request(
      `${ORIGIN}/api/balance`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Origin: ORIGIN,
          Cookie: await sessionCookie("sub-1"),
        },
        body: "not-json",
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});
