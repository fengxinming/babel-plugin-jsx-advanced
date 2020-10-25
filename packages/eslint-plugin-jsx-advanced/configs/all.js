'use strict';

module.exports = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['jsx-advanced'],
  rules: {
    'jsx-advanced/jsx-uses-x-for': 2
  }
};
