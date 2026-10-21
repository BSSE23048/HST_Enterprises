import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { prerender } from './prerender';

export default defineConfig({
  envDir: '..',
  plugins: [react(), prerender()],
  build: { sourcemap: false, rollupOptions: { output: { manualChunks(id) {
    if (id.includes('/node_modules/@firebase/') || id.includes('/node_modules/firebase/')) return 'firebase';
  } } } },
  server: {
    port: 5173
  }
});
