'use strict';

/**
 * HTTP controller for authentication operations.
 */
class AuthController {
  /**
   * @param {import('../../../container')} container
   */
  constructor(container) {
    this.authenticateUser = container.authenticateUser;
  }

  /**
   * POST /api/v1/auth/login
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   * @returns {Promise<void>}
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { accessToken, user } = await this.authenticateUser.execute({ email, password });

      res.status(200).json({
        status: 'success',
        data: {
          accessToken,
          user: user.toPublicJSON(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
