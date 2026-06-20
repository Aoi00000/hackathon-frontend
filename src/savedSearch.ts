/**
 * ファイル概要: hackathon-frontend/src/savedSearch.ts
 *
 * 役割:
 * 検索条件の保存・復元で利用するフォーム状態の正規化を担当します。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
import type { ItemSearchParams } from './api/client';

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
const labels: Record<string, string> = {
  q: 'キーワード',
  category: 'カテゴリ',
  size: 'サイズ',
  color: '色',
  condition: '状態',
  status: '販売状況',
  minPrice: '最低価格',
  maxPrice: '最高価格',
  tag: 'タグ',
  deliveryWithin: '発送までの日数',
  sort: '並び替え',
};

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
const statusLabels: Record<string, string> = {
  available: 'Available',
  sold: 'SOLD',
};

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
const sortLabels: Record<string, string> = {
  recommended: 'おすすめ順',
  new: '新着順',
  price_asc: '価格が安い順',
  price_desc: '価格が高い順',
  checklist_desc: 'チェックリスト追加が多い順',
};

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
const deliveryWithinLabels: Record<string, string> = {
  today: '本日中',
  tomorrow: '明日中',
  '3days': '3日以内',
  week: '1週間以内',
  later: 'それ以上',
};

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function parseSavedSearchQuery(queryJson: string): ItemSearchParams {
  try {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const parsed = JSON.parse(queryJson) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, typeof value === 'string' ? value : String(value ?? '')]),
    ) as ItemSearchParams;
  } catch {
    return {};
  }
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function describeSavedSearch(queryJson: string): Array<{ label: string; value: string }> {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const parsed = parseSavedSearchQuery(queryJson);
  return Object.entries(parsed)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => {
// 【詳細コメント】このlet宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
      let displayValue = value ?? '';
      if (displayValue.includes(',')) displayValue = displayValue.split(',').filter(Boolean).join(' / ');
      if (key === 'status') displayValue = displayValue.split(' / ').map((v) => statusLabels[v] ?? v).join(' / ');
      if (key === 'sort') displayValue = sortLabels[displayValue] ?? displayValue;
      if (key === 'deliveryWithin') displayValue = deliveryWithinLabels[displayValue] ?? displayValue;
      if (key === 'minPrice' || key === 'maxPrice') displayValue = `${displayValue}円`;
      return { label: labels[key] ?? key, value: displayValue };
    });
}
