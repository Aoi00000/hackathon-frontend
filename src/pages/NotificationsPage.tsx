/**
 * ファイル概要: hackathon-frontend/src/pages/NotificationsPage.tsx
 *
 * 役割:
 * 購入・出品・支払い方法・AI販売改善提案などの通知を確認し、既読化できる画面です。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { meApi } from '../api/client';
import type { Notification } from '../types';
import { formatDate } from '../utils';

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
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

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function targetLabel(n: Notification): string {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const path = targetPath(n);
  if (path === '/my/purchases') return '購入履歴を見る';
  if (path === '/my/items') return '出品履歴を見る';
  if (path.startsWith('/items/')) return '対象の商品を見る';
  return 'マイページを見る';
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function NotificationsPage() {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const navigate = useNavigate();
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [notifications, setNotifications] = useState<Notification[]>([]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try { setNotifications(await meApi.notifications()); }
    catch (e) { setError(e instanceof Error ? e.message : '通知一覧の取得に失敗しました'); }
  }

  // 【副作用】useEffectは、画面表示後のAPI取得、イベント登録、タイマー管理などReact外部との接続点です。
  useEffect(() => { load(); }, []);

  async function markRead(id: number) {
    try {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
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
