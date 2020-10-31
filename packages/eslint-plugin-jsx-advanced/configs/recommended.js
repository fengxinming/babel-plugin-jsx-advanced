'use strict';

module.exports = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['jsx-advanced'],
  rules: {
    'jsx-advanced/jsx-valids-x-for': 2,
    'jsx-advanced/jsx-valids-x-elif': 2,
    'jsx-advanced/jsx-valids-x-else': 2
  }
};
