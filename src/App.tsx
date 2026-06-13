import { Link, Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import { ChecklistPage } from './pages/ChecklistPage';
import { CreateItemPage } from './pages/CreateItemPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ItemListPage } from './pages/ItemListPage';
import { LoginPage } from './pages/LoginPage';
import { MyItemsPage } from './pages/MyItemsPage';
import { PurchaseHistoryPage } from './pages/PurchaseHistoryPage';
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
              <Link to="/my/items">出品履歴</Link>
              <Link to="/my/purchases">購入履歴</Link>
              <Link to="/my/checklist">チェックリスト</Link>
              <div className="userArea">
                <span className="userName">{user.name}</span>
                <button onClick={logout}>ログアウト</button>
              </div>
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
          <Route path="/my/items" element={user ? <MyItemsPage /> : <Navigate to="/login" />} />
          <Route path="/my/purchases" element={user ? <PurchaseHistoryPage /> : <Navigate to="/login" />} />
          <Route path="/my/checklist" element={user ? <ChecklistPage /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
        </Routes>
      </main>
    </>
  );
}
