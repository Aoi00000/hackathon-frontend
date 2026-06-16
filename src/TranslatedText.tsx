// 英語化機能は実装対象から外したため、このコンポーネントは
// ユーザー入力やAI生成文を再翻訳せず、そのまま表示するだけにします。
// 既存コードの <TranslatedText ... /> 呼び出しを維持するための薄いラッパーです。
export function TranslatedText({ text, as = 'span', className }: { text?: string | null; as?: 'span' | 'p' | 'h1' | 'h2' | 'strong'; className?: string }) {
  const Component = as as any;
  return <Component className={className}>{text ?? ''}</Component>;
}
