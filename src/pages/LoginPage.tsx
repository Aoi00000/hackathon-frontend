/**
 * ファイル概要: hackathon-frontend/src/pages/LoginPage.tsx
 *
 * 役割:
 * メールアドレスとパスワードでログインし、JWTを保存する画面です。
 *
 */

/**
 * 実装詳細メモ:
 * ログイン成功時にJWTとユーザー情報をAuthContextへ保存し、以降のAPI呼び出しにAuthorizationヘッダーを付けられる状態にします。
 * エラーはフォーム内に閉じて表示し、認証失敗と通信失敗をユーザーが区別できるようにします。
 */
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

// LoginPage はログイン画面です。
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ログインに失敗しました');
    }
  }

  return (
    <section className="card narrow">
      <h1>ログイン</h1>

      <form onSubmit={onSubmit} className="form">
        <label>
          メールアドレス
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>

        <label>
          パスワード
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit">ログイン</button>
      </form>

      <p>
        アカウントがない場合は <Link to="/register">新規登録</Link>
      </p>
    </section>
  );
}
