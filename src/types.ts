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
  createdAt: string;
};

export type ItemStatus = 'available' | 'sold' | 'canceled';
export type PurchaseStatus = 'paid' | 'shipped' | 'completed' | 'canceled';

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

export type AuthResponse = { token: string; user: User };
export type AITextResponse = { text: string };
export type ItemAIAnalysis = {
  riskPoints: string[];
  suggestedQuestions: string[];
  inconsistencies: string[];
  priceInsight: string;
  categoryReviewHints: string[];
};
export type CategoryKnowledge = { category: string; tips: string[] };
export type RecommendationResponse = { reason: string; items: Item[] | null };
export type ChecklistStatus = { checked: boolean };
export type Notification = { id: number; userId: number; itemId?: number; title: string; body: string; readAt?: string; createdAt: string };
export type SavedSearch = { id: number; userId: number; name: string; queryJson: string; createdAt: string };
export type BlockedUser = { id: number; blockerId: number; blockedId: number; blockedName: string; createdAt: string };
export type SupportMessage = { id: number; userId: number; userName: string; subject: string; body: string; createdAt: string };
