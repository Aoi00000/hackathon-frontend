import { Link, Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import { CreateItemPage } from './pages/CreateItemPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ItemListPage } from './pages/ItemListPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// App は画面遷移と共通ヘッダを定義します。
export function App() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <main className="container">読み込み中...</main>;
  }

  return (
    <>
      <header className="header">
        <Link className="logo" to="/">
          AI Flea Market
        </Link>

        <nav className="nav">
          <Link to="/">商品一覧</Link>
          {user ? (
            <>
              <Link to="/items/new">出品する</Link>
              <span>{user.name}</span>
              <button onClick={logout}>ログアウト</button>
            </>
          ) : (
            <>
              <Link to="/login">ログイン</Link>
              <Link to="/register">新規登録</Link>
            </>
          )}
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<ItemListPage />} />
          <Route path="/items/new" element={user ? <CreateItemPage /> : <Navigate to="/login" />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
        </Routes>
      </main>
    </>
  );
}
