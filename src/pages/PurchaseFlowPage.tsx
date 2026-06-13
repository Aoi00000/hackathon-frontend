import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { authApi, itemApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Item } from '../types';
import { formatCoins, formatYen, normalizeImageUrl } from '../utils';

export function PurchaseFlowPage() {
  const { id } = useParams();
  const itemId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [latestUser, setLatestUser] = useState(user);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.shippingAddress ?? '');
  const [chargeInput, setChargeInput] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setItem(await itemApi.get(itemId));
    setLatestUser(await authApi.me().catch(() => user));
  }
  useEffect(() => { load(); }, [itemId]);

  async function charge() {
    const amount = Number(chargeInput);
    if (!Number.isInteger(amount) || amount <= 0) { setError('チャージ金額を入力してください'); return; }
    try { setLatestUser(await authApi.charge(amount)); setChargeInput(''); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'チャージに失敗しました'); }
  }

  async function purchase(event: FormEvent) {
    event.preventDefault();
    if (!item) return;
    try { await itemApi.purchase(item.id, deliveryAddress); navigate('/my/purchases?purchased=1'); } catch (e) { setError(e instanceof Error ? e.message : '購入手続きに失敗しました'); }
  }

  if (!item || !latestUser) return <p>読み込み中...</p>;
  const insufficient = latestUser.balanceCoins < item.priceYen;

  return <section className="stack">
    <div className="card"><h1>購入手続き</h1><ol className="flow"><li className="done">商品の検索・確認</li><li className="current">購入手続き</li><li>支払い</li><li>商品の受け渡し</li><li>評価</li></ol></div>
    <div className="card purchaseLayout"><div>{item.imageUrl && <img className="thumb" src={normalizeImageUrl(item.imageUrl)} alt={item.title} />}<h2>{item.title}</h2><p>{item.productCode}</p><strong>{formatYen(item.priceYen)}</strong><p className="muted">送料: 送料無料</p></div><div><h2>残高</h2><p className={insufficient ? 'error' : 'success'}>現在の残高: {formatCoins(latestUser.balanceCoins)}</p><p>購入後に、購入者の残高から商品代金が引かれ、出品者の売上金へ移ります。</p></div></div>
    {insufficient ? <div className="card"><h2>残高不足</h2><p className="error">残高が不足しているため購入手続きを完了できません。</p><div className="actions"><button type="button" className="secondaryButton" onClick={() => navigate(-1)}>手続きキャンセル</button><input value={chargeInput} onChange={(e) => setChargeInput(e.target.value.replace(/\D/g, ''))} placeholder="チャージ金額" /><button type="button" onClick={charge}>チャージ</button><Link className="button secondary" to="/my">チャージ画面へ</Link></div></div> : <form onSubmit={purchase} className="card form"><h2>お届け先住所</h2><textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="お届け先住所" required /><button type="submit">支払いを行い購入手続きを完了する</button></form>}
    {error && <p className="error">{error}</p>}
  </section>;
}
