/// <reference types="vite/client" />

// Viteの import.meta.env に独自環境変数 VITE_API_BASE_URL を認識させるための型定義です。
// このファイルがないと、TypeScriptが import.meta.env を知らず、
// 「プロパティ 'env' は型 'ImportMeta' に存在しません」というエラーになります。
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
