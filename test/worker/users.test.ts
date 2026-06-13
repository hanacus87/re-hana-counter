/**
 * ユーザーリポジトリ（D1）の仕様
 *
 * 保持するのは識別子（Google の subject）と表示名（userName）のみ。
 * 専用のサインアップフローは設けず、ログイン成功時の登録・更新（upsert）が
 * 新規登録を兼ねる。関数は D1Database を引数で受け取る
 * （テストではモックの D1 を注入する）。
 */
import { describe, expect, test } from "bun:test";
import { createTestDb } from "../helpers/d1";
import { findUserName, upsertUser } from "../../worker/lib/users";

describe("upsertUser", () => {
  test("初回ログインのユーザーは識別子と表示名で登録される", async () => {
    const db = createTestDb();
    await upsertUser(db, { sub: "sub-1", userName: "花子" });
    expect(await findUserName(db, "sub-1")).toBe("花子");
  });

  test("登録済みユーザーの再ログインでは表示名のみ更新される", async () => {
    const db = createTestDb();
    await upsertUser(db, { sub: "sub-1", userName: "花子" });
    await upsertUser(db, { sub: "sub-1", userName: "花子（改名）" });
    expect(await findUserName(db, "sub-1")).toBe("花子（改名）");
  });

  test("記号（シングルクオート・セミコロン・ハイフン2つ）を含む表示名がそのまま保存・取得できる", async () => {
    const db = createTestDb();
    const tricky = "Robert'); DROP TABLE users; --";
    await upsertUser(db, { sub: "sub-1", userName: tricky });
    expect(await findUserName(db, "sub-1")).toBe(tricky);
    await upsertUser(db, { sub: "sub-2", userName: "ok" });
    expect(await findUserName(db, "sub-2")).toBe("ok");
  });

  test("制御文字・改行・タブを含む表示名は除去して保存される", async () => {
    const db = createTestDb();
    await upsertUser(db, {
      sub: "sub-1",
      userName: "山田\u0000太郎\n\t\u007f",
    });
    expect(await findUserName(db, "sub-1")).toBe("山田太郎");
  });
});

describe("findUserName", () => {
  test("登録済みの識別子から表示名を取得できる", async () => {
    const db = createTestDb();
    await upsertUser(db, { sub: "sub-9", userName: "太郎" });
    expect(await findUserName(db, "sub-9")).toBe("太郎");
  });

  test("未登録の識別子の検索は該当なしを返す", async () => {
    const db = createTestDb();
    expect(await findUserName(db, "missing")).toBeNull();
  });
});
