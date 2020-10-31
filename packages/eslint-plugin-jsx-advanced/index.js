'use strict';

module.exports = {
  rules: {
    'jsx-valids-x-for': require('./rules/jsx-valids-x-for'),
    'jsx-valids-x-elif': require('./rules/jsx-valids-x-elif'),
    'jsx-valids-x-else': require('./rules/jsx-valids-x-else')
  },
  processors: {},
  configs: {
    recommended: require('./configs/recommended'),
    all: require('./configs/all')
  }
};
