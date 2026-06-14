// 出品・検索・編集画面で共通利用する選択肢をまとめるファイルです。
// 同じ候補を複数ページに直接書くと修正漏れが起きやすいため、ここに集約します。

export const categories = [
  'ファッション',
  '本・教材',
  'ガジェット・家電',
  'スマホ・PC周辺機器',
  '家具・インテリア',
  '日用品・生活雑貨',
  '美容・コスメ',
  'スポーツ・アウトドア',
  'ゲーム・ホビー',
  '音楽・楽器',
  'チケット',
  'ハンドメイド',
  '食品・飲料',
  'その他',
];

export const searchableCategories = ['', ...categories];

export const conditions = [
  '新品・未使用',
  '未使用に近い',
  '目立った傷や汚れなし',
  'やや傷や汚れあり',
  '傷や汚れあり',
  '全体的に状態が悪い',
];

export const searchableConditions = ['', ...conditions];

export const sizes = [
  '',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'A4',
  'B5',
  '文庫',
  '単行本',
  '小型',
  '中型',
  '大型',
  '24cm',
  '25cm',
  '26cm',
  '27cm',
  'その他',
];

export const colors = [
  '',
  '黒',
  '白',
  'グレー',
  '赤',
  '青',
  '緑',
  '黄',
  'ピンク',
  'オレンジ',
  '紫',
  '茶',
  'ベージュ',
  'シルバー',
  'ゴールド',
  'ネイビー',
  '透明',
  'その他',
];

export const deliveryMethods = [
  '配送のみ',
  '対面受け渡し',
  '対面・配送相談',
  '学内受け渡し',
  '駅周辺で受け渡し',
  '購入後に相談',
];


// 商品一覧検索用の「発送までの日数」候補です。
// 実装上は発送までの日数 shippingDays を目安として使います。
export const deliveryWithinOptions = [
  { value: '', label: '指定なし' },
  { value: 'today', label: '本日中' },
  { value: 'tomorrow', label: '明日中' },
  { value: '3days', label: '3日以内' },
  { value: 'week', label: '1週間以内' },
  { value: 'later', label: 'それ以上' },
];
