/**
 * ファイル概要: hackathon-frontend/vite.config.ts
 *
 * 役割:
 * React + Vite の開発サーバーとビルド設定を定義します。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 * コメント方針:
 * 実装の動作は変えず、状態管理、API通信、画面遷移、デモで見せるべき意図を日本語で補足しています。
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Viteの設定ファイルです。
// Reactプラグインを有効にして、TypeScript + Reactの開発体験を整えます。
export default defineConfig({
  plugins: [react()],
});
