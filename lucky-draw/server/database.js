import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

export function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create tables
      db.run(`CREATE TABLE IF NOT EXISTS prize_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        prize_pool_id INTEGER,
        has_drawn INTEGER DEFAULT 0,
        FOREIGN KEY (prize_pool_id) REFERENCES prize_pools(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS prizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_url TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        remaining INTEGER NOT NULL DEFAULT 1,
        prize_pool_id INTEGER,
        FOREIGN KEY (prize_pool_id) REFERENCES prize_pools(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS draw_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        prize_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (prize_id) REFERENCES prizes(id)
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Promisified DB queries
export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export default db;
