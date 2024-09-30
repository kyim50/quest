import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Add any necessary aliases here if needed
      // For example, if you had any specific aliases you used before
    },
  },
  base: '/', // Set base to root since there's no subpath
  build: {
    outDir: 'dist', // Ensure the output directory is correct
    rollupOptions: {
      output: {
        // This can help avoid issues with chunking
        manualChunks: undefined,
      },
    },
  },
});
