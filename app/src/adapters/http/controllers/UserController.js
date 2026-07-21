'use strict';

const { validationResult } = require('express-validator');
const { ValidationError } = require('../../../domain/errors/DomainError');

/**
 * HTTP controller for user-account operations.
 */
class UserController {
  /**
   * @param {import('../../../container')} container
   */
  constructor(container) {
    this.registerUser = container.registerUser;
    this.getUser = container.getUser;
  }

  /**
   * POST /api/v1/users/register
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   * @returns {Promise<void>}
   */
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
      }

      const { email, password, mobile, firstName, lastName } = req.body;
      const user = await this.registerUser.execute({ email, password, mobile, firstName, lastName });

      res.status(201).json({ status: 'success', data: user.toPublicJSON() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/users/:id
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   * @returns {Promise<void>}
   */
  async getById(req, res, next) {
    try {
      const user = await this.getUser.execute({ userId: req.params.id });
      res.status(200).json({ status: 'success', data: user.toPublicJSON() });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
