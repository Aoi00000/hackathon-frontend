/**
 * ファイル概要: hackathon-frontend/src/savedSearch.ts
 *
 * 役割:
 * 検索条件の保存・復元で利用するフォーム状態の正規化を担当します。
 *
 */

/**
 * 実装詳細メモ:
 * 保存検索のqueryJsonを安全に読み戻し、人間が読める条件説明へ変換します。
 * JSONが壊れていても画面を落とさず空条件として扱うことで、古い保存データにも耐えます。
 */
import type { ItemSearchParams } from './api/client';

// labels は、保存検索のJSONキーをユーザー向けの日本語ラベルへ変換する対応表です。
// DBには検索条件を機械的なキー名で保存し、画面ではこの表を通して読みやすい条件名として表示します。
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

// statusLabels は、商品ステータスの内部値を一覧表示用のラベルへ変換します。
// APIではavailable/soldのような安定した値を使い、画面ではユーザーに見慣れた表記へ寄せます。
const statusLabels: Record<string, string> = {
  available: 'Available',
  sold: 'SOLD',
};

// sortLabels は、保存された並び替えキーを説明文に戻すための表です。
// 保存検索の詳細表示で price_asc のような実装値をそのまま出さず、検索条件として理解しやすくします。
const sortLabels: Record<string, string> = {
  recommended: 'おすすめ順',
  new: '新着順',
  price_asc: '価格が安い順',
  price_desc: '価格が高い順',
  checklist_desc: 'チェックリスト追加が多い順',
};

// deliveryWithinLabels は、発送までの日数フィルタの内部値を表示ラベルへ戻します。
// バックエンドにはtoday/weekなど短い値を送り、画面上では「本日中」「1週間以内」として説明します。
const deliveryWithinLabels: Record<string, string> = {
  today: '本日中',
  tomorrow: '明日中',
  '3days': '3日以内',
  week: '1週間以内',
  later: 'それ以上',
};

// parseSavedSearchQuery は、DBに保存されたqueryJsonをItemSearchParamsへ復元します。
// 古い保存データや壊れたJSONがあっても画面全体を落とさず、空条件として扱えるようtry/catchで守ります。
export function parseSavedSearchQuery(queryJson: string): ItemSearchParams {
  try {
    const parsed = JSON.parse(queryJson) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, typeof value === 'string' ? value : String(value ?? '')]),
    ) as ItemSearchParams;
  } catch {
    return {};
  }
}
// describeSavedSearch は、保存検索条件を「ラベルと表示値」の配列へ変換します。
// カンマ区切りの複数選択、価格の円表記、ステータスや並び替えの日本語化をここでまとめて行います。
export function describeSavedSearch(queryJson: string): Array<{ label: string; value: string }> {
  const parsed = parseSavedSearchQuery(queryJson);
  return Object.entries(parsed)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => {
      let displayValue = value ?? '';
      if (displayValue.includes(',')) displayValue = displayValue.split(',').filter(Boolean).join(' / ');
      if (key === 'status') displayValue = displayValue.split(' / ').map((v) => statusLabels[v] ?? v).join(' / ');
      if (key === 'sort') displayValue = sortLabels[displayValue] ?? displayValue;
      if (key === 'deliveryWithin') displayValue = deliveryWithinLabels[displayValue] ?? displayValue;
      if (key === 'minPrice' || key === 'maxPrice') displayValue = `${displayValue}円`;
      return { label: labels[key] ?? key, value: displayValue };
    });
}
