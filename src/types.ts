// バックエンドAPIのJSONと対応するTypeScript型をまとめます。
// 型を用意すると、画面実装中にプロパティ名の間違いを検出しやすくなります。

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export type ItemStatus = 'available' | 'sold' | 'canceled';

export type Item = {
  id: number;
  sellerId: number;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  conditionText: string;
  priceYen: number;
  imageUrl: string;
  status: ItemStatus;
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

export type PurchaseHistory = {
  purchaseId: number;
  itemId: number;
  sellerId: number;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  conditionText: string;
  priceYen: number;
  imageUrl: string;
  status: ItemStatus;
  purchasedAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type AITextResponse = {
  text: string;
};

export type ChecklistStatus = {
  checked: boolean;
};
