/**
 * ファイル概要: hackathon-frontend/src/types.ts
 *
 * 役割:
 * バックエンドAPIと対応するTypeScript型をまとめ、画面間で同じデータ形を共有します。
 *
 */

/**
 * 実装詳細メモ:
 * Goのmodels.goで返すJSONをTypeScript側で表現する契約です。
 * フィールド名を変えるとAPI、画面、保存検索、AIレスポンスの全てに影響するため、型は画面実装の地図として使います。
 */
/**
 * フロントエンドで使うTypeScript型定義。
 *
 * Goバックエンドの JSON レスポンスと対応します。
 * API項目を変更するときは、バックエンドの models.go とこのファイルを合わせて更新します。
 */
export type User = {
  // id/name/email は認証とヘッダー表示の基本情報です。
  id: number;
  name: string;
  email: string;
  // balanceCoins は購入に使える残高、salesCoins は受取完了後に出品者へ入る売上金です。
  balanceCoins: number;
  salesCoins: number;
  // 評価系の値は購入完了時のratingからバックエンドで集計され、出品者の信頼指標として商品カードにも出ます。
  ratingAverage: number;
  ratingCount: number;
  transactionCount: number;
  // 配送先・発送元の初期値として、マイページ、出品画面、購入画面で共有します。
  shippingRegion: string;
  shippingAddress: string;
  // マイページのウォレットカードで使う月次/累計の購入額・売上額です。
  monthlySpendCoins: number;
  totalSpendCoins: number;
  monthlySalesCoins: number;
  totalSalesCoins: number;
  createdAt: string;
};

// ItemStatus は、商品そのものの販売状態を表す文字列リテラル型です。
// available は購入可能、sold は購入済み、canceled は出品者が取り下げた状態として画面表示とAPI条件に使います。
export type ItemStatus = 'available' | 'sold' | 'canceled';

// PurchaseStatus は、購入後の取引進行状態を表す型です。
// 商品ステータスとは別に、支払い済み、発送済み、取引完了、キャンセルを追跡します。
export type PurchaseStatus = 'paid' | 'shipped' | 'completed' | 'canceled';

// Item は、商品一覧・商品詳細・出品履歴で共通して使う商品データ型です。
// 商品本体の情報に加えて、出品者評価や購入状態も含め、画面が追加APIなしで主要情報を表示できるようにしています。
export type Item = {
  // productCode はユーザーに見せる商品番号、id はAPIパスやDB JOINで使う内部IDです。
  id: number;
  productCode: string;
  // 出品者の評価情報を商品レスポンスへ含め、詳細画面で別APIを呼ばずに信頼情報を表示します。
  sellerId: number;
  sellerName: string;
  sellerRatingAverage: number;
  sellerRatingCount: number;
  sellerTransactionCount: number;
  title: string;
  description: string;
  category: string;
  conditionText: string;
  priceYen: number;
  // imageUrl は旧名ですが、現在は単一URL、複数画像JSON、動画Data URLのいずれも入り得ます。
  imageUrl: string;
  status: ItemStatus;
  // 配送/受け渡し条件は購入前の不安解消と、AI商品分析の材料になります。
  deliveryMethod: string;
  shippingDays: number;
  shipFromRegion: string;
  size: string;
  color: string;
  tags: string;
  checklistCount: number;
  // 購入済み商品の詳細や出品履歴では、購入者・取引状態も同じItem型で返します。
  buyerId?: number;
  buyerName?: string;
  buyerShippingAddress?: string;
  purchaseId?: number;
  purchaseStatus?: PurchaseStatus;
  purchaseCreatedAt?: string;
  shippingDeadline?: string;
  shippedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// Message は、商品詳細ページの公開コメント1件を表す型です。
// parentMessageIdがある場合は返信として扱い、ItemDetailPageで親コメントごとのスレッドへ組み直します。
export type Message = {
  // parentMessageId がある場合は返信です。画面側で親コメントごとのスレッドに組み直します。
  id: number;
  itemId: number;
  parentMessageId?: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  body: string;
  // isSeller により、出品者コメントを視覚的に強調できます。
  isSeller: boolean;
  createdAt: string;
  updatedAt: string;
};

// PrivateMessage は、出品者と購入検討者だけが読める非公開DM1件を表します。
// 公開コメントと似た形ですが、公開範囲が異なるため別型にし、誤って公開コメント欄へ混ぜないようにします。
export type PrivateMessage = {
  // 非公開DMは公開コメントと別テーブルですが、画面では同じスレッド構造で扱います。
  id: number;
  itemId: number;
  parentMessageId?: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  body: string;
  createdAt: string;
};

// PurchaseHistory は、購入履歴ページで使う「商品情報 + 取引情報」を合わせた型です。
// 受け取り評価や発送期限など、購入後の進行に必要な情報を1行にまとめています。
export type PurchaseHistory = {
  // purchaseId は取引操作、itemId は商品詳細遷移に使うため両方保持します。
  purchaseId: number;
  itemId: number;
  productCode: string;
  sellerId: number;
  sellerName: string;
  sellerRatingAverage: number;
  sellerRatingCount: number;
  title: string;
  description: string;
  category: string;
  conditionText: string;
  priceYen: number;
  imageUrl: string;
  status: ItemStatus;
  purchaseStatus: PurchaseStatus;
  // 購入時点の配送先と発送期限を残すことで、後からプロフィールを変えても当該取引の情報を確認できます。
  deliveryMethod: string;
  shippingDays: number;
  shipFromRegion: string;
  deliveryAddress: string;
  purchasedAt: string;
  shippingDeadline: string;
  shippedAt?: string;
  completedAt?: string;
  rating?: number;
  ratingComment?: string;
};

// AuthResponse は、ログイン/新規登録APIが返すJWTとユーザー情報の組です。
// tokenは以後の認証付きAPIへ、userはヘッダーやマイページ初期表示へ使います。
export type AuthResponse = { token: string; user: User };

// AITextResponse は、AI生成系APIが返す本文と補足情報の共通形です。
// usedFallbackやnoticeにより、外部AIではなくローカル生成へ切り替わったことを画面で説明できます。
export type AITextResponse = { text: string; notice?: string; usedFallback?: boolean };

// AIChatThread は、AI対話ページ左側に表示する「話題ごとの会話場所」です。
// updatedAt を使って、最近使ったスレッドを上に出します。
export type AIChatThread = {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

// AIChatMessage は、AI対話スレッド内の1つの吹き出しです。
// role によって、ユーザー発言とAI回答の表示スタイルを切り替えます。
export type AIChatMessage = {
  id: number;
  threadId: number;
  role: 'user' | 'assistant';
  body: string;
  notice?: string;
  usedFallback: boolean;
  createdAt: string;
};

// AIChatTurnResponse は、1回の送信で保存されたユーザー発言とAI回答をまとめたものです。
export type AIChatTurnResponse = {
  thread: AIChatThread;
  userMessage: AIChatMessage;
  assistantMessage: AIChatMessage;
};

// NaturalSearchResponse は、自然言語検索を通常の商品検索条件へ変換した結果です。
// ItemSearchParamsに近い形にしておくことで、AI検索後も既存の一覧APIとフォーム状態を再利用できます。
export type NaturalSearchResponse = {
  // AIまたはローカル規則が自然文を既存の商品検索パラメータへ変換した結果です。
  // ItemListPageはこの型をそのままItemSearchParamsへ流し込み、通常検索APIを再利用します。
  q?: string;
  category?: string;
  size?: string;
  color?: string;
  condition?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  tag?: string;
  deliveryWithin?: string;
  sort?: string;
  explanation?: string;
  notice?: string;
  usedFallback?: boolean;
};

// ItemAIAnalysis は、商品詳細の購入前AIチェックで表示する分析結果です。
// リスク、質問候補、不整合、価格感、カテゴリ固有ヒントを分け、購入者が確認すべき観点を整理します。
export type ItemAIAnalysis = {
  // 商品詳細のAI購入前チェックで使う観点です。
  // リスク、質問候補、不整合、価格感、カテゴリ固有の確認ポイントを分けて表示します。
  riskPoints: string[];
  suggestedQuestions: string[];
  inconsistencies: string[];
  priceInsight: string;
  categoryReviewHints: string[];
};

// CategoryKnowledge は、カテゴリ名と、そのカテゴリで購入者が見がちな確認ポイントの組です。
// 出品フォームの説明補助や商品分析で「このカテゴリなら何を書くべきか」を表示します。
export type CategoryKnowledge = { category: string; tips: string[] };

// RecommendationResponse は、MerRec風おすすめの説明文と商品一覧をまとめたレスポンスです。
// itemsはバックエンド事情でnullになり得るため、api/client.tsで配列へ正規化してから画面へ渡します。
export type RecommendationResponse = { reason: string; items: Item[] | null };

// ChecklistStatus は、ある商品が現在ユーザーのチェックリストに入っているかを表します。
// 商品詳細ページのハートボタンの初期状態と切り替え結果に使います。
export type ChecklistStatus = { checked: boolean };

// Notification は、取引、コメント、AI販売改善、支払い方法などから発生する通知1件です。
// itemIdがある通知は商品詳細へ、ない通知はマイページ系画面へ遷移する判断材料になります。
export type Notification = { id: number; userId: number; itemId?: number; title: string; body: string; readAt?: string; createdAt: string };

// SavedSearch は、商品一覧で保存した検索条件です。
// queryJsonにItemSearchParams相当の条件を保存し、あとから同じ検索を復元できます。
export type SavedSearch = { id: number; userId: number; name: string; queryJson: string; createdAt: string };

// BlockedUser は、ログインユーザーがブロックしている相手の情報です。
// 商品一覧や購入・コメント処理では、この関係を使って不快な相手との取引を避けます。
export type BlockedUser = { id: number; blockerId: number; blockedId: number; blockedName: string; createdAt: string };

// SupportMessage は、ユーザーから運営へ送る問い合わせDMの1件です。
// subjectで話題ごとにまとめ、MyPageでスレッド風に表示します。
export type SupportMessage = { id: number; userId: number; userName: string; subject: string; body: string; createdAt: string };

// MonthlyMoneySummary は、月別の売上額と利用額をグラフ表示するための集計行です。
// monthはYYYY-MM形式で、MyPageでは短い月ラベルに変換して表示します。
export type MonthlyMoneySummary = { month: string; salesYen: number; spendYen: number };

// PaymentMethod は、マイページの支払い方法一覧で表示する安全化済みカード情報です。
// cardLast4だけを持ち、カード番号全体やセキュリティコードは画面に戻さない前提にしています。
export type PaymentMethod = {
  id: number;
  userId: number;
  label: string;
  cardLast4: string;
  holderName: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: string;
};
