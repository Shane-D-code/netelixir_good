"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveForecast = saveForecast;
exports.getForecast = getForecast;
exports.getUserForecasts = getUserForecasts;
exports.createUser = createUser;
exports.getUserByEmail = getUserByEmail;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbDir = process.env.DB_PATH || path_1.default.join(__dirname, '../../data');
if (!fs_1.default.existsSync(dbDir))
    fs_1.default.mkdirSync(dbDir, { recursive: true });
const dbPath = path_1.default.join(dbDir, 'forecastai.db');
const db = new better_sqlite3_1.default(dbPath);
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
function saveForecast(id, params, result, error) {
    const stmt = db.prepare(`
    INSERT OR REPLACE INTO forecasts (id, params, result, error, status)
    VALUES (?, ?, ?, ?, ?)
  `);
    stmt.run(id, JSON.stringify(params), result ? JSON.stringify(result) : null, error || null, result ? 'completed' : error ? 'failed' : 'processing');
}
function getForecast(id) {
    const stmt = db.prepare('SELECT * FROM forecasts WHERE id = ?');
    const row = stmt.get(id);
    if (!row)
        return null;
    return {
        ...row,
        params: row.params ? JSON.parse(row.params) : null,
        result: row.result ? JSON.parse(row.result) : null,
    };
}
function getUserForecasts(userId) {
    const stmt = db.prepare(`
    SELECT f.* FROM forecasts f
    JOIN user_forecasts uf ON uf.forecast_id = f.id
    WHERE uf.user_id = ?
    ORDER BY f.created_at DESC
  `);
    return stmt.all(userId);
}
function createUser(email, name) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)');
    stmt.run(id, email, name || null);
    return { id, email, name };
}
function getUserByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
}
exports.default = db;
//# sourceMappingURL=database.js.map