import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // Get API URL from environment variable, fallback to localhost for development
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [react(), TanStackRouterVite()],
    // Use relative paths for Electron file:// protocol compatibility
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/auth': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Allow larger chunks - Vite will handle splitting automatically
      chunkSizeWarningLimit: 1000,
    },
  };
});
