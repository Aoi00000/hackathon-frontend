/**
 * ファイル概要: hackathon-frontend/src/vite-env.d.ts
 *
 * 役割:
 * Viteが提供するimport.meta.envなどの型定義を読み込むための宣言ファイルです。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
/// <reference types="vite/client" />

// Viteの import.meta.env に独自環境変数 VITE_API_BASE_URL を認識させるための型定義です。
// このファイルがないと、TypeScriptが import.meta.env を知らず、
// 「プロパティ 'env' は型 'ImportMeta' に存在しません」というエラーになります。
// 【詳細コメント】このinterface宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

// 【詳細コメント】このinterface宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
