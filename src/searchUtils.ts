/**
 * ファイル概要: hackathon-frontend/src/searchUtils.ts
 *
 * 役割:
 * 商品検索条件の比較・絞り込み・キーワード判定などを共通化します。
 *
 */

/**
 * 実装詳細メモ:
 * 日本語検索の表記ゆれ、カナ、漢字読み、類義語、編集距離を扱う補助関数です。
 * 完全一致だけでは見つからない学生向けフリマの短い商品名を、軽量なファジー検索で補完します。
 */
// 検索に関する補助関数です。
// 商品一覧だけでなく、出品履歴・購入履歴・チェックリストでも同じ柔軟検索を使います。

// synonymGroups は、同じ意味として扱いたい検索語のまとまりです。
// 例として「スマホ」と「スマートフォン」を同じ語へ寄せることで、商品名の書き方が違っても検索に引っかかりやすくします。
const synonymGroups = [
  ['玉ねぎ', '玉葱', 'たまねぎ', 'タマネギ', 'onion'],
  ['にんじん', '人参', 'ニンジン', 'carrot'],
  ['じゃがいも', 'ジャガイモ', '馬鈴薯', 'potato'],
  ['食品', '食べ物', 'フード', 'グルメ'],
  ['参考書', '教科書', '教材', '本', '書籍'],
  ['スマホ', 'スマートフォン', '携帯'],
  ['pc', 'パソコン', 'ノートパソコン', 'コンピュータ'],
  ['数学', 'すうがく', '算数', '数1', '数2', 'math'],
  ['ギター', 'ぎたー', 'guitar', 'エレキギター', 'アコギ'],
  ['大学受験', '受験', '入試'],
];

// kanjiReadingMap は、検索でよく出る漢字語を読みへ変換する簡易辞書です。
// 本格的な形態素解析を入れずに、漢字・ひらがな・カタカナの違いを軽量に吸収するために使います。
const kanjiReadingMap: Record<string, string> = {
  // フロントだけで完結する簡易読み正規化です。
  // 本格的な形態素解析を入れると依存が重くなるため、ハッカソンMVPでは
  // 検索でよく出る語を辞書化し、漢字・ひらがな・カタカナの対応を吸収します。
  数学: 'すうがく',
  算数: 'すうがく',
  参考書: 'さんこうしょ',
  教科書: 'きょうかしょ',
  教材: 'きょうざい',
  食品: 'しょくひん',
  食べ物: 'しょくひん',
  美容: 'びよう',
  本: 'ほん',
  書籍: 'ほん',
};

// normalizeKana は、カタカナをひらがなへ変換します。
// 日本語検索では「ギター」と「ぎたー」のような表記差が頻出するため、比較前に同じ文字種へ寄せます。
function normalizeKana(value: string): string {
  return value.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

// replaceKanjiReadings は、kanjiReadingMapに登録した漢字語を読みへ置き換えます。
// 「数学」と「すうがく」のように文字は違っても意味が同じ検索語を同じ土台で比較できるようにします。
function replaceKanjiReadings(value: string): string {
  return Object.entries(kanjiReadingMap).reduce((text, [kanji, reading]) => text.replaceAll(kanji, reading), value);
}

// normalizeSearchText は、検索対象文字列を比較しやすい正規形へ変換します。
// カナ変換、漢字読み変換、小文字化、記号除去、類義語の代表語化を順に行い、ゆるい検索の土台を作ります。
export function normalizeSearchText(value: string): string {
  const base = normalizeKana(replaceKanjiReadings(value))
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s　\-_/・,.，．、。()（）\[\]【】「」『』]/g, '');
  return synonymGroups.reduce((text, group) => {
    const canonical = normalizeKana(group[0]).toLowerCase().normalize('NFKC');
    return group.reduce((acc, word) => acc.replaceAll(normalizeKana(word).toLowerCase().normalize('NFKC'), canonical), text);
  }, base);
}

// levenshteinDistance は、2つの文字列の編集距離を計算します。
// 1文字の打ち間違いや表記ゆれを許容するため、完全一致しなくても近い語なら検索一致にできます。
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

// fuzzyIncludes は、targetにkeywordが含まれるかを表記ゆれ込みで判定します。
// 正規化後の部分一致に加え、短すぎないキーワードでは編集距離1以内の近さも一致として扱います。
export function fuzzyIncludes(target: string, keyword: string): boolean {
  const q = normalizeSearchText(keyword);
  if (!q) return true;
  const t = normalizeSearchText(target);
  if (t.includes(q)) return true;
  if (q.length <= 2) return false;
  const tokens = t.split(/(?=[a-z0-9])|(?<=[a-z0-9])/).filter(Boolean);
  if (tokens.some((token) => levenshteinDistance(token, q) <= 1)) return true;
  for (let i = 0; i + q.length <= t.length; i += 1) {
    if (levenshteinDistance(t.slice(i, i + q.length), q) <= 1) return true;
  }
  return false;
}

// itemSearchText は、商品や購入履歴の複数フィールドを1本の検索対象文字列にまとめます。
// タイトルだけでなく説明、カテゴリ、色、タグ、出品者名も検索に入れることで、履歴画面でも探しやすくします。
export function itemSearchText(item: { title?: string; description?: string; category?: string; conditionText?: string; size?: string; color?: string; tags?: string; sellerName?: string }): string {
  return [item.title, item.description, item.category, item.conditionText, item.size, item.color, item.tags, item.sellerName].filter(Boolean).join(' ');
}
