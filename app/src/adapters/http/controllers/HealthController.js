'use strict';

/**
 * HTTP controller for health-check endpoints.
 */
class HealthController {
  /**
   * GET /health
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {void}
   */
  check(req, res) {
    res.status(200).json({
      status: 'ok',
      service: process.env.SERVICE_NAME || 'user-account-management-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}

module.exports = HealthController;
