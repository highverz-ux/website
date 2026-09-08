import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        work: resolve(__dirname, 'work.html'),
        creatorNiv0ne: resolve(__dirname, 'creator-niv0ne.html'),
        creatorUmarpnj: resolve(__dirname, 'creator-umarpnj.html'),
        team: resolve(__dirname, 'team.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
