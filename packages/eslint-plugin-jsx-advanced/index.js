'use strict';

module.exports = {
  rules: {
    'jsx-uses-x-for': require('./rules/jsx-uses-x-for')
  },
  processors: {},
  configs: {
    recommended: require('./configs/recommended'),
    all: require('./configs/all')
  }
};
