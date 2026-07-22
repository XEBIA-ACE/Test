'use strict';

const { body } = require('express-validator');

/**
 * Validation chain for POST /api/v1/users/register
 */
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email address is required'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one digit'),

  body('mobile')
    .optional()
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage('Mobile must be a valid E.164 phone number'),

  body('firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape(),

  body('lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape(),
];

module.exports = { validateRegistration };
