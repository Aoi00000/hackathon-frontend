import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { authApi, meApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { BlockedUser, Item, Notification, SavedSearch } from '../types';
import { formatDate, formatCoins, formatYen, safeNumber, statusLabel } from '../utils';

export function MyPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [chargeAmount, setChargeAmount] = useState('');
  const [shippingRegion, setShippingRegion] = useState(user?.shippingRegion ?? '');
  const [shippingAddress, setShippingAddress] = useState(user?.shippingAddress ?? '');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [supportBody, setSupportBody] = useState('');
  const [recommendReason, setRecommendReason] = useState('');
  const [recommendItems, setRecommendItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const [me, ns, ss, bs, rec] = await Promise.all([
        authApi.me(),
        meApi.notifications().catch(() => []),
        meApi.savedSearches().catch(() => []),
        meApi.blocks().catch(() => []),
        meApi.recommendations().catch(() => ({ reason: '', items: [] })),
      ]);
      setProfile(me); setShippingRegion(me.shippingRegion ?? ''); setShippingAddress(me.shippingAddress ?? ''); setNotifications(ns); setSavedSearches(ss); setBlockedUsers(bs); setRecommendReason(rec.reason); setRecommendItems(rec.items);
    } catch (e) { setError(e instanceof Error ? e.message : 'マイページの取得に失敗しました'); }
  }
  useEffect(() => { load(); }, []);

  async function charge() { const amount = Number(chargeAmount); if (!Number.isInteger(amount) || amount <= 0) { setError('チャージ金額を入力してください'); return; } try { setProfile(await authApi.charge(amount)); setChargeAmount(''); setMessage('チャージしました'); } catch (e) { setError(e instanceof Error ? e.message : 'チャージに失敗しました'); } }
  async function updateProfile(event: FormEvent) { event.preventDefault(); try { setProfile(await authApi.updateMe({ shippingRegion, shippingAddress })); setMessage('発送元・お届け先住所を保存しました'); } catch (e) { setError(e instanceof Error ? e.message : '保存に失敗しました'); } }
  async function sendSupport(event: FormEvent) { event.preventDefault(); try { await meApi.support(supportBody); setSupportBody(''); setMessage('運営へ連絡しました'); } catch (e) { setError(e instanceof Error ? e.message : '運営への連絡に失敗しました'); } }
  async function deleteSearch(id: number) { await meApi.deleteSavedSearch(id); await load(); }
  async function unblock(userId: number) { await meApi.unblock(userId); await load(); }

  if (!profile) return <p>読み込み中...</p>;
  return <section className="stack"><h1>マイページ</h1>{message && <p className="success">{message}</p>}{error && <p className="error">{error}</p>}<div className="card wallet"><div><h2>残高</h2><p className="bigNumber">{formatCoins(profile.balanceCoins)}</p></div><div><h2>売上金</h2><p className="bigNumber">{formatCoins(profile.salesCoins)}</p></div><div><h2>出品者評価</h2><p>{profile.ratingCount ? `${safeNumber(profile.ratingAverage).toFixed(1)} / 5 (${profile.ratingCount}件)` : '評価なし'}</p><p>取引実績: {profile.transactionCount}件</p></div></div><div className="card"><h2>残高チャージ</h2><div className="actions"><input value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value.replace(/\D/g, ''))} placeholder="チャージ金額" /><button onClick={charge}>チャージ</button></div></div><form className="card form" onSubmit={updateProfile}><h2>発送元・お届け先住所</h2><label>地域<input value={shippingRegion} onChange={(e) => setShippingRegion(e.target.value)} placeholder="例: 東京都" /></label><label>住所<textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="お届け先住所・発送元住所" /></label><button type="submit">保存</button></form><div className="card"><h2>通知設定・通知一覧</h2><p className="muted">商品更新、コメント、DM、発送、取引完了の通知を表示します。</p>{notifications.length === 0 ? <p className="muted">通知はありません。</p> : notifications.map((n) => <div key={n.id} className="notice"><strong>{n.title}</strong><p>{n.body}</p><span className="muted">{formatDate(n.createdAt)}</span>{n.itemId && <Link to={`/items/${n.itemId}`}> 商品を見る</Link>}</div>)}</div><div className="card"><h2>保存した検索条件</h2>{savedSearches.length === 0 ? <p className="muted">保存した検索条件はありません。</p> : savedSearches.map((s) => <div key={s.id} className="notice"><strong>{s.name}</strong><code>{s.queryJson}</code><button className="dangerButton" onClick={() => deleteSearch(s.id)}>削除</button></div>)}</div><div className="card"><h2>ブロックしたユーザー</h2>{blockedUsers.length === 0 ? <p className="muted">ブロック中のユーザーはいません。</p> : blockedUsers.map((b) => <div key={b.id} className="notice"><strong>{b.blockedName}</strong><button className="secondaryButton" onClick={() => unblock(b.blockedId)}>ブロック解除</button></div>)}</div><form className="card form" onSubmit={sendSupport}><h2>運営にDMする</h2><textarea value={supportBody} onChange={(e) => setSupportBody(e.target.value)} placeholder="取引上の問題や相談内容を入力してください" /><button type="submit">運営へ送信</button></form><div className="card"><h2>AIおすすめ</h2><p>{recommendReason || 'チェックリスト数や新着順をもとにおすすめを提示します。'}</p><div className="grid">{recommendItems.map((item) => <Link key={item.id} className="itemCard" to={`/items/${item.id}`}><div className="itemBody"><span className="productCode">{item.productCode}</span><h2>{item.title}</h2><strong>{formatYen(item.priceYen)}</strong><span className={`badge ${item.status}`}>{statusLabel(item.status)}</span></div></Link>)}</div></div></section>;
}
