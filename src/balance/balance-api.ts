import { apiFetch } from "../lib/api";
import type { BalanceMap } from "../lib/balance";

export async function fetchBalances(): Promise<BalanceMap> {
  const res = await apiFetch("/api/balance");
  const data = (await res.json()) as {
    records: { date: string; bet: number; recovery: number }[];
  };
  const map: BalanceMap = {};
  for (const { date, bet, recovery } of data.records) {
    map[date] = { bet, recovery };
  }
  return map;
}

export async function saveBalance(
  date: string,
  bet: number,
  recovery: number,
): Promise<void> {
  await apiFetch("/api/balance", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, bet, recovery }),
  });
}

export async function removeBalance(date: string): Promise<void> {
  await apiFetch("/api/balance", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
}
