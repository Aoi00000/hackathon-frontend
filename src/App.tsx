/**
 * ファイル概要: hackathon-frontend/src/App.tsx
 *
 * 役割:
 * React Routerによる画面遷移、ヘッダー、未読通知バッジ、認証必須ページの制御を担当します。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
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

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function App() {
  // ログイン中ユーザーとログアウト処理を認証コンテキストから取得します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const { user, logout, isLoading } = useAuth();
  // 画面遷移用の関数です。ログアウト後や通知遷移で利用します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const navigate = useNavigate();
  // 現在URLです。画面遷移時に通知数を再取得するため依存配列に入れます。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const location = useLocation();
  // ヘッダーのベルに表示する未読通知数です。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [notificationCount, setNotificationCount] = useState(0);

  // user が存在すればログイン済みとして扱います。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const isLoggedIn = useMemo(() => Boolean(user), [user]);

  // ログアウト時は、現在ページに残さず商品一覧トップへ戻します。
// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  function logoutAndGoHome() {
    logout();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 【副作用】useEffectは、画面表示後のAPI取得、イベント登録、タイマー管理などReact外部との接続点です。
  useEffect(() => {
    // アンマウント後に setState しないためのフラグです。
// 【詳細コメント】このlet宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    let cancelled = false;

    // 未読通知数だけを軽く取得して、ヘッダーのバッジへ反映します。
    async function loadNotificationCount() {
      if (!user) {
        setNotificationCount(0);
        return;
      }
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
      const list = await meApi.notifications().catch(() => []);
      if (!cancelled) setNotificationCount(list.filter((n) => !n.readAt).length);
    }

    loadNotificationCount();
    window.addEventListener('notifications:changed', loadNotificationCount);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
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
        <Link className="logo" to="/">Regatear</Link>
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
