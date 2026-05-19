import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const proxyTarget = env.VITE_PROXY_TARGET;

  return {
    application: {},
    vite: {
      server: {
        proxy: proxyTarget
          ? {
              '/api': {
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
                target: proxyTarget,
                ws: true,
              },
            }
          : undefined,
      },
    },
  };
});
