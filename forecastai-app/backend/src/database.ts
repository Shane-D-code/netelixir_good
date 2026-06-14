import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = process.env.DB_PATH || path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'forecastai.db');
const db: DatabaseType = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS forecasts (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    params TEXT,
    result TEXT,
    error TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_forecasts (
    user_id TEXT NOT NULL,
    forecast_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id),
    PRIMARY KEY (user_id, forecast_id)
  );
`);

export function saveForecast(id: string, params: any, result?: any, error?: string) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO forecasts (id, params, result, error, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    JSON.stringify(params),
    result ? JSON.stringify(result) : null,
    error || null,
    result ? 'completed' : error ? 'failed' : 'processing'
  );
}

export function getForecast(id: string): any {
  const stmt = db.prepare('SELECT * FROM forecasts WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;
  return {
    ...row,
    params: row.params ? JSON.parse(row.params) : null,
    result: row.result ? JSON.parse(row.result) : null,
  };
}

export function getUserForecasts(userId: string): any[] {
  const stmt = db.prepare(`
    SELECT f.* FROM forecasts f
    JOIN user_forecasts uf ON uf.forecast_id = f.id
    WHERE uf.user_id = ?
    ORDER BY f.created_at DESC
  `);
  return stmt.all(userId);
}

export function createUser(email: string, name?: string): any {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)');
  stmt.run(id, email, name || null);
  return { id, email, name };
}

export function getUserByEmail(email: string): any {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

export default db;
