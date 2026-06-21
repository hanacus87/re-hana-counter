import { useState } from "react";
import { useAuth } from "../auth/auth-context";
import { LoginButton } from "../auth/LoginButton";
import { ApiError } from "../lib/api";
import { nextMonth, nextYear, prevMonth, prevYear } from "../lib/calendar";
import { useThrowAsync } from "../lib/useThrowAsync";
import { DayEditor } from "./DayEditor";
import { MonthView } from "./MonthView";
import { useBalanceRecords } from "./useBalanceRecords";
import { YearView } from "./YearView";

export function Balance() {
  const { status, user } = useAuth();
  const throwAsync = useThrowAsync();
  const { records, save, remove, loadErrorCode, unauthorized } =
    useBalanceRecords(user);
  const [view, setView] = useState<"month" | "year">("month");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  if (status === "loading") {
    return <main className="centered loading">Loading...</main>;
  }

  if (status === "unauthenticated" || unauthorized) {
    return (
      <main className="centered">
        <LoginButton />
      </main>
    );
  }

  if (loadErrorCode !== null) {
    throw new ApiError(loadErrorCode);
  }

  const handleSave = async (date: string, bet: number, recovery: number) => {
    try {
      await save(date, bet, recovery);
      setEditingDate(null);
    } catch (error) {
      throwAsync(error);
    }
  };

  const handleDelete = async (date: string) => {
    try {
      await remove(date);
      setEditingDate(null);
    } catch (error) {
      throwAsync(error);
    }
  };

  return (
    <main className="balance">
      <div className="balance-toggle">
        <button
          type="button"
          aria-label="月表示"
          className={view === "month" ? "active" : ""}
          onClick={() => setView("month")}
        >
          Month
        </button>
        <button
          type="button"
          aria-label="年表示"
          className={view === "year" ? "active" : ""}
          onClick={() => setView("year")}
        >
          Year
        </button>
      </div>
      {view === "month" ? (
        <MonthView
          year={year}
          month={month}
          records={records}
          onPrev={() => {
            const previous = prevMonth(year, month);
            setYear(previous.year);
            setMonth(previous.month);
          }}
          onNext={() => {
            const following = nextMonth(year, month);
            setYear(following.year);
            setMonth(following.month);
          }}
          onSelectDay={setEditingDate}
        />
      ) : (
        <YearView
          year={year}
          records={records}
          onPrev={() => setYear(prevYear(year))}
          onNext={() => setYear(nextYear(year))}
          onSelectMonth={(selected) => {
            setMonth(selected);
            setView("month");
          }}
        />
      )}
      {editingDate && (
        <DayEditor
          date={editingDate}
          record={records[editingDate] ?? null}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => setEditingDate(null)}
        />
      )}
    </main>
  );
}
