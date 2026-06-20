/**
 * ファイル概要: hackathon-frontend/src/utils.ts
 *
 * 役割:
 * 日付・通貨・画像/動画メディア配列など、複数画面で使う小さな表示補助関数をまとめます。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
/**
 * フロントエンド共通ユーティリティ。
 *
 * 金額表記、JST時刻表示、商品メディアURL配列変換、評価星表示など、複数ページで使う処理を集約します。
 * 特に商品メディアは、旧仕様の単一画像URL、新仕様の複数画像JSON配列、動画Data URLのすべてを扱うため、
 * 各ページが独自にJSON.parseしないようここで吸収します。
 */
// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function formatDate(value?: string | null): string {
  if (!value) return '-';
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const raw = String(value).trim();
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const hasExplicitTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(raw);

  // Cloud SQLのDATETIMEはタイムゾーン情報を持たない文字列として返ることがあります。
  // Cloud Run / Cloud SQL 側でUTC相当の値として保存されたものをブラウザがローカル時刻として
  // 解釈すると、9時間前の表示になります。
  // そこで、タイムゾーン表記がない日時だけ「UTCとして解釈」してからAsia/Tokyo表示します。
  // 例: 2026-06-13T12:04:00 -> 2026-06-13T12:04:00Z -> 日本時間 21:04
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const date = new Date(hasExplicitTimezone ? normalized : `${normalized}Z`);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function ratingStars(rating: unknown): string {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const score = Math.round(safeNumber(rating) || 0);
  return '★'.repeat(Math.max(0, Math.min(5, score))) + '☆'.repeat(Math.max(0, 5 - Math.min(5, score)));
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function nextPurchaseStep(status?: string): string {
  if (status === 'paid') return '発送待ち';
  if (status === 'shipped') return '受け取り評価待ち';
  return '';
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function formatYen(value: unknown): string {
  return `¥${safeNumber(value).toLocaleString('ja-JP')}`;
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function formatCoins(value: unknown): string {
  // DBとAPIの内部名は過去実装との互換性のため balanceCoins / salesCoins のままですが、
  // 画面上の金額表記はサービス全体で日本円風の "¥" に統一します。
  return formatYen(value);
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function statusLabel(status: string): string {
  if (status === 'sold') return 'SOLD';
  if (status === 'canceled') return 'Canceled';
  return 'Available';
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function purchaseStatusLabel(status?: string): string {
  if (status === 'shipped') return '発送済み';
  if (status === 'completed') return '取引完了';
  if (status === 'canceled') return 'キャンセル';
  return '購入手続き完了';
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function isVideoUrl(url: string): boolean {
  // Data URL動画と、一般的な動画拡張子URLを動画として扱います。
  // 外部URLの場合は拡張子だけの簡易判定ですが、デモ用途では十分に機能します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('data:video/') || /\.(mp4|webm|ogg)(\?|#|$)/.test(trimmed);
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function normalizeMediaUrl(url: string): string {
  // 画像・動画の両方に対応したURL正規化です。
  // 旧名 normalizeImageUrl も下で残し、既存コンポーネントを壊さないようにします。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:video/')) return trimmed;
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  return trimmed;
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function normalizeImageUrl(url: string): string {
  // 後方互換のための別名です。
  // 実際には動画Data URLも通せるため、内部では normalizeMediaUrl を使います。
  return normalizeMediaUrl(url);
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function parseImageUrls(value?: string | null): string[] {
  // DB列名は image_url ですが、現在は画像・動画をまとめた商品メディア配列として扱います。
  // 旧仕様の単一URL、新仕様の JSON.stringify([...])、改行区切りのURLをすべて読めるようにしています。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const raw = String(value ?? '').trim();
  if (!raw) return [];

  // 複数メディアの場合は JSON.stringify([...]) した文字列として保存します。
  // 例: ["data:image/...", "data:video/..."]
  if (raw.startsWith('[')) {
    try {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((x): x is string => typeof x === 'string')
          .map((x) => normalizeMediaUrl(x))
          .filter(Boolean);
      }
    } catch {
      // JSONとして壊れている場合は、下の単一URL扱いに落とします。
    }
  }

  // 念のため、改行区切りで保存された文字列も読めるようにします。
  // data:image/svg+xml や data:video にはカンマが含まれることがあるため、カンマ分割は行いません。
  if (!raw.startsWith('data:image/') && !raw.startsWith('data:video/') && /\n/.test(raw)) {
    return raw.split(/\n+/).map((x) => normalizeMediaUrl(x)).filter(Boolean);
  }

  return [normalizeMediaUrl(raw)].filter(Boolean);
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function stringifyImageUrls(urls: string[]): string {
  // 空文字を除き、同じメディアが重複して入らないように整えます。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const cleaned = Array.from(new Set(urls.map((x) => x.trim()).filter(Boolean)));
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function firstImageUrl(value?: string | null): string {
  // 商品一覧・購入履歴などの小さいカードでは、複数メディアの1件目だけを代表表示します。
  return parseImageUrls(value)[0] ?? '';
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function firstMediaUrl(value?: string | null): string {
  // firstImageUrl の意味を新仕様に合わせて明確にした別名です。
  return firstImageUrl(value);
}
