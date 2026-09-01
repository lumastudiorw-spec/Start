import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const DB_PATH = process.env.DB_PATH ?? './data/eyes-on-me.sqlite'
mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new DatabaseSync(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    contact_count INTEGER NOT NULL,
    delivered INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS discomfort_reports (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT
  );
`)
