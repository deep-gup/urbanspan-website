import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'configure-apk-headers',
      configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('.apk')) {
            const filename = req.url.split('/').pop().split('?')[0];
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          }
          next();
        });
      }
    }
  ],
});
