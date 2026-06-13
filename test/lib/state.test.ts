/**
 * カウンター構成の仕様
 *
 * 構成はデータ駆動（sections 配列）で定義し、UI はこれを描画するだけ。
 * 全カウンターは同一の動作をする（アイコンは見た目の違いのみ）。
 */
import { describe, expect, test } from "bun:test";
import { counterIds, sections, type CounterIcon } from "../../src/lib/state";

describe("カウンター構成", () => {
  test("セクションは plain・grouped・grouped の順に3つ並ぶ", () => {
    expect(sections.map((s) => s.variant)).toEqual([
      "plain",
      "grouped",
      "grouped",
    ]);
  });

  test("セクション1は ▲（triangle）1個のみ", () => {
    expect(sections[0].counters.map((c) => c.icon)).toEqual(["triangle"]);
  });

  test("セクション2とセクション3は同じアイコン構成（◎ target が先頭、続いて 赤・緑・黄・青）", () => {
    const expected: CounterIcon[] = [
      "target",
      "red",
      "green",
      "yellow",
      "blue",
    ];
    expect(sections[1].counters.map((c) => c.icon)).toEqual(expected);
    expect(sections[2].counters.map((c) => c.icon)).toEqual(expected);
  });

  test("カウンターは合計11個で、id はすべて一意", () => {
    const ids = counterIds();
    expect(ids).toHaveLength(11);
    expect(new Set(ids).size).toBe(11);
  });
});
