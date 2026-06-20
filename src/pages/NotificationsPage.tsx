/**
 * ファイル概要: hackathon-frontend/src/pages/NotificationsPage.tsx
 *
 * 役割:
 * 購入・出品・支払い方法・AI販売改善提案などの通知を確認し、既読化できる画面です。
 *
 */

/**
 * 実装詳細メモ:
 * コメント、購入状態、保存検索、AI販売改善提案などの通知を一覧化します。
 * 通知のitemIdや本文から遷移先を決めるため、単純なメッセージ一覧ではなく次の行動に接続する画面です。
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { meApi } from '../api/client';
import type { Notification } from '../types';
import { formatDate } from '../utils';

// targetPath は、通知の内容から次に開くべき画面URLを決めます。
// 例えば購入者向け通知は購入履歴、出品者向け通知は出品履歴へ送ることで、通知を確認した後の行動につなげます。
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

// targetLabel は、targetPathで決めた遷移先をボタン文言に変換します。
// 通知カード内に「どこへ移動するボタンか」を明示し、商品詳細・購入履歴・出品履歴を区別しやすくします。
function targetLabel(n: Notification): string {
  const path = targetPath(n);
  if (path === '/my/purchases') return '購入履歴を見る';
  if (path === '/my/items') return '出品履歴を見る';
  if (path.startsWith('/items/')) return '対象の商品を見る';
  return 'マイページを見る';
}

// NotificationsPage は、ログインユーザーの通知を一覧表示し、既読化と関連画面への遷移を行う画面です。
// 通知は商品取引、コメント、支払い、AI販売改善提案など複数機能から作られるため、ここで一元的に確認できます。
export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');

  // load は、本人宛て通知をAPIから取得して一覧stateへ反映します。
  // 通知画面を開いた直後に最新状態を出すため、初回マウント時に呼び出します。
  async function load() {
    setError('');
    try { setNotifications(await meApi.notifications()); }
    catch (e) { setError(e instanceof Error ? e.message : '通知一覧の取得に失敗しました'); }
  }
  useEffect(() => { load(); }, []);

  // markRead は、通知1件を既読化し、返ってきた最新通知でローカルstateを差し替えます。
  // ヘッダーの未読バッジにも反映するため、カスタムイベント notifications:changed を発火します。
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
