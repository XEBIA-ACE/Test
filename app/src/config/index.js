'use strict';

require('dotenv').config();

/**
 * Central configuration object loaded from environment variables.
 * All application code should import config from here — never read
 * process.env directly outside this module.
 *
 * @type {object}
 */
const config = {
  /** HTTP server port */
  port: parseInt(process.env.PORT || '3000', 10),

  /** Runtime environment */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** JWT settings */
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  /** bcrypt settings */
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },

  /** Logging */
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
