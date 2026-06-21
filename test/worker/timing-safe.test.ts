/**
 * 定数時間文字列比較の仕様
 *
 * 認証フローの state / nonce など秘匿トークンの一致判定に使う。
 * 一致・不一致の結果は通常の等価比較と同じだが、一致部分の長さに
 * 依存して実行時間が変化しない（タイミング攻撃対策）。
 * 文字列以外・undefined・長さ不一致はすべて不一致（false）として扱う。
 */
import { describe, expect, test } from "bun:test";
import { timingSafeEqual } from "../../worker/lib/timing-safe";

describe("timingSafeEqual", () => {
  test("同じ内容の文字列同士（例: 'abc' と 'abc'）は true を返す", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
  });

  test("空文字列同士（'' と ''）は true を返す", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });

  test("マルチバイト文字を含む同一内容（例: 'あいう' と 'あいう'）は true を返す", () => {
    expect(timingSafeEqual("あいう", "あいう")).toBe(true);
  });

  test("1文字だけ異なる同じ長さの文字列（例: 'abc' と 'abd'）は false を返す", () => {
    expect(timingSafeEqual("abc", "abd")).toBe(false);
  });

  test("長さが異なる文字列（例: 'abc' と 'abcd'）は false を返す", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });

  test("第1引数が undefined のときは false を返す", () => {
    expect(timingSafeEqual(undefined, "abc")).toBe(false);
  });

  test("第2引数が undefined のときは false を返す", () => {
    expect(timingSafeEqual("abc", undefined)).toBe(false);
  });

  test("文字列以外（例: 数値 42）が渡されたときは false を返す", () => {
    expect(timingSafeEqual(42, 42)).toBe(false);
  });
});
