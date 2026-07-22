'use strict';

const { Router } = require('express');
const HealthController = require('../controllers/HealthController');

const router = Router();
const controller = new HealthController();

/**
 * GET /health
 * Returns service liveness status.
 */
router.get('/', (req, res) => controller.check(req, res));

module.exports = router;
