import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/index.js'),
      name: '@rbac/rbac',
      fileName: () => 'rbac.min.js',
      formats: ['umd']
    },
    outDir: 'lib/@rbac',
    sourcemap: true,
    rollupOptions: {
      external: [],
    },
  },
});
