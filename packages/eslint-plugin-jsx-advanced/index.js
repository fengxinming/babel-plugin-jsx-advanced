'use strict';

module.exports = {
  rules: {
    'jsx-uses-i-for': require('./rules/jsx-uses-i-for')
  },
  processors: {},
  configs: {
    recommended: require('./configs/recommended'),
    all: require('./configs/all')
  }
};
