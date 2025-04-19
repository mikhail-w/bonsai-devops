import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine if we're in production mode
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    define: {
      'process.env.VITE_WEATHER_API_KEY': JSON.stringify(env.VITE_WEATHER_API_KEY),
      'process.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY)
    },
    server: {
      host: true,
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: path => path.replace(/^\/api/, '/api'),
        },
        '/media': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/static': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        '@homepageSections': path.resolve(
          __dirname,
          'src/pages/homepage-sections'
        ),
      },
    },
    // Add support for .glb files as assets
    assetsInclude: ['**/*.glb'],
    
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
          },
        },
      },
    },
  };
});
