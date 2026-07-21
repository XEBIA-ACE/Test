'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const logger = require('./infrastructure/logger');
const healthRouter = require('./adapters/http/routes/health.routes');
const userRouter = require('./adapters/http/routes/user.routes');
const authRouter = require('./adapters/http/routes/auth.routes');
const errorHandler = require('./adapters/http/middleware/errorHandler');
const requestId = require('./adapters/http/middleware/requestId');

const app = express();

// ─── Security & Parsing ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request ID ──────────────────────────────────────────────────────────────
app.use(requestId);

// ─── HTTP Logging ────────────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/health',
  })
);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
