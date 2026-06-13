import type { AITextResponse, AuthResponse, ChecklistStatus, Item, Message, PurchaseHistory, User } from '../types';

// import.meta.env.VITE_API_BASE_URL はViteが読み込む環境変数です。
// 未設定ならローカルのGoサーバを使います。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// tokenKey はlocalStorageにJWTを保存するときのキーです。
// 名前を定数化して、保存・取得・削除で文字列のズレが起きないようにします。
const tokenKey = 'hackathon_token';

// setToken はログイン成功時にJWTを保存します。
export function setToken(token: string): void {
  localStorage.setItem(tokenKey, token);
}

// getToken はAPI呼び出し時にJWTを取り出します。
export function getToken(): string | null {
  return localStorage.getItem(tokenKey);
}

// clearToken はログアウト時にJWTを削除します。
export function clearToken(): void {
  localStorage.removeItem(tokenKey);
}

// request はfetchを薄く包んだ共通関数です。
// JSON変換、Authorizationヘッダ、エラー処理を一箇所に集めます。
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  // HeadersInit は Headers / 配列 / オブジェクトの union 型なので、
  // new Headers(...) に正規化してから set すると、どの形式のheadersでも安全に扱えます。
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    // JWTをBearerトークンとして送信し、バックエンドの認証ミドルウェアで検証します。
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error ?? `API error: ${response.status}`;
      throw new Error(message);
    }

    return data as T;
  } catch (error) {
    // 開発中の切り分けをしやすくするため、失敗したURLとAPI_BASE_URLをConsoleに出します。
    console.error('API request failed:', { url, API_BASE_URL, error });
    throw error;
  }
}

// 認証API。
export const authApi = {
  register: (payload: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<User>('/api/me'),
};

// 商品API。
export const itemApi = {
  list: (q: string) => request<Item[]>(`/api/items?q=${encodeURIComponent(q)}`),

  get: (id: number) => request<Item>(`/api/items/${id}`),

  create: (payload: {
    title: string;
    description: string;
    category: string;
    conditionText: string;
    priceYen: number;
    imageUrl: string;
  }) =>
    request<Item>('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: {
    title: string;
    description: string;
    category: string;
    conditionText: string;
    priceYen: number;
    imageUrl: string;
  }) =>
    request<Item>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  cancel: (id: number) =>
    request<Item>(`/api/items/${id}/cancel`, {
      method: 'POST',
    }),

  purchase: (id: number) =>
    request<{ id: number }>(`/api/items/${id}/purchase`, {
      method: 'POST',
    }),

  ask: (id: number, question: string) =>
    request<AITextResponse>(`/api/items/${id}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};

// マイページ系API。
export const meApi = {
  items: () => request<Item[]>('/api/me/items'),

  purchases: () => request<PurchaseHistory[]>('/api/me/purchases'),

  checklist: () => request<Item[]>('/api/me/checklist'),
};

// チェックリストAPI。
export const checklistApi = {
  status: (itemId: number) => request<ChecklistStatus>(`/api/items/${itemId}/checklist`),

  add: (itemId: number) =>
    request<ChecklistStatus>(`/api/items/${itemId}/checklist`, {
      method: 'POST',
    }),

  remove: (itemId: number) =>
    request<ChecklistStatus>(`/api/items/${itemId}/checklist`, {
      method: 'DELETE',
    }),
};

// コメントAPI。
export const messageApi = {
  list: (itemId: number) => request<Message[]>(`/api/items/${itemId}/messages`),

  send: (itemId: number, body: string, parentMessageId?: number) =>
    request<Message>(`/api/items/${itemId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, parentMessageId }),
    }),
};

// AI API。
export const aiApi = {
  generateDescription: (payload: {
    title: string;
    category: string;
    conditionText: string;
    keywords: string;
  }) =>
    request<AITextResponse>('/api/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
