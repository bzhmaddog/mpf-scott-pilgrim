import {defineConfig} from 'vitest/config';

// Extra Vitest options merged by the Angular unit-test builder (angular.json > test > runnerConfig)
export default defineConfig({
  test: {
    server: {
      deps: {
        // h5dmd ships ESM with extension-less relative imports ("./dmd") that
        // Node cannot resolve: let Vite bundle it instead of externalizing it.
        inline: ['h5dmd'],
      },
    },
  },
});
