import {
  formatYen,
  net,
  signClass,
  sumMonth,
  type BalanceMap,
} from "../lib/balance";
import { dateKey, monthGrid } from "../lib/calendar";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function MonthView({
  year,
  month,
  records,
  onPrev,
  onNext,
  onSelectDay,
}: {
  year: number;
  month: number;
  records: BalanceMap;
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (date: string) => void;
}) {
  const total = sumMonth(records, year, month);
  return (
    <div className="month-view">
      <div className="period-bar">
        <button
          type="button"
          className="period-nav"
          aria-label="前の月"
          onClick={onPrev}
        >
          ‹
        </button>
        <span className="period-label">{`${year}-${String(month).padStart(2, "0")}`}</span>
        <button
          type="button"
          className="period-nav"
          aria-label="次の月"
          onClick={onNext}
        >
          ›
        </button>
      </div>
      <div className={`period-total ${signClass(total)}`}>
        {formatYen(total)}
      </div>
      <div className="weekday-row">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="weekday">
            {weekday}
          </span>
        ))}
      </div>
      <div className="month-grid">
        {monthGrid(year, month)
          .flat()
          .map((day, index) => {
            if (day === null) {
              return <span key={`empty-${index}`} className="day-cell empty" />;
            }
            const date = dateKey(year, month, day);
            const record = records[date];
            const amount = record ? net(record.bet, record.recovery) : null;
            return (
              <button
                type="button"
                key={date}
                className="day-cell"
                aria-label={date}
                onClick={() => onSelectDay(date)}
              >
                <span className="day-number">{day}</span>
                {amount !== null && (
                  <span className={`day-amount ${signClass(amount)}`}>
                    {formatYen(amount)}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
