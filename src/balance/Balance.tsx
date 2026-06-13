import { useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { LoginButton } from "../auth/LoginButton";
import { type BalanceMap } from "../lib/balance";
import { nextMonth, nextYear, prevMonth, prevYear } from "../lib/calendar";
import {
  fetchBalances,
  removeBalance,
  saveBalance,
  UNAUTHORIZED,
} from "./balance-api";
import { DayEditor } from "./DayEditor";
import { MonthView } from "./MonthView";
import { YearView } from "./YearView";

export function Balance() {
  const { user } = useAuth();
  const [view, setView] = useState<"month" | "year">("month");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [records, setRecords] = useState<BalanceMap>({});
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (user) {
      void fetchBalances()
        .then(setRecords)
        .catch((error) => {
          if (error instanceof Error && error.message === UNAUTHORIZED) {
            setUnauthorized(true);
          } else {
            setLoadFailed(true);
          }
        });
    }
  }, [user]);

  if (!user || unauthorized) {
    return (
      <main className="centered">
        <LoginButton />
      </main>
    );
  }

  if (loadFailed) {
    throw new Error("failed to load balances");
  }

  const save = async (date: string, bet: number, recovery: number) => {
    await saveBalance(date, bet, recovery);
    setRecords((prev) => ({ ...prev, [date]: { bet, recovery } }));
    setEditingDate(null);
  };

  const remove = async (date: string) => {
    await removeBalance(date);
    setRecords((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
    setEditingDate(null);
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
          onSave={save}
          onDelete={remove}
          onCancel={() => setEditingDate(null)}
        />
      )}
    </main>
  );
}
