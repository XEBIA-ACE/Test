'use strict';

const winston = require('winston');

const { combine, timestamp, json, colorize, simple } = winston.format;

const isProd = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProd
    ? combine(timestamp(), json())
    : combine(colorize(), simple()),
  defaultMeta: { service: process.env.SERVICE_NAME || 'user-account-management-service' },
  transports: [new winston.transports.Console()],
});

module.exports = logger;
