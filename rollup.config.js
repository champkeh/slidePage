import babel from 'rollup-plugin-babel';

export default {
  input: 'src/slidePage.js',
  output: [
    {
      file: 'dist/slidePage.cjs.js',
      format: 'cjs',
    },
    {
      file: 'dist/slidePage.esm.js',
      format: 'esm',
    },
    {
      file: 'dist/slidePage.umd.js',
      format: 'umd',
      name: 'slidePage',
    },
    {
      file: 'dist/slidePage.amd.js',
      format: 'amd',
    },
  ],
  plugins: [
    babel({
      presets: ['@babel/preset-env'],
    }),
  ],
};
