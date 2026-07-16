import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePluginConsole } from '@log1997/vite-plugin-console';

export default defineConfig({
  plugins: [
    react(),
    vitePluginConsole({
      enable: true,
      prefix: '🎯',
      defaultStyles:
        'color: #333; background: #e0e0e0; padding: 2px 8px; border-radius: 4px;',
      typeStyles: {
        info:    'color: #0d6efd; background: #cfe2ff; font-weight: bold;',
        warn:    'color: #664d03; background: #fff3cd; border: 1px solid #ffc107;',
        error:   'color: #842029; background: #f8d7da; border: 1px solid #f5c2c7; font-weight: bold;',
        success: 'color: #0f5132; background: #d1e7dd;',
      },
      logLevel: 'log',
    }),
  ],
  server: {
    port: 9811,
  },
});
