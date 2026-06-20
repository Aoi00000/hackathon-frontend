/**
 * ファイル概要: hackathon-frontend/src/TranslatedText.tsx
 *
 * 役割:
 * 英語切替を廃止した後も既存呼び出しを壊さないため、日本語文字列をそのまま表示する互換部品です。
 *
 */

/**
 * 実装詳細メモ:
 * 商品名や説明などユーザー入力由来の文字列を、必要に応じて翻訳処理に通して表示する小さなラッパーです。
 * タグ名をpropsで選べるため、見出し・本文・強調表示で同じ処理を再利用できます。
 */
// 英語化機能は実装対象から外したため、このコンポーネントは
// ユーザー入力やAI生成文を再翻訳せず、そのまま表示するだけにします。
// 既存コードの <TranslatedText ... /> 呼び出しを維持するための薄いラッパーです。
export function TranslatedText({ text, as = 'span', className }: { text?: string | null; as?: 'span' | 'p' | 'h1' | 'h2' | 'strong'; className?: string }) {
  const Component = as as any;
  return <Component className={className}>{text ?? ''}</Component>;
}
