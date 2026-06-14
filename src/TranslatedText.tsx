import { useEffect, useMemo, useState } from 'react';

import { aiApi } from './api/client';
import { useI18n, translateKnownValue } from './i18n';

// ユーザー入力のタイトル・説明など、辞書だけでは翻訳できない文字列を英語表示します。
// 日本語へ戻す場合は再翻訳せず、元の日本語文字列をそのまま表示します。
export function TranslatedText({ text, as = 'span', className }: { text?: string | null; as?: 'span' | 'p' | 'h1' | 'h2' | 'strong'; className?: string }) {
  const { lang } = useI18n();
  const original = text ?? '';
  const [translated, setTranslated] = useState('');
  const Component = as as any;
  const known = useMemo(() => translateKnownValue(original, lang), [original, lang]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (lang === 'ja' || !original.trim() || known !== original) {
        setTranslated('');
        return;
      }
      const cacheKey = `translation:${original}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setTranslated(cached);
        return;
      }
      try {
        const result = await aiApi.translate(original);
        if (!cancelled) {
          sessionStorage.setItem(cacheKey, result.text);
          setTranslated(result.text);
        }
      } catch {
        // Gemini / Vertex AIが利用できない場合でも画面は壊さず、原文を表示します。
        if (!cancelled) setTranslated('');
      }
    }
    run();
    return () => { cancelled = true; };
  }, [lang, original, known]);

  return <Component className={className}>{lang === 'en' ? (translated || known || original) : original}</Component>;
}
