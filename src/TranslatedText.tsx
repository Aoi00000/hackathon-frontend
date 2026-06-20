/**
 * ファイル概要: hackathon-frontend/src/TranslatedText.tsx
 *
 * 役割:
 * 英語切替を廃止した後も既存呼び出しを壊さないため、日本語文字列をそのまま表示する互換部品です。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
// 英語化機能は実装対象から外したため、このコンポーネントは
// ユーザー入力やAI生成文を再翻訳せず、そのまま表示するだけにします。
// 既存コードの <TranslatedText ... /> 呼び出しを維持するための薄いラッパーです。
// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function TranslatedText({ text, as = 'span', className }: { text?: string | null; as?: 'span' | 'p' | 'h1' | 'h2' | 'strong'; className?: string }) {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const Component = as as any;
  return <Component className={className}>{text ?? ''}</Component>;
}
