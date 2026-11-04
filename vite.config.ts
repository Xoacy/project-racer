import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 5180,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
