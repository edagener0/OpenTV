import Database from 'better-sqlite3'

export type DB = Database.Database

const migrations: string[] = [
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    token_version INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    tmdb_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    vote_average REAL,
    release_date TEXT,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, media_type, tmdb_id)
  );

  CREATE INDEX favorites_recent ON favorites (user_id, created_at DESC);

  CREATE TABLE watch_progress (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    tmdb_id INTEGER NOT NULL,
    season INTEGER NOT NULL DEFAULT 0,
    episode INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    episode_title TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    genres TEXT NOT NULL DEFAULT '[]',
    runtime_seconds INTEGER,
    position_seconds REAL,
    duration_seconds REAL,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    provider TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    started_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, media_type, tmdb_id, season, episode)
  );

  CREATE INDEX watch_progress_recent ON watch_progress (user_id, updated_at DESC);

  CREATE TABLE watch_activity (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    seconds INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day)
  );
  `,
]

export function migrate(db: DB): void {
  const current = db.pragma('user_version', { simple: true }) as number
  for (let version = current; version < migrations.length; version += 1) {
    const sql = migrations[version]
    if (!sql) continue
    db.transaction(() => {
      db.exec(sql)
      db.pragma(`user_version = ${version + 1}`)
    })()
  }
}

export function openDatabase(file: string): DB {
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  migrate(db)
  return db
}
