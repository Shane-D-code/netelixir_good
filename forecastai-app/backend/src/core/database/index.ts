import Database, { Database as DatabaseType } from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import logger from '../logging/logger';

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
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_forecasts (
    user_id TEXT NOT NULL,
    forecast_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id),
    PRIMARY KEY (user_id, forecast_id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
    channel TEXT NOT NULL,
    category TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    acknowledged INTEGER DEFAULT 0
  );
`);

const alterStmt = db.prepare("PRAGMA table_info(users)");
const columns = alterStmt.all() as Array<{ name: string }>;
const hasPassword = columns.some(c => c.name === 'password');
if (!hasPassword) {
  db.exec("ALTER TABLE users ADD COLUMN password TEXT");
}

const DEFAULT_EMAIL = process.env.DEFAULT_USER_EMAIL || 'admin@forecastai.com';
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'admin123';

try {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(DEFAULT_EMAIL);
  if (!existing) {
    const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)').run(id, DEFAULT_EMAIL, 'Admin', hashedPassword);
    logger.info(`Default user created: ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`, { component: 'database-seed' });
  }
} catch (err) {
  logger.error('Failed to create default user', { component: 'database-seed', error: err });
}

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

export function createUser(email: string, name?: string, password?: string): any {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)');
  stmt.run(id, email, name || null, password || null);
  return { id, email, name };
}

export function getUserByEmail(email: string): any {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

export function saveAlerts(alerts: Array<{ id: string; title: string; description: string; severity: string; channel: string; category: string; rootCause: string; suggestedAction: string; createdAt: string; acknowledged: boolean }>) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO alerts (id, title, description, severity, channel, category, root_cause, suggested_action, created_at, acknowledged)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows: typeof alerts) => {
    for (const row of rows) {
      insert.run(row.id, row.title, row.description, row.severity, row.channel, row.category, row.rootCause, row.suggestedAction, row.createdAt, row.acknowledged ? 1 : 0);
    }
  });
  insertMany(alerts);
}

export function getAllAlerts(filters?: { severity?: string; channel?: string; startDate?: string; endDate?: string }) {
  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params: string[] = [];

  if (filters?.severity) {
    query += ' AND severity = ?';
    params.push(filters.severity);
  }
  if (filters?.channel) {
    query += ' AND channel = ?';
    params.push(filters.channel);
  }
  if (filters?.startDate) {
    query += ' AND created_at >= ?';
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    query += ' AND created_at <= ?';
    params.push(filters.endDate);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    severity: r.severity,
    channel: r.channel,
    category: r.category,
    rootCause: r.root_cause,
    suggestedAction: r.suggested_action,
    createdAt: r.created_at,
    acknowledged: r.acknowledged === 1,
  }));
}

export function acknowledgeAlertById(alertId: string): boolean {
  const result = db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(alertId);
  return result.changes > 0;
}

export function acknowledgeAllAlerts(): number {
  const result = db.prepare('UPDATE alerts SET acknowledged = 1 WHERE acknowledged = 0').run();
  return result.changes;
}

export function getUnreadAlertCount(): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0').get() as any;
  return row?.count || 0;
}

export default db;
