import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Lang = 'ja' | 'en';
type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = {
  ja: {
    items: '商品一覧', sell: '出品する', myItems: '出品履歴', purchases: '購入履歴', checklist: 'チェックリスト', myPage: 'マイページ', login: 'ログイン', register: '新規登録', logout: 'ログアウト',
  },
  en: {
    items: 'Items', sell: 'Sell', myItems: 'Listings', purchases: 'Purchases', checklist: 'Checklist', myPage: 'My page', login: 'Login', register: 'Register', logout: 'Logout',
  },
};

type I18nValue = { lang: Lang; setLang: (lang: Lang) => void; t: (key: string) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'ja');
  const value = useMemo(() => ({
    lang,
    setLang: (next: Lang) => { localStorage.setItem('lang', next); setLang(next); },
    t: (key: string) => dictionaries[lang][key] ?? key,
  }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
