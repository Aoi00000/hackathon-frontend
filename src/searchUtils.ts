// 検索に関する補助関数です。
// 商品一覧だけでなく、出品履歴・購入履歴・チェックリストでも同じ柔軟検索を使います。

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

function normalizeKana(value: string): string {
  return value.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

function replaceKanjiReadings(value: string): string {
  return Object.entries(kanjiReadingMap).reduce((text, [kanji, reading]) => text.replaceAll(kanji, reading), value);
}

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

export function itemSearchText(item: { title?: string; description?: string; category?: string; conditionText?: string; size?: string; color?: string; tags?: string; sellerName?: string }): string {
  return [item.title, item.description, item.category, item.conditionText, item.size, item.color, item.tags, item.sellerName].filter(Boolean).join(' ');
}
