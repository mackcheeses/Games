import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/Games/',
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@dimforge/rapier3d-compat/rapier_wasm3d_bg.wasm',
          dest: ''
        }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat']
  },
  server: {
    host: true,
    port: 3000
  }
});
