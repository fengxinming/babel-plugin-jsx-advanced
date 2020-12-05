'use strict';

module.exports = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['jsx-advanced'],
  rules: {
    'jsx-advanced/valid-x-for': 2,
    'jsx-advanced/valid-x-if': 2,
    'jsx-advanced/valid-if': 2
  }
};
