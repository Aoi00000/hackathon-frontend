/**
 * ファイル概要: hackathon-frontend/src/pages/LoginPage.tsx
 *
 * 役割:
 * メールアドレスとパスワードでログインし、JWTを保存する画面です。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

// LoginPage はログイン画面です。
// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function LoginPage() {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const { login } = useAuth();
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const navigate = useNavigate();

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [email, setEmail] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [password, setPassword] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
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
