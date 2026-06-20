/**
 * ファイル概要: hackathon-frontend/src/api/client.ts
 *
 * 役割:
 * フロントエンドからバックエンドAPIへアクセスする関数を集約し、認証ヘッダーやエラー処理を共通化します。
 *
 */

/**
 * 実装詳細メモ:
 * fetchの共通処理でAPIベースURL、JSON化、認証ヘッダー、エラー文の抽出をまとめます。
 * Goのnil sliceがJSON nullになる場合があるため、一覧系レスポンスはasArrayで必ず配列に正規化します。
 */
/**
 * フロントエンドのAPIクライアント。
 *
 * 画面ごとにfetchを書くと、認証ヘッダー、JSON変換、エラー処理、null配列対策が重複します。
 * そこで、このファイルにAPI呼び出しを集約し、各ページは itemApi / meApi / aiApi などの
 * 意味のある関数を呼ぶだけで済むようにしています。
 *
 * Goのnil sliceはJSONではnullになることがあるため、一覧系APIでは asArray で必ず配列へ正規化します。
 */
import type { AIChatMessage, AIChatThread, AIChatTurnResponse, AITextResponse, AuthResponse, BlockedUser, CategoryKnowledge, ChecklistStatus, Item, ItemAIAnalysis, Message, NaturalSearchResponse, Notification, PrivateMessage, PurchaseHistory, RecommendationResponse, SavedSearch, SupportMessage, User, MonthlyMoneySummary, PaymentMethod } from '../types';

// API_BASE_URL は、ReactアプリがGoバックエンドへアクセスするときの接続先です。
// Viteの環境変数がある本番/デプロイ環境ではそれを使い、未設定のローカル開発では8080番のGoサーバーへ接続します。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// tokenKey は、ブラウザのsessionStorageへJWTを保存するときのキー名です。
// setToken/getToken/clearTokenが同じ文字列を使うことで、ログイン状態の保存場所をこの1箇所で管理できます。
const tokenKey = 'hackathon_token';

// Goのjsonエンコードではnil sliceがnullとして返ることがあります。
// React側では一覧を常にmap/filterできる配列として扱いたいので、API境界で吸収します。
function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

// 認証トークンは、古い実装では localStorage に保存していました。
// そのため、以前のテストで作った user1 のJWTが残っていると、
// ブラウザを開いた直後に user1 として自動ログインしてしまいます。
// 今回は sessionStorage に変更し、ブラウザセッションを閉じればログイン状態が残らないようにします。
// さらに、初回読み込み時に古い localStorage のトークンを削除します。
if (localStorage.getItem(tokenKey)) {
  localStorage.removeItem(tokenKey);
}
// setToken は、ログイン成功時に受け取ったJWTを現在のブラウザセッションへ保存します。
// このJWTはrequest関数でAuthorizationヘッダーに入り、本人確認が必要なAPIで使われます。
export function setToken(token: string): void { sessionStorage.setItem(tokenKey, token); }

// getToken は、保存済みJWTを取り出す小さな関数です。
// トークンがなければnullを返し、request関数はAuthorizationヘッダーを付けずに公開APIとして呼び出します。
export function getToken(): string | null { return sessionStorage.getItem(tokenKey); }

// clearToken は、ログアウト時や認証状態を初期化したいときにJWTを削除します。
// 旧実装のlocalStorageにも残骸がある可能性があるため、sessionStorageとlocalStorageの両方を消します。
export function clearToken(): void { sessionStorage.removeItem(tokenKey); localStorage.removeItem(tokenKey); }

// request はこのフロントエンドからバックエンドへ出る全HTTP通信の共通入口です。
// 認証ヘッダー付与、JSONレスポンスの読み取り、Go側の {error: "..."} 形式の取り出しをここに集約します。
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? `API error: ${response.status}`);
    return data as T;
  } catch (error) {
    console.error('API request failed:', { url, API_BASE_URL, error });
    throw error;
  }
}

// authApi はログイン状態の作成・更新に関わるAPI群です。
// 成功時に返るJWTはAuthContextで保存され、以降の本人APIや購入APIの認証に使われます。
export const authApi = {
  register: (payload: { name: string; email: string; password: string }) => request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) => request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<User>('/api/me'),
  updateMe: (payload: { shippingRegion: string; shippingAddress: string }) => request<User>('/api/me', { method: 'PUT', body: JSON.stringify(payload) }),
  charge: (amount: number) => request<User>('/api/me/charge', { method: 'POST', body: JSON.stringify({ amount }) }),
};

// ItemSearchParams は商品一覧APIのクエリ文字列と1対1で対応します。
// 複数選択のcategory/size/colorなどは、URLSearchParamsへ入れやすいようカンマ区切り文字列にします。
export type ItemSearchParams = {
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
};

// 空文字の条件は検索クエリへ入れません。
// これにより、未指定フィルタがバックエンドで「空文字に一致」と解釈される事故を防ぎます。
function toQuery(params: ItemSearchParams): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
  const query = sp.toString();
  return query ? `?${query}` : '';
}

// itemApi は商品を中心とする公開/取引APIです。
// 一覧・詳細は未ログインでも使え、出品・購入・発送・完了・交渉支援はJWTを必要とします。
export const itemApi = {
  list: async (params: ItemSearchParams) => asArray(await request<Item[]>(`/api/items${toQuery(params)}`)),
  get: (id: number) => request<Item>(`/api/items/${id}`),
  create: (payload: Partial<Item> & { title: string; description: string; category: string; conditionText: string; priceYen: number; imageUrl: string }) => request<Item>('/api/items', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<Item> & { title: string; description: string; category: string; conditionText: string; priceYen: number; imageUrl: string }) => request<Item>(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  cancel: (id: number) => request<Item>(`/api/items/${id}/cancel`, { method: 'POST' }),
  purchase: (id: number, deliveryAddress: string) => request<{ id: number }>(`/api/items/${id}/purchase`, { method: 'POST', body: JSON.stringify({ deliveryAddress }) }),
  ship: (id: number) => request<{ id: number }>(`/api/items/${id}/ship`, { method: 'POST' }),
  complete: (id: number, rating: number, ratingComment: string) => request<{ id: number }>(`/api/items/${id}/complete`, { method: 'POST', body: JSON.stringify({ rating, ratingComment }) }),
  ask: (id: number, question: string) => request<AITextResponse>(`/api/items/${id}/ask`, { method: 'POST', body: JSON.stringify({ question }) }),
  // 価格交渉アシスタントです。商品詳細ページで希望金額を入力すると、
  // 現在ログイン中のユーザーが出品者か購入検討者かをバックエンド側で判定し、立場に合う文面を返します。
  negotiationAssist: (id: number, desiredPriceYen: number) => request<AITextResponse>(`/api/items/${id}/negotiation-assist`, { method: 'POST', body: JSON.stringify({ desiredPriceYen }) }),
  analysis: (id: number) => request<ItemAIAnalysis>(`/api/items/${id}/analysis`),
};

// meApi はログインユーザー本人に紐づくマイページ系APIです。
// 残高、出品履歴、購入履歴、通知、保存検索、支払い方法など、userIdをURLに出さない安全な設計にしています。
export const meApi = {
  items: async () => asArray(await request<Item[]>('/api/me/items')),
  purchases: async () => asArray(await request<PurchaseHistory[]>('/api/me/purchases')),
  checklist: async () => asArray(await request<Item[]>('/api/me/checklist')),
  notifications: async () => asArray(await request<Notification[]>('/api/me/notifications')),
  readNotification: (id: number) => request<Notification>(`/api/me/notifications/${id}/read`, { method: 'POST' }),
  savedSearches: async () => asArray(await request<SavedSearch[]>('/api/me/saved-searches')),
  saveSearch: (name: string, queryJson: string) => request<SavedSearch>('/api/me/saved-searches', { method: 'POST', body: JSON.stringify({ name, queryJson }) }),
  deleteSavedSearch: (id: number) => request<{ ok: boolean }>(`/api/me/saved-searches/${id}`, { method: 'DELETE' }),
  blocks: async () => asArray(await request<BlockedUser[]>('/api/me/blocks')),
  block: (userId: number) => request<{ ok: boolean }>('/api/me/blocks', { method: 'POST', body: JSON.stringify({ userId }) }),
  unblock: (userId: number) => request<{ ok: boolean }>(`/api/me/blocks/${userId}`, { method: 'DELETE' }),
  supportMessages: async () => asArray(await request<SupportMessage[]>('/api/me/support-messages')),
  support: (subject: string, body: string) => request<SupportMessage>('/api/me/support-messages', { method: 'POST', body: JSON.stringify({ subject, body }) }),
  monthlyMoneySummary: async () => asArray(await request<MonthlyMoneySummary[]>('/api/me/monthly-money-summary')),
  paymentMethods: async () => asArray(await request<PaymentMethod[]>('/api/me/payment-methods')),
  createPaymentMethod: (payload: { label: string; cardNumber: string; holderName: string; expiryMonth: number; expiryYear: number; securityCode: string; isDefault: boolean }) => request<PaymentMethod>('/api/me/payment-methods', { method: 'POST', body: JSON.stringify(payload) }),
  setDefaultPaymentMethod: (id: number) => request<{ ok: boolean }>(`/api/me/payment-methods/${id}/default`, { method: 'POST' }),
  deletePaymentMethod: (id: number) => request<{ ok: boolean }>(`/api/me/payment-methods/${id}`, { method: 'DELETE' }),
  // API側でおすすめ対象が0件の場合、Goのnil sliceがJSON nullになることがあります。
  // そのままReact側で .length や .map を呼ぶと画面全体が落ちるため、
  // ここで必ず items を配列へ正規化します。
  recommendations: async () => {
    const data = await request<RecommendationResponse>('/api/me/recommendations');
    return {
      reason: data?.reason ?? '現在表示できるおすすめ商品はありません。',
      items: asArray(data?.items),
    };
  },
};

// checklistApi は商品詳細の「気になる」状態を読み書きする小さなAPI群です。
// 一覧取得はmeApi.checklist、単一商品の状態確認と追加/削除はこちらに分けています。
export const checklistApi = {
  status: (itemId: number) => request<ChecklistStatus>(`/api/items/${itemId}/checklist`),
  add: (itemId: number) => request<ChecklistStatus>(`/api/items/${itemId}/checklist`, { method: 'POST' }),
  remove: (itemId: number) => request<ChecklistStatus>(`/api/items/${itemId}/checklist`, { method: 'DELETE' }),
};

// messageApi は公開コメントと非公開DMを扱います。
// parentMessageIdを送ると返信になり、receiverIdを送ると購入検討者と出品者のDM相手を明示できます。
export const messageApi = {
  list: async (itemId: number) => asArray(await request<Message[]>(`/api/items/${itemId}/messages`)),
  send: (itemId: number, body: string, parentMessageId?: number) => request<Message>(`/api/items/${itemId}/messages`, { method: 'POST', body: JSON.stringify({ body, parentMessageId }) }),
  delete: (itemId: number, messageId: number) => request<{ ok: boolean }>(`/api/items/${itemId}/messages/${messageId}`, { method: 'DELETE' }),
  listPrivate: async (itemId: number) => asArray(await request<PrivateMessage[]>(`/api/items/${itemId}/private-messages`)),
  sendPrivate: (itemId: number, body: string, receiverId?: number, parentMessageId?: number) => request<PrivateMessage>(`/api/items/${itemId}/private-messages`, { method: 'POST', body: JSON.stringify({ body, receiverId, parentMessageId }) }),
};

// aiApi は商品説明生成、カテゴリ知識、自然言語検索、AIチャットを束ねます。
// 外部AI失敗時のnotice/usedFallbackはAITextResponseやAIChatMessageに残り、画面で利用者へ説明できます。
export const aiApi = {
  generateDescription: (payload: { title: string; category: string; conditionText: string; keywords: string }) => request<AITextResponse>('/api/ai/generate-description', { method: 'POST', body: JSON.stringify(payload) }),
  categoryKnowledge: (category: string) => request<CategoryKnowledge>(`/api/ai/category-knowledge?category=${encodeURIComponent(category)}`),
  parseSearch: (query: string) => request<NaturalSearchResponse>('/api/ai/parse-search', { method: 'POST', body: JSON.stringify({ query }) }),
  // chat は古い単発AI対話APIとの互換用です。
  // 現在のAI対話ページでは、下の thread 系APIを使ってDBに履歴を保存します。
  chat: (message: string) => request<AITextResponse>('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  // ログインユーザー本人のAI対話スレッド一覧を取得します。
  chatThreads: async () => asArray(await request<AIChatThread[]>('/api/me/ai-chat-threads')),
  // 新しい話題を始めるための空スレッドを作成します。
  createChatThread: (title: string) => request<AIChatThread>('/api/me/ai-chat-threads', { method: 'POST', body: JSON.stringify({ title }) }),
  // 不要なAI対話スレッドを削除します。メッセージはDBのCASCADEで一緒に消えます。
  deleteChatThread: (threadId: number) => request<{ ok: boolean }>(`/api/me/ai-chat-threads/${threadId}`, { method: 'DELETE' }),
  // 選択中スレッドのメッセージ履歴を取得します。
  chatMessages: async (threadId: number) => asArray(await request<AIChatMessage[]>(`/api/me/ai-chat-threads/${threadId}/messages`)),
  // ユーザー発言を保存し、AI回答も保存して1往復分を返します。
  sendChatMessage: (threadId: number, message: string) => request<AIChatTurnResponse>(`/api/me/ai-chat-threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
};
