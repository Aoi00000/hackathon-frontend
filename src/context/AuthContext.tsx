import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { authApi, clearToken, setToken } from '../api/client';
import type { AuthResponse, User } from '../types';

// AuthContextValue は認証状態として画面から使いたい値と関数の型です。
type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

// AuthContext はReact全体でログイン状態を共有するための入れ物です。
const AuthContext = createContext<AuthContextValue | null>(null);

// AuthProvider はアプリ全体を包み、ログイン状態を管理します。
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 画面リロード後もlocalStorage内のJWTからログイン状態を復元します。
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        await applyAuthResponse(response);
      },
      register: async (name: string, email: string, password: string) => {
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
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
