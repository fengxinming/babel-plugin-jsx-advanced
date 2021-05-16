'use strict';

module.exports = {
  rules: {
    'valid-x-for': require('./rules/valid-x-for'),
    'valid-x-for-key': require('./rules/valid-x-for-key'),
    'valid-x-if': require('./rules/valid-x-if'),
    'valid-if': require('./rules/valid-if')
  },
  processors: {},
  configs: {
    recommended: require('./configs/recommended'),
    all: require('./configs/all')
  }
};
