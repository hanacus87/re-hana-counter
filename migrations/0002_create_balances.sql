CREATE TABLE balances (
  sub TEXT NOT NULL,
  date TEXT NOT NULL,
  bet INTEGER NOT NULL,
  recovery INTEGER NOT NULL,
  PRIMARY KEY (sub, date)
);
