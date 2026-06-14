import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

// 画面表示用の言語です。日本語をデフォルトにし、英語へ切り替える場合も
// 元データを書き換えず、表示だけを切り替えます。
export type Lang = 'ja' | 'en';
type Dict = Record<string, string>;

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const ja: Dict = {
  items: '商品一覧', sell: '出品する', myItems: '出品履歴', purchases: '購入履歴', checklist: 'チェックリスト', myPage: 'マイページ', notifications: '通知', login: 'ログイン', register: '新規登録', logout: 'ログアウト', loading: '読み込み中...',
};

const en: Dict = {
  items: 'Items', sell: 'Sell', myItems: 'Listings', purchases: 'Purchases', checklist: 'Checklist', myPage: 'My Page', notifications: 'Notifications', login: 'Log in', register: 'Sign up', logout: 'Log out', loading: 'Loading...',
  'AIが出品と購入判断を支援する次世代フリマ': 'Next-generation flea market supported by AI',
  'Mercari風の左サイドバー検索とコンパクトな商品カードで、画面内に多くの商品を表示します。': 'Mercari-style sidebar filters and compact cards help you browse many items at once.',
  'キーワード': 'Keyword', 'カテゴリ': 'Category', '商品状態': 'Condition', 'サイズ': 'Size', '色': 'Color', '販売状況': 'Sale status', '発送までの日数': 'Days until shipping', '検索用タグ': 'Search tags', '最低価格': 'Min price', '最高価格': 'Max price', '並び替え': 'Sort', '検索': 'Search', '条件をリセット': 'Reset filters', '検索条件を保存': 'Save search', '保存済み検索条件': 'Saved searches', '保存': 'Save',
  'おすすめ順': 'Recommended', '新着順': 'Newest', '価格が安い順': 'Price: low to high', '価格が高い順': 'Price: high to low', 'チェックリスト追加が多い順': 'Most checked',
  '条件に合う商品はありませんでした': 'No items matched your filters', 'キーワード、価格、カテゴリ、販売状況などの条件を少し広げて再検索してください。': 'Try broadening keyword, price, category, or status filters.', '商品を読み込んでいます...': 'Loading items...',
  'MerRecデータセットを想定したおすすめ': 'Recommendations inspired by MerRec', 'おすすめ理由': 'Reason',
  'AI購入アシスト': 'AI purchase assistant', '購入前AIチェック': 'AI pre-purchase check', '不安点': 'Concerns', '質問候補': 'Suggested questions', '不整合チェック': 'Inconsistency check', '価格チェック': 'Price check', 'カテゴリ別レビュー知識': 'Category review knowledge',
  'AIに商品について質問する': 'Ask AI about this item', 'AIに聞く': 'Ask AI', 'AIが回答を生成中...': 'AI is generating an answer...', 'コメント': 'Comments', '非公開DM': 'Private DM',
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('hackathon_lang') === 'en' ? 'en' : 'ja'));

  const value = useMemo<I18nValue>(() => ({
    lang,
    setLang: (next: Lang) => {
      localStorage.setItem('hackathon_lang', next);
      setLang(next);
    },
    t: (key: string) => (lang === 'en' ? en[key] ?? ja[key] ?? key : ja[key] ?? key),
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

export function translateKnownValue(value: string, lang: Lang): string {
  if (lang === 'ja') return value;
  const staticMap: Record<string, string> = {
    '新品・未使用': 'New / unused', '未使用に近い': 'Like new', '目立った傷や汚れなし': 'No noticeable damage', 'やや傷や汚れあり': 'Slight damage or stains', '傷や汚れあり': 'Damage or stains', '全体的に状態が悪い': 'Poor condition',
    'ファッション': 'Fashion', '本・教材': 'Books / study materials', 'ガジェット・家電': 'Gadgets / appliances', 'スマホ・PC周辺機器': 'Smartphone / PC accessories', '家具・インテリア': 'Furniture / interior', '日用品・生活雑貨': 'Daily goods', '美容・コスメ': 'Beauty / cosmetics', 'スポーツ・アウトドア': 'Sports / outdoors', 'ゲーム・ホビー': 'Games / hobbies', '音楽・楽器': 'Music / instruments', 'チケット': 'Tickets', 'ハンドメイド': 'Handmade', '食品・飲料': 'Food / drinks', 'その他': 'Other',
    'Available': 'Available', 'SOLD': 'SOLD', 'Canceled': 'Canceled', '購入手続き完了': 'Paid', '発送済み': 'Shipped', '取引完了': 'Completed',
  };
  return staticMap[value] ?? value;
}
