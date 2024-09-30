import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Remove any aliasing that points to index.js or similar
    alias: {
      // Example of an alias that might need removing
      // 'react-responsive': path.resolve(__dirname, 'node_modules/react-responsive'),
    },
  },
});
