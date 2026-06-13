import {
  formatYen,
  monthlyBreakdown,
  signClass,
  sumYear,
  type BalanceMap,
} from "../lib/balance";

export function YearView({
  year,
  records,
  onPrev,
  onNext,
  onSelectMonth,
}: {
  year: number;
  records: BalanceMap;
  onPrev: () => void;
  onNext: () => void;
  onSelectMonth: (month: number) => void;
}) {
  const total = sumYear(records, year);
  const breakdown = monthlyBreakdown(records, year);
  return (
    <div className="year-view">
      <div className="period-bar">
        <button
          type="button"
          className="period-nav"
          aria-label="前の年"
          onClick={onPrev}
        >
          ‹
        </button>
        <span className="period-label">{year}</span>
        <button
          type="button"
          className="period-nav"
          aria-label="次の年"
          onClick={onNext}
        >
          ›
        </button>
      </div>
      <div className={`period-total ${signClass(total)}`}>
        {formatYen(total)}
      </div>
      <ul className="month-list">
        {breakdown.map((amount, index) => {
          const month = index + 1;
          const label = `${year}-${String(month).padStart(2, "0")}`;
          return (
            <li key={month}>
              <button
                type="button"
                className="month-row"
                aria-label={label}
                onClick={() => onSelectMonth(month)}
              >
                <span className="month-name">
                  {String(month).padStart(2, "0")}
                </span>
                <span className={`month-amount ${signClass(amount)}`}>
                  {formatYen(amount)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
