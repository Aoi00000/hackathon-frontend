import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Lang = 'ja' | 'en';
type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = {
  ja: {
    items: '商品一覧', sell: '出品する', myItems: '出品履歴', purchases: '購入履歴', checklist: 'チェックリスト', myPage: 'マイページ', login: 'ログイン', register: '新規登録', logout: 'ログアウト', loading: '読み込み中...'
  },
  en: {
    items: 'Items', sell: 'Sell', myItems: 'Listings', purchases: 'Purchases', checklist: 'Checklist', myPage: 'My page', login: 'Login', register: 'Register', logout: 'Logout', loading: 'Loading...'
  },
};

const jaToEn: Record<string, string> = {
  '商品を出品する': 'List an item',
  '送料は全商品「送料無料」として扱います。': 'Shipping is treated as free for all items.',
  '商品名': 'Item name',
  'カテゴリ': 'Category',
  '状態': 'Condition',
  '価格(円)': 'Price (JPY)',
  '画像URL': 'Image URL',
  '商品の受け渡し方法': 'Delivery method',
  '発送までの日数': 'Days until shipment',
  '発送元の地域': 'Shipping origin',
  'サイズ': 'Size',
  '色': 'Color',
  '検索用タグ': 'Search tags',
  'AIに伝えるメモについて(商品内容、購入時期、サイズ感、注意点など)': 'Notes for AI (item details, purchase timing, size, cautions, etc.)',
  'AIで商品説明を生成': 'Generate description with AI',
  'AI生成中...': 'Generating...',
  '商品説明': 'Description',
  '出品する': 'List item',
  '商品一覧': 'Items',
  '出品履歴': 'Listings',
  '購入履歴': 'Purchase history',
  'チェックリスト': 'Checklist',
  'マイページ': 'My page',
  'ログイン': 'Login',
  '新規登録': 'Register',
  'ログアウト': 'Logout',
  '商品名・カテゴリ・タグで検索': 'Search by item name, category, or tags',
  '詳細検索': 'Advanced search',
  'キーワード': 'Keyword',
  '最小価格': 'Min price',
  '最大価格': 'Max price',
  '販売状況': 'Availability',
  '並び替え': 'Sort',
  '検索': 'Search',
  '検索条件を保存': 'Save search',
  '保存名': 'Saved search name',
  '商品詳細を見る': 'View details',
  'チェック': 'Checklist adds',
  '独自商品ID': 'Item ID',
  '送料': 'Shipping fee',
  '送料無料': 'Free shipping',
  'ステータス': 'Status',
  '最終更新日時': 'Last updated',
  '出品者評価': 'Seller rating',
  '取引実績': 'Transactions',
  '購入する': 'Purchase',
  '購入手続きへ': 'Proceed to purchase',
  'チェックリストに追加': 'Add to checklist',
  'チェックリストに追加済み': 'In checklist',
  'チェックリストから外す': 'Remove from checklist',
  'AIに商品について質問する': 'Ask AI about this item',
  'AIに聞く': 'Ask AI',
  '公開コメント': 'Public comments',
  'コメントを追加': 'Add a comment',
  'コメントを送信': 'Post comment',
  '返信': 'Reply',
  '返信を送信': 'Post reply',
  '非公開DM': 'Private DM',
  'DMを送信': 'Send DM',
  '購入が完了しました。': 'Purchase completed.',
  'まだ購入した商品はありません。': 'You have not purchased any items yet.',
  '購入日時': 'Purchased at',
  '発送期限': 'Shipping deadline',
  '出品者': 'Seller',
  '商品状態': 'Item status',
  '取引状態': 'Transaction status',
  '受け渡し': 'Delivery',
  '発送元': 'Ships from',
  'お届け先': 'Delivery address',
  '発送通知': 'Shipment notice',
  '取引完了': 'Transaction completed',
  '受け取り評価': 'Receipt rating',
  '評価コメント': 'Rating comment',
  '受け取り評価をする': 'Submit receipt rating',
  '気になった商品を保存します。商品情報が更新された場合は通知にも表示されます。': 'Save items you are interested in. Updates are also shown in notifications.',
  'チェックリストに商品はありません。': 'No items in your checklist.',
  '残高': 'Balance',
  '売上金': 'Sales proceeds',
  '残高チャージ': 'Charge balance',
  'チャージ金額': 'Charge amount',
  'チャージ': 'Charge',
  '発送元・お届け先住所': 'Shipping origin / delivery address',
  '地域': 'Region',
  '住所': 'Address',
  '保存': 'Save',
  '通知設定・通知一覧': 'Notification settings / notifications',
  '通知はありません。': 'No notifications.',
  '保存した検索条件': 'Saved searches',
  '保存した検索条件はありません。': 'No saved searches.',
  '削除': 'Delete',
  'ブロックしたユーザー': 'Blocked users',
  'ブロック中のユーザーはいません。': 'No blocked users.',
  'ブロック解除': 'Unblock',
  '運営にDMする': 'Message support',
  '運営へ送信': 'Send to support',
  'AIおすすめ': 'AI recommendations',
  'チェックリスト数や新着順をもとにおすすめを提示します。': 'Recommendations are based on checklist count and recency.',
  '購入手続き': 'Purchase procedure',
  '支払い': 'Payment',
  '商品の受け渡し': 'Item handoff',
  '評価': 'Rating',
  '現在の残高': 'Current balance',
  '購入後に、購入者の残高から商品代金が引かれ、出品者の売上金へ移ります。': 'After purchase, the item price is deducted from the buyer balance and moved to the seller proceeds.',
  '残高不足です。': 'Insufficient balance.',
  '手続きキャンセル': 'Cancel procedure',
  'チャージ画面へ': 'Go to charge page',
  'この場でチャージ': 'Charge here',
  '購入を確定する': 'Confirm purchase',
  'ファッション': 'Fashion',
  'ガジェット': 'Gadgets',
  '本・教材': 'Books / study materials',
  '家具': 'Furniture',
  'その他': 'Other',
  '新品・未使用': 'New / unused',
  '未使用に近い': 'Like new',
  '目立った傷や汚れなし': 'No noticeable damage or dirt',
  'やや傷や汚れあり': 'Some damage or dirt',
  '全体的に状態が悪い': 'Poor overall condition',
  '購入手続き完了': 'Payment completed',
  '発送済み': 'Shipped',
  'キャンセル': 'Canceled',
  '評価なし': 'No ratings',
  '件': ' reviews',
  'コイン': ' coins',
  '日': ' days'
};

function translateString(value: string): string {
  let out = value;
  const entries = Object.entries(jaToEn).sort((a, b) => b[0].length - a[0].length);
  for (const [ja, en] of entries) {
    out = out.split(ja).join(en);
  }
  return out;
}

function translateDom(lang: Lang): void {
  if (lang !== 'en') return;
  const root = document.getElementById('root');
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const original = node.nodeValue ?? '';
    const translated = translateString(original);
    if (translated !== original) node.nodeValue = translated;
  }
  root.querySelectorAll<HTMLElement>('input, textarea').forEach((element) => {
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) element.setAttribute('placeholder', translateString(placeholder));
  });
}

type I18nValue = { lang: Lang; setLang: (lang: Lang) => void; t: (key: string) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'ja');

  useEffect(() => {
    translateDom(lang);
    const observer = new MutationObserver(() => translateDom(lang));
    const root = document.getElementById('root');
    if (root) observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] });
    return () => observer.disconnect();
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang: (next: Lang) => { localStorage.setItem('lang', next); setLangState(next); },
    t: (key: string) => dictionaries[lang][key] ?? key,
  }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
