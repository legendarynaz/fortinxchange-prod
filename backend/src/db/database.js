const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || './data/4ortinx.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database schema
const initialize = () => {
  return new Promise((resolve, reject) => {
    try {
      // Fee Transactions Table
      db.exec(`
        CREATE TABLE IF NOT EXISTS fee_transactions (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK(type IN ('swap', 'onramp', 'bridge', 'nft', 'premium')),
          user_address TEXT,
          chain_id INTEGER NOT NULL,
          tx_hash TEXT UNIQUE,
          
          -- Amounts
          gross_amount TEXT NOT NULL,
          fee_amount TEXT NOT NULL,
          fee_percent REAL NOT NULL,
          fee_usd REAL,
          
          -- Token info
          token_symbol TEXT,
          token_address TEXT,
          
          -- Status
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'failed')),
          
          -- Timestamps
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          confirmed_at DATETIME,
          
          -- Metadata
          metadata TEXT
        )
      `);

      // Daily Revenue Aggregates
      db.exec(`
        CREATE TABLE IF NOT EXISTS daily_revenue (
          date TEXT NOT NULL,
          chain_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          
          -- Totals
          transaction_count INTEGER DEFAULT 0,
          total_volume_usd REAL DEFAULT 0,
          total_fees_usd REAL DEFAULT 0,
          
          -- Unique users
          unique_users INTEGER DEFAULT 0,
          
          PRIMARY KEY (date, chain_id, type)
        )
      `);

      // User Tiers (premium subscriptions)
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_tiers (
          address TEXT PRIMARY KEY,
          tier TEXT NOT NULL CHECK(tier IN ('standard', 'premium', 'vip')),
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Fee Wallet Balances (tracked from blockchain)
      db.exec(`
        CREATE TABLE IF NOT EXISTS wallet_balances (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chain_id INTEGER NOT NULL,
          token_address TEXT NOT NULL,
          token_symbol TEXT NOT NULL,
          balance TEXT NOT NULL,
          balance_usd REAL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(chain_id, token_address)
        )
      `);

      // Admin Users
      db.exec(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'viewer')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `);

      // Withdrawal Records
      db.exec(`
        CREATE TABLE IF NOT EXISTS withdrawals (
          id TEXT PRIMARY KEY,
          chain_id INTEGER NOT NULL,
          to_address TEXT NOT NULL,
          token_address TEXT NOT NULL,
          token_symbol TEXT NOT NULL,
          amount TEXT NOT NULL,
          amount_usd REAL,
          tx_hash TEXT,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'confirmed', 'failed')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          confirmed_at DATETIME,
          created_by TEXT
        )
      `);

      // Indexes for performance
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_fee_transactions_user ON fee_transactions(user_address);
        CREATE INDEX IF NOT EXISTS idx_fee_transactions_type ON fee_transactions(type);
        CREATE INDEX IF NOT EXISTS idx_fee_transactions_chain ON fee_transactions(chain_id);
        CREATE INDEX IF NOT EXISTS idx_fee_transactions_created ON fee_transactions(created_at);
        CREATE INDEX IF NOT EXISTS idx_fee_transactions_status ON fee_transactions(status);
        CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON daily_revenue(date);
      `);

      console.log('✅ Database initialized successfully');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper to run queries
const query = (sql, params = []) => {
  return db.prepare(sql).all(...params);
};

const run = (sql, params = []) => {
  return db.prepare(sql).run(...params);
};

const get = (sql, params = []) => {
  return db.prepare(sql).get(...params);
};

module.exports = {
  db,
  initialize,
  query,
  run,
  get,
};
