/**
 * ファイル概要: hackathon-frontend/vite.config.ts
 *
 * 役割:
 * React + Vite の開発サーバーとビルド設定を定義します。
 *
 * コメント方針:
 * 実装の動作は変えず、状態管理、API通信、画面遷移、デモで見せるべき意図を日本語で補足しています。
 */

/**
 * 実装詳細メモ:
 * React用Viteプラグインと開発サーバー設定です。
 * フロントエンド単体で起動してもバックエンドAPIへ接続できるよう、環境変数側のAPI URLと合わせて管理します。
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Viteの設定ファイルです。
// Reactプラグインを有効にして、TypeScript + Reactの開発体験を整えます。
export default defineConfig({
  plugins: [react()],
});
