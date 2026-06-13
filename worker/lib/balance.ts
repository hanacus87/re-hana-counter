import type { Db } from "./users";

type Row = { date: string; bet: number; recovery: number };

export async function listBalances(db: Db, sub: string): Promise<Row[]> {
  const { results } = await db
    .prepare(
      "SELECT date, bet, recovery FROM balances WHERE sub = ? ORDER BY date",
    )
    .bind(sub)
    .all<Row>();
  return results;
}

export async function upsertBalance(
  db: Db,
  sub: string,
  date: string,
  bet: number,
  recovery: number,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO balances (sub, date, bet, recovery) VALUES (?, ?, ?, ?) ON CONFLICT(sub, date) DO UPDATE SET bet = excluded.bet, recovery = excluded.recovery",
    )
    .bind(sub, date, bet, recovery)
    .run();
}

export async function deleteBalance(
  db: Db,
  sub: string,
  date: string,
): Promise<void> {
  await db
    .prepare("DELETE FROM balances WHERE sub = ? AND date = ?")
    .bind(sub, date)
    .run();
}
