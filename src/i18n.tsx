/**
 * ファイル概要: hackathon-frontend/src/i18n.tsx
 *
 * 役割:
 * 英語切替廃止後の互換レイヤーとして、翻訳キーではなく日本語文をそのまま扱います。
 *
 */

/**
 * 実装詳細メモ:
 * 画面文言とカテゴリ・状態ラベルの翻訳入口です。
 * 現在は日本語固定ですが、Contextにしておくことで画面側は言語切替の実装詳細を意識せずt関数だけを呼べます。
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
export type Lang = 'ja';

// I18nValue は、画面が言語状態と翻訳関数へアクセスするためのContext値です。
// 現在は日本語固定ですが、型を残すことで既存コンポーネントを大きく変更せずに運用できます。
type I18nValue = {
  lang: Lang;
  setLang: (_lang: Lang) => void;
  t: (key: string) => string;
};

// I18nContext は、アプリ全体へ現在言語と翻訳関数を配るReact Contextです。
// 現在は日本語固定でも、既存コンポーネントが同じuseI18n APIで文言を取得できるように残しています。
const I18nContext = createContext<I18nValue | null>(null);

// I18nProvider は、アプリ配下のコンポーネントへ t 関数を提供します。
// setLangは互換性のために残したno-opで、tは受け取った日本語文言をそのまま返します。
export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useMemo<I18nValue>(() => ({
    lang: 'ja',
    setLang: () => { /* no-op: 日本語固定 */ },
    t: (key: string) => key,
  }), []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
// useI18n は、各画面から翻訳関数を取り出すためのカスタムフックです。
// Providerの外で呼ばれた場合は実装ミスがすぐ分かるよう、明示的にエラーを投げます。
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
// translateKnownValue は、過去の英語切替実装で使っていた値変換関数の互換口です。
// 現在はDB値も画面表示も日本語へ統一しているため、入力値をそのまま返します。
export function translateKnownValue(value: string, _lang?: Lang): string {
  return value;
}
