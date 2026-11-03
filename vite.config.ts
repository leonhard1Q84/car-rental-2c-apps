import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(root, 'src/apps/selfservice-rental'),
      '@customer': path.resolve(root, 'src/apps/selfservice-rental'),
      '@selfservice': path.resolve(root, 'src/apps/selfservice-rental'),
      '@shared': path.resolve(root, 'src/shared'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(root, 'index.html'),
        selfservice: path.resolve(root, 'selfservice.html'),
      },
    },
  },
});
