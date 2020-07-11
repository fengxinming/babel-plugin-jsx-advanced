import empty from 'rollup-plugin-empty';
import match from 'rollup-plugin-match';
import copy from 'rollup-plugin-copy';
import combine from 'rollup-plugin-combine';

export default {
  input: 'src/*.js',
  plugins: [
    empty({
      silent: false,
      dir: 'dist'
    }),
    copy({
      targets: [
        { src: ['README.md', 'package.json'], dest: 'dist' }
      ]
    }),
    match(),
    combine({
      outputDir: true
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
