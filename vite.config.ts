import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Viteの設定ファイルです。
// Reactプラグインを有効にして、TypeScript + Reactの開発体験を整えます。
export default defineConfig({
  plugins: [react()],
});
