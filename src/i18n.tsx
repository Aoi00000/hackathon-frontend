/**
 * ファイル概要: hackathon-frontend/src/i18n.tsx
 *
 * 役割:
 * 英語切替廃止後の互換レイヤーとして、翻訳キーではなく日本語文をそのまま扱います。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
/**
 * 日本語固定の表示互換レイヤー。
 *
 * 途中で英語切り替え機能は不要になったため、現在は常に日本語を返します。
 * 既存コンポーネントが useI18n().t(...) を呼んでいるため、API形状だけ残しています。
 */
import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

// 英語化機能は今回の実装対象から外し、日本語表示だけに統一します。
// 既存ページは useI18n().t(...) を呼んでいるため、APIの形だけ残し、
// 表示文言は常に日本語キーをそのまま返すようにしています。
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type Lang = 'ja';

// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
type I18nValue = {
  lang: Lang;
  setLang: (_lang: Lang) => void;
  t: (key: string) => string;
};

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
const I18nContext = createContext<I18nValue | null>(null);

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function I18nProvider({ children }: { children: ReactNode }) {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const value = useMemo<I18nValue>(() => ({
    lang: 'ja',
    setLang: () => { /* no-op: 日本語固定 */ },
    t: (key: string) => key,
  }), []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function useI18n(): I18nValue {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function translateKnownValue(value: string, _lang?: Lang): string {
  return value;
}
