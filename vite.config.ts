import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'icon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
        'manifest.json',
        'manifest.webmanifest',
      ],
      manifest: {
        id: '/',
        name: 'Quản Lý Chi Tiêu Android',
        short_name: 'Chi Tiêu',
        description: 'Ứng dụng quản lý thu chi cá nhân phong cách Android Material You, đăng nhập tài khoản Google và đồng bộ dữ liệu đám mây Firestore, quản lý thẻ tín dụng & chu kỳ sao kê, theo dõi ví tiền, ngân sách, mục tiêu tiết kiệm, quy tắc 6 chiếc hũ và chia tiền nhóm tự động tạo mã VietQR chuẩn ngân hàng.',
        theme_color: '#0d9488',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['finance', 'productivity', 'utilities'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
