// Database abstraction layer - supports both SQLite and PostgreSQL
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

class Database {
  constructor() {
    this.type = process.env.DATABASE_TYPE || 'sqlite';
    this.db = null;
    this.pool = null;
  }

  async connect() {
    if (this.type === 'postgresql' || process.env.DATABASE_URL) {
      // PostgreSQL connection
      const connectionString = process.env.DATABASE_URL || 
        `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
      
      this.pool = new Pool({
        connectionString: connectionString,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      try {
        await this.pool.query('SELECT NOW()');
        console.log('Connected to PostgreSQL database');
        this.type = 'postgresql';
        await this.initializeDatabase();
      } catch (err) {
        console.error('PostgreSQL connection error:', err.message);
        throw err;
      }
    } else {
      // SQLite connection (default for local development)
      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(process.env.DB_PATH || 'diploma_data.db', (err) => {
          if (err) {
            console.error('Error opening SQLite database:', err.message);
            reject(err);
          } else {
            console.log('Connected to SQLite database');
            this.db.run('PRAGMA foreign_keys = ON', (err) => {
              if (err) {
                console.error('Error enabling foreign keys:', err.message);
              }
              this.initializeDatabase().then(resolve).catch(reject);
            });
          }
        });
      });
    }
  }

  async initializeDatabase() {
    const createGroupsTable = this.type === 'postgresql' ? `
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ` : `
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createUsersTable = this.type === 'postgresql' ? `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      )
    ` : `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      )
    `;

    const createPhotosTable = this.type === 'postgresql' ? `
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        file_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    ` : `
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT,
        file_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    if (this.type === 'postgresql') {
      await this.pool.query(createGroupsTable);
      await this.pool.query(createUsersTable);
      await this.pool.query(createPhotosTable);
    } else {
      return new Promise((resolve, reject) => {
        this.db.serialize(() => {
          this.db.run(createGroupsTable);
          this.db.run(createUsersTable);
          this.db.run(createPhotosTable, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    }
  }

  // Convert SQL with $ placeholders to ? for SQLite
  convertSQL(sql) {
    if (this.type === 'postgresql') {
      return sql; // PostgreSQL uses $1, $2, etc.
    } else {
      // Convert $1, $2, etc. to ? for SQLite
      return sql.replace(/\$(\d+)/g, '?');
    }
  }

  // Query methods that work with both databases
  async query(sql, params = []) {
    const convertedSQL = this.convertSQL(sql);
    if (this.type === 'postgresql') {
      return await this.pool.query(convertedSQL, params);
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(convertedSQL, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      });
    }
  }

  async get(sql, params = []) {
    const convertedSQL = this.convertSQL(sql);
    if (this.type === 'postgresql') {
      const result = await this.pool.query(convertedSQL, params);
      return result.rows[0] || null;
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(convertedSQL, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  }

  async run(sql, params = []) {
    const convertedSQL = this.convertSQL(sql);
    if (this.type === 'postgresql') {
      const result = await this.pool.query(convertedSQL, params);
      return {
        lastID: result.rows[0]?.id || null,
        changes: result.rowCount || 0,
        rows: result.rows
      };
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(convertedSQL, params, function(err) {
          if (err) reject(err);
          else resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        });
      });
    }
  }

  async all(sql, params = []) {
    const convertedSQL = this.convertSQL(sql);
    if (this.type === 'postgresql') {
      const result = await this.pool.query(convertedSQL, params);
      return result.rows;
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(convertedSQL, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  }

  close() {
    if (this.type === 'postgresql') {
      return this.pool.end();
    } else {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

module.exports = Database;

