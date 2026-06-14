import type { ItemSearchParams } from './api/client';

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

const statusLabels: Record<string, string> = {
  available: 'Available',
  sold: 'SOLD',
};

const sortLabels: Record<string, string> = {
  recommended: 'おすすめ順',
  new: '新着順',
  price_asc: '価格が安い順',
  price_desc: '価格が高い順',
  checklist_desc: 'チェックリスト追加が多い順',
};

const deliveryWithinLabels: Record<string, string> = {
  today: '本日中',
  tomorrow: '明日中',
  '3days': '3日以内',
  week: '1週間以内',
  later: 'それ以上',
};

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
