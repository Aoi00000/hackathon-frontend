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
  return `${safeNumber(value).toLocaleString('ja-JP')} コイン`;
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
