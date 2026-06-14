import type { AITextResponse, AuthResponse, BlockedUser, CategoryKnowledge, ChecklistStatus, Item, ItemAIAnalysis, Message, Notification, PrivateMessage, PurchaseHistory, RecommendationResponse, SavedSearch, SupportMessage, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const tokenKey = 'hackathon_token';

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

export function setToken(token: string): void { sessionStorage.setItem(tokenKey, token); }
export function getToken(): string | null { return sessionStorage.getItem(tokenKey); }
export function clearToken(): void { sessionStorage.removeItem(tokenKey); localStorage.removeItem(tokenKey); }

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

export const authApi = {
  register: (payload: { name: string; email: string; password: string }) => request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) => request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<User>('/api/me'),
  updateMe: (payload: { shippingRegion: string; shippingAddress: string }) => request<User>('/api/me', { method: 'PUT', body: JSON.stringify(payload) }),
  charge: (amount: number) => request<User>('/api/me/charge', { method: 'POST', body: JSON.stringify({ amount }) }),
};

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
function toQuery(params: ItemSearchParams): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
  const query = sp.toString();
  return query ? `?${query}` : '';
}

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
  analysis: (id: number) => request<ItemAIAnalysis>(`/api/items/${id}/analysis`),
};

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

export const checklistApi = {
  status: (itemId: number) => request<ChecklistStatus>(`/api/items/${itemId}/checklist`),
  add: (itemId: number) => request<ChecklistStatus>(`/api/items/${itemId}/checklist`, { method: 'POST' }),
  remove: (itemId: number) => request<ChecklistStatus>(`/api/items/${itemId}/checklist`, { method: 'DELETE' }),
};

export const messageApi = {
  list: async (itemId: number) => asArray(await request<Message[]>(`/api/items/${itemId}/messages`)),
  send: (itemId: number, body: string, parentMessageId?: number) => request<Message>(`/api/items/${itemId}/messages`, { method: 'POST', body: JSON.stringify({ body, parentMessageId }) }),
  listPrivate: async (itemId: number) => asArray(await request<PrivateMessage[]>(`/api/items/${itemId}/private-messages`)),
  sendPrivate: (itemId: number, body: string, receiverId?: number, parentMessageId?: number) => request<PrivateMessage>(`/api/items/${itemId}/private-messages`, { method: 'POST', body: JSON.stringify({ body, receiverId, parentMessageId }) }),
};

export const aiApi = {
  generateDescription: (payload: { title: string; category: string; conditionText: string; keywords: string }) => request<AITextResponse>('/api/ai/generate-description', { method: 'POST', body: JSON.stringify(payload) }),
  translate: (text: string) => request<AITextResponse>('/api/ai/translate', { method: 'POST', body: JSON.stringify({ text }) }),
  categoryKnowledge: (category: string) => request<CategoryKnowledge>(`/api/ai/category-knowledge?category=${encodeURIComponent(category)}`),
};
