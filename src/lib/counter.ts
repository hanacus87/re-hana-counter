export type Mode = "increment" | "decrement";

export const MAX_VALUE = 99;

export function increment(value: number): number {
  return Math.min(MAX_VALUE, value + 1);
}

export function decrement(value: number): number {
  return Math.max(0, value - 1);
}

export function applyAction(value: number, mode: Mode): number {
  return mode === "increment" ? increment(value) : decrement(value);
}
