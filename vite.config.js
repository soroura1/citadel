import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // Deterministic, reproducible builds — the deployed-bytes test must mean something.
  build: { sourcemap: false, rollupOptions: { output: { entryFileNames: 'assets/[name]-[hash].js' } } },
});
