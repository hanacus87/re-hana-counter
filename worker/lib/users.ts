export type Db = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = Record<string, unknown>>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
};

export type UserRecord = {
  sub: string;
  userName: string;
};

const MAX_USER_NAME_LENGTH = 256;

function stripControlCharacters(value: string): string {
  return [...value]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code > 0x1f && code !== 0x7f;
    })
    .join("");
}

export async function upsertUser(db: Db, user: UserRecord): Promise<void> {
  const userName = stripControlCharacters(user.userName).slice(
    0,
    MAX_USER_NAME_LENGTH,
  );
  await db
    .prepare(
      "INSERT INTO users (sub, user_name) VALUES (?, ?) ON CONFLICT(sub) DO UPDATE SET user_name = excluded.user_name",
    )
    .bind(user.sub, userName)
    .run();
}

export async function findUserName(
  db: Db,
  sub: string,
): Promise<string | null> {
  const row = await db
    .prepare("SELECT user_name FROM users WHERE sub = ?")
    .bind(sub)
    .first<{ user_name: string }>();
  return row?.user_name ?? null;
}
