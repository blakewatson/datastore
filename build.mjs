import * as esbuild from 'esbuild';

// ESM build options
const esmBuildOptions = {
  entryPoints: ['DataStore.js'],
  outfile: 'dist/datastore.esm.js',
  bundle: true,
  format: 'esm',
};

// ESM build
esbuild.build(esmBuildOptions);

// Minified ESM build
esbuild.build({
  ...esmBuildOptions,
  outfile: 'dist/datastore.esm.min.js',
  minify: true,
});

// Global build options
const globalBuildOptions = {
  entryPoints: ['DataStore.js'],
  outfile: 'dist/datastore.global.js',
  bundle: true,
  format: 'iife',
  globalName: '_DataStoreExports',
  footer: {
    js: 'window.DataStore = _DataStoreExports.default;',
  },
};

// Global build
esbuild.build(globalBuildOptions);

// Minified global build
esbuild.build({
  ...globalBuildOptions,
  outfile: 'dist/datastore.global.min.js',
  minify: true,
});
