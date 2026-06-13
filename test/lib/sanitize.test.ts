/**
 * 数値入力欄のバリデーション仕様
 *
 * 数値入力欄はキーボードで直接編集できる。
 * 入力値は 0〜99 の整数のみ許可し、違反（負値・小数・非数・空など）は
 * 0 に強制リセット、上限 99 を超える値は 99 に丸める。
 * sanitizeInput は入力欄の生文字列を受け取り、表示・保存すべきカウンター値を返す。
 * 入力の都度（onChange）適用する。
 */
import { describe, expect, test } from "bun:test";
import { sanitizeInput } from "../../src/lib/sanitize";

describe("sanitizeInput", () => {
  describe("0〜99 の整数文字列はその数値を返す", () => {
    test('"5" は 5 を返す', () => {
      expect(sanitizeInput("5")).toBe(5);
      expect(sanitizeInput("42")).toBe(42);
    });

    test('"0" は 0 を返す（下限値）', () => {
      expect(sanitizeInput("0")).toBe(0);
    });

    test('"99" は 99 を返す（上限値）', () => {
      expect(sanitizeInput("99")).toBe(99);
    });

    test('"007" は 7 を返す（先頭ゼロは10進数として解釈）', () => {
      expect(sanitizeInput("007")).toBe(7);
      expect(sanitizeInput("010")).toBe(10);
    });
  });

  describe("99 を超える整数文字列は 99 を返す（上限に丸める）", () => {
    test('"100" は 99 を返す', () => {
      expect(sanitizeInput("100")).toBe(99);
    });

    test('"99999" は 99 を返す', () => {
      expect(sanitizeInput("99999")).toBe(99);
    });
  });

  describe("違反入力は 0 を返す（強制リセット）", () => {
    test('負値は 0 を返す（例: "-3"）', () => {
      expect(sanitizeInput("-3")).toBe(0);
      expect(sanitizeInput("-1")).toBe(0);
    });

    test('小数は 0 を返す（例: "1.5"）', () => {
      expect(sanitizeInput("1.5")).toBe(0);
      expect(sanitizeInput("0.1")).toBe(0);
    });

    test('非数は 0 を返す（例: "abc"）', () => {
      expect(sanitizeInput("abc")).toBe(0);
    });

    test("空文字は 0 を返す", () => {
      expect(sanitizeInput("")).toBe(0);
    });

    test('空白のみの文字列は 0 を返す（例: "  "）', () => {
      expect(sanitizeInput("  ")).toBe(0);
    });

    test('数字と文字の混在は 0 を返す（例: "12a"）', () => {
      expect(sanitizeInput("12a")).toBe(0);
      expect(sanitizeInput("a12")).toBe(0);
    });

    test('指数表記・特殊数値は 0 を返す（例: "1e3", "Infinity", "NaN"）', () => {
      expect(sanitizeInput("1e3")).toBe(0);
      expect(sanitizeInput("Infinity")).toBe(0);
      expect(sanitizeInput("NaN")).toBe(0);
    });
  });
});
