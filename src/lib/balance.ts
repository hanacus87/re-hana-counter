export type BalanceMap = Record<string, { bet: number; recovery: number }>;

export const MAX_AMOUNT = 999999;

export function net(bet: number, recovery: number): number {
  return recovery - bet;
}

export function formatYen(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  const digits = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}￥${digits}`;
}

export function signClass(amount: number): "positive" | "negative" | "zero" {
  if (amount > 0) {
    return "positive";
  }
  if (amount < 0) {
    return "negative";
  }
  return "zero";
}

function sumByPrefix(records: BalanceMap, prefix: string): number {
  let total = 0;
  for (const [date, record] of Object.entries(records)) {
    if (date.startsWith(prefix)) {
      total += net(record.bet, record.recovery);
    }
  }
  return total;
}

export function sumMonth(
  records: BalanceMap,
  year: number,
  month: number,
): number {
  return sumByPrefix(records, `${year}-${String(month).padStart(2, "0")}-`);
}

export function sumYear(records: BalanceMap, year: number): number {
  return sumByPrefix(records, `${year}-`);
}

export function monthlyBreakdown(records: BalanceMap, year: number): number[] {
  return Array.from({ length: 12 }, (_, index) =>
    sumMonth(records, year, index + 1),
  );
}
