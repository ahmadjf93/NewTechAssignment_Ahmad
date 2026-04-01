import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Enable React fast refresh and JSX handling.
  plugins: [react()],
  // Dev server settings for local development.
  server: {
    port: 5173,
  },
});
