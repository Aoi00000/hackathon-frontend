/**
 * ファイル概要: hackathon-frontend/src/types.ts
 *
 * 役割:
 * バックエンドAPIと対応するTypeScript型をまとめ、画面間で同じデータ形を共有します。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
/**
 * フロントエンドで使うTypeScript型定義。
 *
 * Goバックエンドの JSON レスポンスと対応します。
 * API項目を変更するときは、バックエンドの models.go とこのファイルを合わせて更新します。
 */
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type User = {
  id: number;
  name: string;
  email: string;
  balanceCoins: number;
  salesCoins: number;
  ratingAverage: number;
  ratingCount: number;
  transactionCount: number;
  shippingRegion: string;
  shippingAddress: string;
  monthlySpendCoins: number;
  totalSpendCoins: number;
  monthlySalesCoins: number;
  totalSalesCoins: number;
  createdAt: string;
};

// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type ItemStatus = 'available' | 'sold' | 'canceled';
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type PurchaseStatus = 'paid' | 'shipped' | 'completed' | 'canceled';

// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type Item = {
  id: number;
  productCode: string;
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
  imageUrl: string;
  status: ItemStatus;
  deliveryMethod: string;
  shippingDays: number;
  shipFromRegion: string;
  size: string;
  color: string;
  tags: string;
  checklistCount: number;
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

// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type Message = {
  id: number;
  itemId: number;
  parentMessageId?: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  body: string;
  isSeller: boolean;
  createdAt: string;
  updatedAt: string;
};

// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type PrivateMessage = {
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

// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type PurchaseHistory = {
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

// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type AuthResponse = { token: string; user: User };
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type AITextResponse = { text: string; notice?: string; usedFallback?: boolean };

// AIChatThread は、AI対話ページ左側に表示する「話題ごとの会話場所」です。
// updatedAt を使って、最近使ったスレッドを上に出します。
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type AIChatThread = {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

// AIChatMessage は、AI対話スレッド内の1つの吹き出しです。
// role によって、ユーザー発言とAI回答の表示スタイルを切り替えます。
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
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
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type AIChatTurnResponse = {
  thread: AIChatThread;
  userMessage: AIChatMessage;
  assistantMessage: AIChatMessage;
};
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type NaturalSearchResponse = {
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
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type ItemAIAnalysis = {
  riskPoints: string[];
  suggestedQuestions: string[];
  inconsistencies: string[];
  priceInsight: string;
  categoryReviewHints: string[];
};
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type CategoryKnowledge = { category: string; tips: string[] };
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type RecommendationResponse = { reason: string; items: Item[] | null };
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type ChecklistStatus = { checked: boolean };
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type Notification = { id: number; userId: number; itemId?: number; title: string; body: string; readAt?: string; createdAt: string };
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type SavedSearch = { id: number; userId: number; name: string; queryJson: string; createdAt: string };
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type BlockedUser = { id: number; blockerId: number; blockedId: number; blockedName: string; createdAt: string };
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type SupportMessage = { id: number; userId: number; userName: string; subject: string; body: string; createdAt: string };

// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export type MonthlyMoneySummary = { month: string; salesYen: number; spendYen: number };
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
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
