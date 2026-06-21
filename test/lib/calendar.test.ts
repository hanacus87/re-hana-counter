/**
 * カレンダー生成・期間ナビゲーションの仕様
 *
 * 月グリッドは日曜始まりで、月初の前は前月末日、月末の後ろは次月初日の
 * 実日付で埋める。各セルは年月日と当月かどうか（inCurrentMonth）を持つ。
 * 各週は7セル。月の日数はうるう年・平年で変わる。
 * 期間ナビゲーションは月送り・年送りで、月送りは年をまたぐ。
 * 日付キーは YYYY-MM-DD 形式（月と日は2桁ゼロ埋め）。
 */
import { describe, expect, test } from "bun:test";
import {
  dateKey,
  monthGrid,
  nextMonth,
  nextYear,
  prevMonth,
  prevYear,
} from "../../src/lib/calendar";

describe("monthGrid（日曜始まりの月グリッドを作る）", () => {
  test("2026年6月は1日が月曜のため第1週日曜のセルは前月の2026年5月31日になる", () => {
    const grid = monthGrid(2026, 6);
    expect(grid[0][0]).toEqual({
      year: 2026,
      month: 5,
      day: 31,
      inCurrentMonth: false,
    });
    expect(grid[0][1]).toEqual({
      year: 2026,
      month: 6,
      day: 1,
      inCurrentMonth: true,
    });
  });

  test("各週は7セルで構成される", () => {
    for (const week of monthGrid(2026, 6)) {
      expect(week).toHaveLength(7);
    }
  });

  test("最終週末尾のセルは次月の2026年7月4日になる", () => {
    const grid = monthGrid(2026, 6);
    const lastWeek = grid[grid.length - 1];
    expect(lastWeek[lastWeek.length - 1]).toEqual({
      year: 2026,
      month: 7,
      day: 4,
      inCurrentMonth: false,
    });
  });

  test("当月セルは inCurrentMonth が true、前後月セルは false になる", () => {
    const grid = monthGrid(2026, 6);
    expect(grid[0][0].inCurrentMonth).toBe(false);
    expect(grid[0][1].inCurrentMonth).toBe(true);
  });

  test("2026年6月の当月セルは1日から30日で31日を含まない", () => {
    const days = monthGrid(2026, 6)
      .flat()
      .filter((cell) => cell.inCurrentMonth)
      .map((cell) => cell.day);
    expect(days).toContain(30);
    expect(days).not.toContain(31);
  });

  test("2024年2月の当月セルは29日まで含む（うるう年）", () => {
    const days = monthGrid(2024, 2)
      .flat()
      .filter((cell) => cell.inCurrentMonth)
      .map((cell) => cell.day);
    expect(days).toContain(29);
    expect(days).not.toContain(30);
  });

  test("2026年2月の当月セルは28日まで含む（平年）", () => {
    const days = monthGrid(2026, 2)
      .flat()
      .filter((cell) => cell.inCurrentMonth)
      .map((cell) => cell.day);
    expect(days).toContain(28);
    expect(days).not.toContain(29);
  });
});

describe("月と年のナビゲーション", () => {
  test("2026年12月の翌月は2027年1月になる", () => {
    expect(nextMonth(2026, 12)).toEqual({ year: 2027, month: 1 });
  });

  test("2026年1月の前月は2025年12月になる", () => {
    expect(prevMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
  });

  test("2026年の翌年は2027年・前年は2025年になる", () => {
    expect(nextYear(2026)).toBe(2027);
    expect(prevYear(2026)).toBe(2025);
  });
});

describe("dateKey（年月日から YYYY-MM-DD 形式の文字列を作る）", () => {
  test('2026年6月3日は "2026-06-03" になる（月と日は2桁ゼロ埋め）', () => {
    expect(dateKey(2026, 6, 3)).toBe("2026-06-03");
  });
});
