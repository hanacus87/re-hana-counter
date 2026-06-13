import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import type { Db } from "../../worker/lib/users";

export function createTestDb(): Db {
  const db = new Database(":memory:");
  const migration = readFileSync(
    new URL("../../migrations/0001_create_users.sql", import.meta.url),
    "utf8",
  );
  db.run(migration);

  return {
    prepare(query: string) {
      return {
        bind(...values: unknown[]) {
          const params = values as never[];
          return {
            async first<T = Record<string, unknown>>() {
              return (db.query(query).get(...params) as T | null) ?? null;
            },
            async run() {
              return db.query(query).run(...params);
            },
          };
        },
      };
    },
  };
}
