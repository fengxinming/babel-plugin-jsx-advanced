'use strict';

module.exports = {
  rules: {
    'valid-x-for': require('./rules/valid-x-for'),
    'valid-x-elif': require('./rules/valid-x-elif'),
    'valid-x-else': require('./rules/valid-x-else'),
    'valid-if': require('./rules/valid-if')
  },
  processors: {},
  configs: {
    recommended: require('./configs/recommended'),
    all: require('./configs/all')
  }
};
