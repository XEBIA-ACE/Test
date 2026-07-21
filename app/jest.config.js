'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageThreshold: {
    global: {
      lines: 60,
    },
  },
};
