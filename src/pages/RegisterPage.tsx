import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

// RegisterPage はユーザー登録画面です。
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      await register(name, email, password);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録に失敗しました');
    }
  }

  return (
    <section className="card narrow">
      <h1>新規登録</h1>

      <form onSubmit={onSubmit} className="form">
        <label>
          表示名
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          メールアドレス
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>

        <label>
          パスワード
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit">登録する</button>
      </form>

      <p>
        既にアカウントがある場合は <Link to="/login">ログイン</Link>
      </p>
    </section>
  );
}
