import { MAX_VALUE } from "./counter";

export function sanitizeInput(raw: string): number {
  if (!/^\d+$/.test(raw)) {
    return 0;
  }
  return Math.min(MAX_VALUE, Number(raw));
}
