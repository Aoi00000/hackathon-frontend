import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { meApi } from '../api/client';
import type { Notification } from '../types';
import { formatDate } from '../utils';

function targetPath(n: Notification): string {
  if (n.title.includes('出品完了')) return '/my/items';
  if (n.title.includes('出品キャンセル完了')) return '/my/items';
  if (n.title.includes('購入手続きが完了')) return '/my/purchases';
  if (n.title.includes('商品が購入')) return '/my/items';
  if (n.title.includes('発送通知') && n.body.includes('送信しました')) return '/my/items';
  if (n.title.includes('発送通知')) return '/my/purchases';
  if (n.title.includes('取引完了') && n.body.includes('購入者が受け取り評価')) return '/my/items';
  if (n.title.includes('取引完了')) return '/my/purchases';
  return n.itemId ? `/items/${n.itemId}` : '/my';
}

function targetLabel(n: Notification): string {
  const path = targetPath(n);
  if (path === '/my/purchases') return '購入履歴を見る';
  if (path === '/my/items') return '出品履歴を見る';
  if (path.startsWith('/items/')) return '対象の商品を見る';
  return 'マイページを見る';
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try { setNotifications(await meApi.notifications()); }
    catch (e) { setError(e instanceof Error ? e.message : '通知一覧の取得に失敗しました'); }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: number) {
    try {
      const updated = await meApi.readNotification(id);
      setNotifications((current) => current.map((n) => (n.id === id ? updated : n)));
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '通知の確認に失敗しました');
    }
  }

  async function markReadAndNavigate(n: Notification) {
    // 通知から遷移した場合も、確認ボタンと同じように既読化してから移動します。
    // 先にローカル状態を更新するので、ヘッダーの未読件数にも即時反映されます。
    if (!n.readAt) await markRead(n.id);
    navigate(targetPath(n));
  }

  return (
    <section className="stack">
      <h1>通知一覧</h1>
      <p className="muted">商品更新、コメント、DM、発送、取引完了、チャージなどの通知をまとめて確認できます。</p>
      {error && <p className="error">{error}</p>}
      {notifications.length === 0 ? (
        <div className="card"><p className="muted">通知はありません。</p></div>
      ) : (
        notifications.map((n) => (
          <article key={n.id} className={`card notificationCard ${n.readAt ? 'readNotification' : 'unreadNotification'}`}>
            <div>
              <div className="messageHeader">
                <strong>{n.title}</strong>
                <span className={n.readAt ? 'readBadge' : 'unreadBadge'}>{n.readAt ? '既読' : '未読'}</span>
              </div>
              <p>{n.body}</p>
              <span className="muted">{formatDate(n.createdAt)}</span>
            </div>
            <div className="actions vertical">
              <button type="button" className="notificationTargetButton" onClick={() => markReadAndNavigate(n)}>{targetLabel(n)}</button>
              {!n.readAt && <button type="button" className="secondaryButton" onClick={() => markRead(n.id)}>確認</button>}
            </div>
          </article>
        ))
      )}
    </section>
  );
}
