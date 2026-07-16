import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import logger from '../logging/logger';

// Ensure data directory exists
const dbDir = process.env.DB_PATH || path.resolve(__dirname, '../../../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'forecastai.db');

// Open database (async)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Failed to open database', { error: err });
    throw err;
  }
  logger.info('SQLite database connected', { path: dbPath });
});

// Enable WAL and foreign keys
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

// Promisify db.run, db.get, db.all for convenience
function runQuery(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getQuery<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

function allQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// Initialize tables
async function initTables() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS forecasts (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      params TEXT,
      result TEXT,
      error TEXT
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS user_forecasts (
      user_id TEXT NOT NULL,
      forecast_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (forecast_id) REFERENCES forecasts(id),
      PRIMARY KEY (user_id, forecast_id)
    )
  `);

  await runQuery(`
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
    )
  `);

  // Add password column if missing (safe migration)
  try {
    const columns = await allQuery<{ name: string }>("PRAGMA table_info(users)");
    const hasPassword = columns.some(c => c.name === 'password');
    if (!hasPassword) {
      await runQuery("ALTER TABLE users ADD COLUMN password TEXT");
      logger.info('Added password column to users table');
    }
  } catch (err) {
    logger.warn('Failed to add password column', { error: err });
  }
}

// Seed default user
async function seedDefaultUser() {
  const DEFAULT_EMAIL = process.env.DEFAULT_USER_EMAIL || 'admin@forecastai.com';
  const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'admin123';

  try {
    const existing = await getQuery<{ id: string }>('SELECT id FROM users WHERE email = ?', [DEFAULT_EMAIL]);
    if (!existing) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      const id = uuidv4();
      await runQuery(
        'INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)',
        [id, DEFAULT_EMAIL, 'Admin', hashedPassword]
      );
      logger.info(`Default user created: ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`, { component: 'database-seed' });
    }
  } catch (err) {
    logger.error('Failed to create default user', { component: 'database-seed', error: err });
  }
}

// Run initialization
initTables().then(() => seedDefaultUser()).catch(err => {
  logger.error('Database initialization failed', { error: err });
});

// ----- Exported async functions -----

export async function saveForecast(id: string, params: any, result?: any, error?: string) {
  await runQuery(
    `INSERT OR REPLACE INTO forecasts (id, params, result, error, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      JSON.stringify(params),
      result ? JSON.stringify(result) : null,
      error || null,
      result ? 'completed' : error ? 'failed' : 'processing'
    ]
  );
}

export async function getForecast(id: string): Promise<any> {
  const row = await getQuery('SELECT * FROM forecasts WHERE id = ?', [id]);
  if (!row) return null;
  return {
    ...row,
    params: row.params ? JSON.parse(row.params) : null,
    result: row.result ? JSON.parse(row.result) : null,
  };
}

export async function getUserForecasts(userId: string): Promise<any[]> {
  const rows = await allQuery(`
    SELECT f.* FROM forecasts f
    JOIN user_forecasts uf ON uf.forecast_id = f.id
    WHERE uf.user_id = ?
    ORDER BY f.created_at DESC
  `, [userId]);
  return rows.map(row => ({
    ...row,
    params: row.params ? JSON.parse(row.params) : null,
    result: row.result ? JSON.parse(row.result) : null,
  }));
}

export async function createUser(email: string, name?: string, password?: string): Promise<any> {
  const id = uuidv4();
  await runQuery(
    'INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)',
    [id, email, name || null, password || null]
  );
  return { id, email, name };
}

export async function getUserByEmail(email: string): Promise<any> {
  return getQuery('SELECT * FROM users WHERE email = ?', [email]);
}

export async function saveAlerts(alerts: Array<{
  id: string;
  title: string;
  description: string;
  severity: string;
  channel: string;
  category: string;
  rootCause: string;
  suggestedAction: string;
  createdAt: string;
  acknowledged: boolean;
}>) {
  const insertSQL = `
    INSERT OR REPLACE INTO alerts (id, title, description, severity, channel, category, root_cause, suggested_action, created_at, acknowledged)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  for (const alert of alerts) {
    await runQuery(insertSQL, [
      alert.id,
      alert.title,
      alert.description,
      alert.severity,
      alert.channel,
      alert.category,
      alert.rootCause,
      alert.suggestedAction,
      alert.createdAt,
      alert.acknowledged ? 1 : 0
    ]);
  }
}

export async function getAllAlerts(filters?: { severity?: string; channel?: string; startDate?: string; endDate?: string }) {
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
  const rows = await allQuery(query, params);
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

export async function acknowledgeAlertById(alertId: string): Promise<boolean> {
  const result = await runQuery('UPDATE alerts SET acknowledged = 1 WHERE id = ?', [alertId]);
  return result.changes > 0;
}

export async function acknowledgeAllAlerts(): Promise<number> {
  const result = await runQuery('UPDATE alerts SET acknowledged = 1 WHERE acknowledged = 0');
  return result.changes;
}

export async function getUnreadAlertCount(): Promise<number> {
  const row = await getQuery('SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0');
  return row?.count || 0;
}

// Export the raw db for advanced use if needed
export default db;