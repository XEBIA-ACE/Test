'use strict';

const { Router } = require('express');

/**
 * Health-check router.
 *
 * GET /health — returns service liveness information.
 * This endpoint is intentionally unauthenticated so load-balancers and
 * container orchestrators can probe it without credentials.
 *
 * @returns {import('express').Router}
 */
function createHealthRouter() {
  const router = Router();

  /**
   * @route  GET /health
   * @access Public
   */
  router.get('/', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'user-management-service',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = createHealthRouter;
