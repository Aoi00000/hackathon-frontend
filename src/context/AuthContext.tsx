/**
 * ファイル概要: hackathon-frontend/src/context/AuthContext.tsx
 *
 * 役割:
 * ログインユーザーとJWTをReact Contextで保持し、アプリ全体から認証状態を参照できるようにします。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { authApi, clearToken, setToken } from '../api/client';
import type { AuthResponse, User } from '../types';

// AuthContextValue は認証状態として画面から使いたい値と関数の型です。
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

// AuthContext はReact全体でログイン状態を共有するための入れ物です。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
const AuthContext = createContext<AuthContextValue | null>(null);

// AuthProvider はアプリ全体を包み、ログイン状態を管理します。
// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function AuthProvider({ children }: { children: ReactNode }) {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [user, setUser] = useState<User | null>(null);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [isLoading, setIsLoading] = useState(true);

  // 画面リロード後もlocalStorage内のJWTからログイン状態を復元します。
  // 【副作用】useEffectは、画面表示後のAPI取得、イベント登録、タイマー管理などReact外部との接続点です。
  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function applyAuthResponse(response: AuthResponse): Promise<void> {
    setToken(response.token);
    setUser(response.user);
  }

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (email: string, password: string) => {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
        const response = await authApi.login({ email, password });
        await applyAuthResponse(response);
      },
      register: async (name: string, email: string, password: string) => {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
        const response = await authApi.register({ name, email, password });
        await applyAuthResponse(response);
      },
      logout: () => {
        clearToken();
        setUser(null);
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth は各画面から認証状態を簡単に使うためのカスタムフックです。
// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function useAuth(): AuthContextValue {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
