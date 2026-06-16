/**
 * フロントエンド共通ユーティリティ。
 *
 * 金額表記、JST時刻表示、画像URL配列変換、評価星表示など、複数ページで使う処理を集約します。
 * 特に画像は、旧仕様の単一URLと新仕様の複数画像JSON配列の両方を扱うため、
 * 各ページが独自にJSON.parseしないようここで吸収します。
 */
export function formatDate(value?: string | null): string {
  if (!value) return '-';
  const raw = String(value).trim();
  const hasExplicitTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(raw);

  // Cloud SQLのDATETIMEはタイムゾーン情報を持たない文字列として返ることがあります。
  // Cloud Run / Cloud SQL 側でUTC相当の値として保存されたものをブラウザがローカル時刻として
  // 解釈すると、9時間前の表示になります。
  // そこで、タイムゾーン表記がない日時だけ「UTCとして解釈」してからAsia/Tokyo表示します。
  // 例: 2026-06-13T12:04:00 -> 2026-06-13T12:04:00Z -> 日本時間 21:04
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(hasExplicitTimezone ? normalized : `${normalized}Z`);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function ratingStars(rating: unknown): string {
  const score = Math.round(safeNumber(rating) || 0);
  return '★'.repeat(Math.max(0, Math.min(5, score))) + '☆'.repeat(Math.max(0, 5 - Math.min(5, score)));
}

export function nextPurchaseStep(status?: string): string {
  if (status === 'paid') return '発送待ち';
  if (status === 'shipped') return '受け取り評価待ち';
  return '';
}

export function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function formatYen(value: unknown): string {
  return `¥${safeNumber(value).toLocaleString('ja-JP')}`;
}

export function formatCoins(value: unknown): string {
  // DBとAPIの内部名は過去実装との互換性のため balanceCoins / salesCoins のままですが、
  // 画面上の金額表記はサービス全体で日本円風の "¥" に統一します。
  return formatYen(value);
}

export function statusLabel(status: string): string {
  if (status === 'sold') return 'SOLD';
  if (status === 'canceled') return 'Canceled';
  return 'Available';
}

export function purchaseStatusLabel(status?: string): string {
  if (status === 'shipped') return '発送済み';
  if (status === 'completed') return '取引完了';
  if (status === 'canceled') return 'キャンセル';
  return '購入手続き完了';
}

export function normalizeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/')) return trimmed;
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  return trimmed;
}


export function parseImageUrls(value?: string | null): string[] {
  // 商品画像は、従来の単一URL文字列と、新しい複数画像JSON配列の両方に対応します。
  // 既存データを壊さずに複数アップロードへ拡張するため、DB列は image_url のまま使います。
  const raw = String(value ?? '').trim();
  if (!raw) return [];

  // 複数画像の場合は JSON.stringify([...]) した文字列として保存します。
  // 例: ["data:image/...", "data:image/..."]
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((x): x is string => typeof x === 'string')
          .map((x) => normalizeImageUrl(x))
          .filter(Boolean);
      }
    } catch {
      // JSONとして壊れている場合は、下の単一URL扱いに落とします。
    }
  }

  // 念のため、改行区切り・カンマ区切りで保存された文字列も読めるようにします。
  // data:image/svg+xml にはカンマが含まれるため、data:imageの場合は分割しません。
  if (!raw.startsWith('data:image/') && /\n/.test(raw)) {
    return raw.split(/\n+/).map((x) => normalizeImageUrl(x)).filter(Boolean);
  }

  return [normalizeImageUrl(raw)].filter(Boolean);
}

export function stringifyImageUrls(urls: string[]): string {
  // 空文字を除き、同じ画像が重複して入らないように整えます。
  const cleaned = Array.from(new Set(urls.map((x) => x.trim()).filter(Boolean)));
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
}

export function firstImageUrl(value?: string | null): string {
  // 商品一覧・購入履歴などの小さいカードでは、複数画像の1枚目だけを代表画像として表示します。
  return parseImageUrls(value)[0] ?? '';
}
