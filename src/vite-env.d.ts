/**
 * ファイル概要: hackathon-frontend/src/vite-env.d.ts
 *
 * 役割:
 * Viteが提供するimport.meta.envなどの型定義を読み込むための宣言ファイルです。
 *
 */

/**
 * 実装詳細メモ:
 * Viteが注入するimport.meta.envの型をTypeScriptに認識させるための宣言ファイルです。
 * APIのURLなどビルド時環境変数を使うファイルが型エラーにならないようにします。
 */
/// <reference types="vite/client" />

// Viteの import.meta.env に独自環境変数 VITE_API_BASE_URL を認識させるための型定義です。
// このファイルがないと、TypeScriptが import.meta.env を知らず、
// 「プロパティ 'env' は型 'ImportMeta' に存在しません」というエラーになります。
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

// ImportMeta は、import.meta.env に上のImportMetaEnv型を結びつけるための拡張です。
// api/client.ts が import.meta.env.VITE_API_BASE_URL を参照しても型エラーにならないようにします。
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
