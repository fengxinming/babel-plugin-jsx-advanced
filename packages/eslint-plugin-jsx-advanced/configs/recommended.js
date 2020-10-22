'use strict';

module.exports = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['@ali/jsx-directive'],
  rules: {
    '@ali/jsx-directive/jsx-uses-i-for': 2
  }
};
