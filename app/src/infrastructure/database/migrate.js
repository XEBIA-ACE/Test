'use strict';

/**
 * Minimal bootstrap migration — creates the users table if it does not exist.
 * For production use, replace with a proper migration tool (e.g. Flyway, node-pg-migrate).
 */

require('dotenv').config();
const { connectDatabase, getPool } = require('./connection');
const logger = require('../logger');

const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY,
  email           VARCHAR(320) NOT NULL UNIQUE,
  mobile          VARCHAR(30),
  password_hash   TEXT NOT NULL,
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  status          VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
  oauth_provider  VARCHAR(50),
  oauth_subject   VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email   ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_mobile  ON users (mobile);
CREATE INDEX IF NOT EXISTS idx_users_status  ON users (status);
`;

async function migrate() {
  await connectDatabase();
  const pool = getPool();
  await pool.query(CREATE_USERS_TABLE);
  logger.info('Migrations applied successfully');
  await pool.end();
}

migrate().catch((err) => {
  logger.error({ err }, 'Migration failed');
  process.exit(1);
});
