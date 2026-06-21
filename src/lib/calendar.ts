export type DayCell = {
  year: number;
  month: number;
  day: number;
  inCurrentMonth: boolean;
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function monthGrid(year: number, month: number): DayCell[][] {
  const leading = new Date(year, month - 1, 1).getDay();
  const total = daysInMonth(year, month);
  const cells: DayCell[] = [];

  const prev = prevMonth(year, month);
  const prevLast = daysInMonth(prev.year, prev.month);
  for (let i = leading - 1; i >= 0; i--) {
    cells.push({
      year: prev.year,
      month: prev.month,
      day: prevLast - i,
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= total; day++) {
    cells.push({ year, month, day, inCurrentMonth: true });
  }

  const next = nextMonth(year, month);
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      year: next.year,
      month: next.month,
      day: nextDay,
      inCurrentMonth: false,
    });
    nextDay++;
  }

  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function nextMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  return month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 };
}

export function prevMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
}

export function nextYear(year: number): number {
  return year + 1;
}

export function prevYear(year: number): number {
  return year - 1;
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
