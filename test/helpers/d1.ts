import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import type { Db } from "../../worker/lib/users";

export function createTestDb(): Db {
  const db = new Database(":memory:");
  const migrationsDir = new URL("../../migrations/", import.meta.url);
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const file of files) {
    db.run(readFileSync(new URL(file, migrationsDir), "utf8"));
  }

  return {
    prepare(query: string) {
      return {
        bind(...values: unknown[]) {
          const params = values as never[];
          return {
            async first<T = Record<string, unknown>>() {
              return (db.query(query).get(...params) as T | null) ?? null;
            },
            async all<T = Record<string, unknown>>() {
              return { results: db.query(query).all(...params) as T[] };
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
