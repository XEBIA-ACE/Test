'use strict';

const { Router } = require('express');
const UserController = require('../controllers/UserController');
const { validateRegistration } = require('../middleware/validators');
const { authenticate } = require('../middleware/authenticate');
const container = require('../../../container');

const router = Router();
const controller = new UserController(container);

/**
 * POST /api/v1/users/register
 * Register a new user account.
 */
router.post('/register', validateRegistration, (req, res, next) =>
  controller.register(req, res, next)
);

/**
 * GET /api/v1/users/:id
 * Retrieve a user by ID (authenticated).
 */
router.get('/:id', authenticate, (req, res, next) => controller.getById(req, res, next));

module.exports = router;
