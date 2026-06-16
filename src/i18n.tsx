import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

// 英語化機能は今回の実装対象から外し、日本語表示だけに統一します。
// 既存ページは useI18n().t(...) を呼んでいるため、APIの形だけ残し、
// 表示文言は常に日本語キーをそのまま返すようにしています。
export type Lang = 'ja';

type I18nValue = {
  lang: Lang;
  setLang: (_lang: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useMemo<I18nValue>(() => ({
    lang: 'ja',
    setLang: () => { /* no-op: 日本語固定 */ },
    t: (key: string) => key,
  }), []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

export function translateKnownValue(value: string, _lang?: Lang): string {
  return value;
}
