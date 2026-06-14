import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { meApi } from './api/client';
import { useAuth } from './context/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import { useI18n } from './i18n';
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
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);
  const { lang, setLang, t } = useI18n();

  const isLoggedIn = useMemo(() => Boolean(user), [user]);

  function logoutAndGoHome() {
    logout();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    let cancelled = false;
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
    return () => { cancelled = true; window.removeEventListener('notifications:changed', loadNotificationCount); window.clearInterval(timer); };
  }, [user?.id, location.pathname]);

  if (isLoading) return <main className="container">{t('loading')}</main>;

  return (
    <>
      <header className="header">
        <Link className="logo" to="/">AI Flea Market</Link>
        <nav className="nav">
          <Link to="/">{t('items')}</Link>
          {isLoggedIn ? (
            <>
              <Link to="/items/new">{t('sell')}</Link>
              <Link to="/my/items">{t('myItems')}</Link>
              <Link to="/my/purchases">{t('purchases')}</Link>
              <Link to="/my/checklist">{t('checklist')}</Link>
              <Link className="notificationNav" to="/my/notifications" aria-label={`通知 ${notificationCount}件`}>
                <span className="bellIcon">🔔</span>
                {t('notifications')}
                {notificationCount > 0 && <span className="notificationBadge">{notificationCount}</span>}
              </Link>
              <Link to="/my">{t('myPage')}</Link>
              <select className="languageSelect" value={lang} onChange={(e) => setLang(e.target.value as 'ja' | 'en')} aria-label="表示言語">
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
              <div className="userArea">
                <span className="userName">{user?.name}</span>
                <button onClick={logoutAndGoHome}>{t('logout')}</button>
              </div>
            </>
          ) : (
            <>
              <select className="languageSelect" value={lang} onChange={(e) => setLang(e.target.value as 'ja' | 'en')} aria-label="表示言語">
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
              <Link className="navButton loginButton" to="/login">{t('login')}</Link>
              <Link className="navButton registerButton" to="/register">{t('register')}</Link>
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
