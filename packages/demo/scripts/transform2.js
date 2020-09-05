'use strict';

const fs = require('fs-extra');
const path = require('path').posix;
const { transformFileSync } = require('@babel/core');

const { code } = transformFileSync(
  path.join(__dirname, '..', 'src', 'index2.jsx'), {
    plugins: [
      [path.join(__dirname, '..', '..', 'babel-plugin-jsx-advanced'), {
        elifAlias: 'else-if'
      }]
    ],
    parserOpts: {
      plugins: ['jsx']
    }
  }
);

fs.outputFileSync(path.join(__dirname, '..', 'dist', 'output2.jsx'), code, 'utf8');
