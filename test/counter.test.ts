/**
 * カウンター増減ロジックの仕様
 *
 * UIから分離した純粋関数としてテストする。
 * 増減幅は常に 1 で固定。
 * カウンター値は 0〜99 の整数のみ（下限 0・上限 99）。
 */
import { describe, expect, test } from "bun:test";
import {
  applyAction,
  decrement,
  increment,
  MAX_VALUE,
} from "../src/lib/counter";

describe("MAX_VALUE", () => {
  test("カウンター値の上限は 99", () => {
    expect(MAX_VALUE).toBe(99);
  });
});

describe("increment", () => {
  test("値に 1 を加えた値を返す（例: 0 は 1 になる）", () => {
    expect(increment(0)).toBe(1);
  });

  test("増減幅は常に 1（例: 5 は 6 に、98 は 99 になる）", () => {
    expect(increment(5)).toBe(6);
    expect(increment(98)).toBe(99);
  });

  test("値が 99 のときは 99 のまま（上限で頭打ち）", () => {
    expect(increment(99)).toBe(99);
  });

  test("同じ入力に対して常に同じ値を返す", () => {
    expect(increment(3)).toBe(increment(3));
  });
});

describe("decrement", () => {
  test("値から 1 を引いた値を返す（例: 5 は 4 になる）", () => {
    expect(decrement(5)).toBe(4);
  });

  test("増減幅は常に 1（例: 1 は 0 に、99 は 98 になる）", () => {
    expect(decrement(1)).toBe(0);
    expect(decrement(99)).toBe(98);
  });

  test("値が 0 のときは 0 のまま（負値にしない）", () => {
    expect(decrement(0)).toBe(0);
  });
});

describe("applyAction", () => {
  test("インクリメントモードのとき 1 増える（increment と同じ結果）", () => {
    expect(applyAction(0, "increment")).toBe(1);
    expect(applyAction(5, "increment")).toBe(6);
  });

  test("デクリメントモードのとき 1 減る（decrement と同じ結果）", () => {
    expect(applyAction(5, "decrement")).toBe(4);
    expect(applyAction(1, "decrement")).toBe(0);
  });

  test("デクリメントモードかつ値が 0 のとき 0 のまま（下限が適用される）", () => {
    expect(applyAction(0, "decrement")).toBe(0);
  });

  test("インクリメントモードかつ値が 99 のとき 99 のまま（上限が適用される）", () => {
    expect(applyAction(99, "increment")).toBe(99);
  });

  test("同じ値でもモードによって 1 増えるか 1 減るかが分かれる", () => {
    expect(applyAction(5, "increment")).toBe(6);
    expect(applyAction(5, "decrement")).toBe(4);
  });
});
