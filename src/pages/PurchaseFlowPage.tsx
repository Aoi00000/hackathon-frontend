import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { authApi, itemApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Item } from '../types';
import { formatCoins, formatYen, firstImageUrl } from '../utils';

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
  const [message, setMessage] = useState('');

  async function load() {
    // 商品情報と最新のユーザー情報を取得します。
    // AuthContextのuserは画面遷移直後に古い場合があるため、購入手続きでは /api/me を取り直します。
    setItem(await itemApi.get(itemId));
    const me = await authApi.me().catch(() => user);
    setLatestUser(me);

    // マイページでお届け先住所を登録している場合、購入手続きの初期値に反映します。
    // ユーザーがすでに入力した住所を上書きしないよう、空欄のときだけ更新します。
    if (me?.shippingAddress) {
      setDeliveryAddress((current) => (current.trim() === '' ? me.shippingAddress : current));
    }
  }
  useEffect(() => { load(); }, [itemId]);

  async function charge() {
    const amount = Number(chargeInput);
    if (!Number.isInteger(amount) || amount <= 0) { setError('チャージ金額を入力してください'); return; }
    try { setLatestUser(await authApi.charge(amount)); setChargeInput(''); setError(''); setMessage(`${formatCoins(amount)}をチャージしました。`); } catch (e) { setError(e instanceof Error ? e.message : 'チャージに失敗しました'); }
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
    <div className="card purchaseLayout"><div>{item.imageUrl && <img className="thumb" src={firstImageUrl(item.imageUrl)} alt={item.title} />}<h2>{item.title}</h2><p>{item.productCode}</p><strong>{formatYen(item.priceYen)}</strong><p className="muted">送料: 送料無料</p></div><div><h2>残高</h2><p className={insufficient ? 'error' : 'success'}>現在の残高: {formatCoins(latestUser.balanceCoins)}</p><p>購入後に、購入者の残高から商品代金が引かれ、出品者の売上金へ移ります。</p></div></div>
    {insufficient ? <div className="card"><h2>残高不足</h2><p className="error">残高が不足しているため購入手続きを完了できません。</p><div className="actions"><button type="button" className="secondaryButton" onClick={() => navigate(-1)}>手続きキャンセル</button><input value={chargeInput} onChange={(e) => setChargeInput(e.target.value.replace(/\D/g, ''))} placeholder="チャージ金額" /><button type="button" onClick={charge}>チャージ</button></div></div> : <form onSubmit={purchase} className="card form"><h2>お届け先住所</h2><textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="お届け先住所" required /><button type="submit">支払いを行い購入手続きを完了する</button></form>}
    {message && <p className="success">{message}</p>}
    {error && <p className="error">{error}</p>}
  </section>;
}
