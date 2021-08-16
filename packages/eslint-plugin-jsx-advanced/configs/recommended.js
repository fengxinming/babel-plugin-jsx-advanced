'use strict';

module.exports = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['jsx-advanced'],
  rules: {
    'jsx-advanced/valid-x-for': 'error',
    'jsx-advanced/valid-x-if': 'error',
    'jsx-advanced/valid-if': 'error',
    'jsx-advanced/valid-x-for-key': 'warn',
    'no-sequences': 'off'
  }
};
