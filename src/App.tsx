import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { meApi } from './api/client';
import { useAuth } from './context/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import { AIChatPage } from './pages/AIChatPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { CreateItemPage } from './pages/CreateItemPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ItemListPage } from './pages/ItemListPage';
import { LoginPage } from './pages/LoginPage';
import { MyItemsPage } from './pages/MyItemsPage';
import { MyPage } from './pages/MyPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PurchaseFlowPage } from './pages/PurchaseFlowPage';
import { PurchaseHistoryPage } from './pages/PurchaseHistoryPage';
import { RegisterPage } from './pages/RegisterPage';

export function App() {
  // ログイン中ユーザーとログアウト処理を認証コンテキストから取得します。
  const { user, logout, isLoading } = useAuth();
  // 画面遷移用の関数です。ログアウト後や通知遷移で利用します。
  const navigate = useNavigate();
  // 現在URLです。画面遷移時に通知数を再取得するため依存配列に入れます。
  const location = useLocation();
  // ヘッダーのベルに表示する未読通知数です。
  const [notificationCount, setNotificationCount] = useState(0);

  // user が存在すればログイン済みとして扱います。
  const isLoggedIn = useMemo(() => Boolean(user), [user]);

  // ログアウト時は、現在ページに残さず商品一覧トップへ戻します。
  function logoutAndGoHome() {
    logout();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    // アンマウント後に setState しないためのフラグです。
    let cancelled = false;

    // 未読通知数だけを軽く取得して、ヘッダーのバッジへ反映します。
    async function loadNotificationCount() {
      if (!user) {
        setNotificationCount(0);
        return;
      }
      const list = await meApi.notifications().catch(() => []);
      if (!cancelled) setNotificationCount(list.filter((n) => !n.readAt).length);
    }

    loadNotificationCount();
    window.addEventListener('notifications:changed', loadNotificationCount);
    const timer = window.setInterval(loadNotificationCount, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener('notifications:changed', loadNotificationCount);
      window.clearInterval(timer);
    };
  }, [user?.id, location.pathname]);

  if (isLoading) return <main className="container">読み込み中...</main>;

  return (
    <>
      <header className="header">
        <Link className="logo" to="/">AI Flea Market</Link>
        <nav className="nav">
          <Link to="/">商品一覧</Link>
          {isLoggedIn ? (
            <>
              <Link to="/items/new">出品する</Link>
              <Link to="/my/items">出品履歴</Link>
              <Link to="/ai-chat">AI対話</Link>
              <Link to="/my/purchases">購入履歴</Link>
              <Link to="/my/checklist">チェックリスト</Link>
              <Link className="notificationNav" to="/my/notifications" aria-label={`通知 ${notificationCount}件`}>
                <span className="bellIcon">🔔</span>
                通知
                {notificationCount > 0 && <span className="notificationBadge">{notificationCount}</span>}
              </Link>
              <Link to="/my">マイページ</Link>
              <div className="userArea">
                <span className="userName">{user?.name}</span>
                <button onClick={logoutAndGoHome}>ログアウト</button>
              </div>
            </>
          ) : (
            <>
              <Link className="navButton loginButton" to="/login">ログイン</Link>
              <Link className="navButton registerButton" to="/register">新規登録</Link>
            </>
          )}
        </nav>
      </header>

      <main className="container">
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<ItemListPage />} />
            <Route path="/items/new" element={user ? <CreateItemPage /> : <Navigate to="/login" />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/items/:id/purchase" element={user ? <PurchaseFlowPage /> : <Navigate to="/login" />} />
            <Route path="/my/items" element={user ? <MyItemsPage /> : <Navigate to="/login" />} />
            <Route path="/ai-chat" element={user ? <AIChatPage /> : <Navigate to="/login" />} />
            <Route path="/my/purchases" element={user ? <PurchaseHistoryPage /> : <Navigate to="/login" />} />
            <Route path="/my/checklist" element={user ? <ChecklistPage /> : <Navigate to="/login" />} />
            <Route path="/my/notifications" element={user ? <NotificationsPage /> : <Navigate to="/login" />} />
            <Route path="/my" element={user ? <MyPage /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </>
  );
}
