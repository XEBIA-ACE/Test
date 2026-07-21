'use strict';

const { Pool } = require('pg');
const logger = require('../logger');

let pool;

/**
 * Establish (or reuse) the PostgreSQL connection pool.
 * @returns {Promise<Pool>}
 */
async function connectDatabase() {
  if (pool) return pool;

  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'user_accounts',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected PostgreSQL pool error');
  });

  // Verify connectivity
  const client = await pool.connect();
  client.release();

  return pool;
}

/**
 * Returns the active pool (throws if not yet connected).
 * @returns {Pool}
 */
function getPool() {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

module.exports = { connectDatabase, getPool };
