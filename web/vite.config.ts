import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In dev, Vite proxies /api to the API so the browser sees one origin,
// exactly like production where the API serves the built app.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } }
});
