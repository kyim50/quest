import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from "vite-plugin-svgr"

export default defineConfig({
  plugins: [
    react(),
    svgr({
      // Enable SVGR in production mode and ensure correct handling
      svgo: true, // Use SVGO to optimize SVGs
      svgoConfig: {
        plugins: [
          { removeViewBox: false }, // Keep the viewBox attribute to prevent scaling issues
          { removeDimensions: true }, // Let CSS control the dimensions
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    target: 'es2015', // Ensures compatibility with modern browsers, adjust if targeting older browsers
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Ensure proper handling of asset filenames (images, sprites, etc.)
          if (/\.svg$/.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    cssCodeSplit: true, // Ensure CSS is code-split and optimized
    sourcemap: true, // Enable source maps for better debugging in production
    minify: 'esbuild', // Use esbuild for fast and effective minification
  },
  server: {
    watch: {
      usePolling: true, // Useful if running in Docker or virtualized environments
    },
  },
});
