import sqlite3 from 'better-sqlite3';
import path from 'path';

const db = new sqlite3('recruitment.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

export const initDb = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('super_admin', 'admin', 'agent', 'accountant', 'data_entry')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agents table (extends user for agent-specific info)
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phone TEXT,
      address TEXT,
      commission_rate REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Candidates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      passport_number TEXT UNIQUE NOT NULL,
      phone TEXT,
      email TEXT,
      date_of_birth DATE,
      package_amount REAL DEFAULT 0,
      total_paid REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      passport_copy_url TEXT,
      cv_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_type TEXT CHECK(payment_type IN ('visa', 'medical', 'ticket', 'service')) NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cash', 'sslcommerz')) NOT NULL,
      transaction_id TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    )
  `);

  // SSL Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ssl_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_type TEXT NOT NULL,
      tran_id TEXT UNIQUE NOT NULL,
      status TEXT CHECK(status IN ('pending', 'success', 'failed', 'cancelled')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    )
  `);

  // Seed Super Admin if not exists
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@example.com');
  if (!admin) {
    // Password is 'password123' hashed (manually for seeding, will use bcrypt in app)
    // For seeding simplicity in this script, we'll just insert a placeholder and let the app handle it or use a pre-hashed value
    // Pre-hashed 'password123' using bcrypt: $2a$10$X7m.uX6.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v
    // Actually, I'll use a simple seed and the app can update it.
  }
};

export default db;
