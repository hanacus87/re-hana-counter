/**
 * 収支管理画面の仕様
 *
 * パスは /balance。アプリ内でログインが必要なのはこの画面のみ。
 * 画面の中身は現段階では空（見出しのみ）で、将来拡張する。
 * ログインボタンの配置（中央）は CSS で実現し、テストでは検証しない。
 */
import { afterEach, describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import App from "../../src/App";

const realFetch = globalThis.fetch;

function stubAuth(user: { userName: string } | null) {
  globalThis.fetch = (async () =>
    user
      ? new Response(JSON.stringify(user), { status: 200 })
      : new Response(null, { status: 401 })) as unknown as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("収支管理画面", () => {
  test("未ログインでアクセスすると「Google でログイン」ボタンが表示される", async () => {
    stubAuth(null);
    history.replaceState({}, "", "/balance");
    render(<App />);
    expect(await screen.findByText("Google でログイン")).toBeTruthy();
  });

  test("ログイン済みでアクセスすると収支管理画面（見出し）が表示される", async () => {
    stubAuth({ userName: "花子" });
    history.replaceState({}, "", "/balance");
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "収支管理" }),
    ).toBeTruthy();
  });

  test("カウンタ画面はログインなしで利用できる", async () => {
    stubAuth(null);
    history.replaceState({}, "", "/");
    render(<App />);
    expect(await screen.findByLabelText("カウント (s1-triangle)")).toBeTruthy();
  });
});
