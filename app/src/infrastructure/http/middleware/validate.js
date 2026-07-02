'use strict';

const { validationResult } = require('express-validator');
const { ValidationError } = require('../../../domain/errors/DomainError');

/**
 * validate — inbound middleware factory.
 *
 * Runs express-validator checks and converts any failures into a
 * ValidationError so the global error handler can return a 422.
 *
 * @param {import('express-validator').ValidationChain[]} chains
 * @returns {import('express').RequestHandler[]}
 */
const validate = (chains) => [
  ...chains,
  (req, _res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map((e) => e.msg).join('; ');
      return next(new ValidationError(messages));
    }
    return next();
  },
];

module.exports = validate;
