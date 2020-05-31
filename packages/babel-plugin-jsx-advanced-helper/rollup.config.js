import empty from 'rollup-plugin-empty';
import match from 'rollup-plugin-match';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/*.js',
  plugins: [
    empty({
      silent: false,
      dir: 'dist'
    }),
    match(),
    copy({
      targets: [
        { src: ['README.md', 'package.json'], dest: 'dist' }
      ]
    })
  ],
  external() {
    return true;
  },
  output: [{
    dir: 'dist/es',
    format: 'es'
  }, {
    dir: 'dist',
    format: 'cjs'
  }]
};
