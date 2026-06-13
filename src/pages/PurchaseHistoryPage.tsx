import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { itemApi, meApi } from '../api/client';
import type { PurchaseHistory } from '../types';
import { formatDate, formatYen, purchaseStatusLabel, statusLabel } from '../utils';

export function PurchaseHistoryPage() {
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  async function load() { setError(''); try { setHistory(await meApi.purchases()); } catch (e) { setError(e instanceof Error ? e.message : '購入履歴の取得に失敗しました'); } }
  useEffect(() => { load(); }, []);
  async function complete(event: FormEvent, row: PurchaseHistory) { event.preventDefault(); const rating = Number(ratings[row.itemId] || '5'); try { await itemApi.complete(row.itemId, rating, comments[row.itemId] ?? ''); await load(); } catch (e) { setError(e instanceof Error ? e.message : '受け取り評価に失敗しました'); } }
  return <section className="stack">{searchParams.get('purchased') === '1' && <p className="success">購入が完了しました。</p>}<h1>購入履歴</h1>{error && <p className="error">{error}</p>}{history.length === 0 ? <p className="muted">まだ購入した商品はありません。</p> : history.map((row) => <article key={row.purchaseId} className="card historyCard"><div className="historyHeader"><div><span className="productCode">{row.productCode}</span><h2>{row.title}</h2><p className="muted">購入日時: {formatDate(row.purchasedAt)}</p><p className="muted">発送期限: {formatDate(row.shippingDeadline)}</p></div><strong>{formatYen(row.priceYen)}</strong></div><p>{row.description}</p><dl className="meta compact"><dt>出品者</dt><dd>{row.sellerName}</dd><dt>状態</dt><dd>{row.conditionText}</dd><dt>商品状態</dt><dd>{statusLabel(row.status)}</dd><dt>取引状態</dt><dd>{purchaseStatusLabel(row.purchaseStatus)}</dd><dt>受け渡し</dt><dd>{row.deliveryMethod}</dd><dt>発送元</dt><dd>{row.shipFromRegion}</dd><dt>お届け先</dt><dd>{row.deliveryAddress}</dd>{row.shippedAt && <><dt>発送通知</dt><dd>{formatDate(row.shippedAt)}</dd></>}{row.completedAt && <><dt>取引完了</dt><dd>{formatDate(row.completedAt)}</dd></>}</dl><div className="actions"><Link className="button secondary" to={`/items/${row.itemId}`}>商品詳細を見る</Link></div>{row.purchaseStatus === 'shipped' && <form className="form inlineForm" onSubmit={(e) => complete(e, row)}><label>受け取り評価<select value={ratings[row.itemId] ?? '5'} onChange={(e) => setRatings((c) => ({ ...c, [row.itemId]: e.target.value }))}><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></label><input value={comments[row.itemId] ?? ''} onChange={(e) => setComments((c) => ({ ...c, [row.itemId]: e.target.value }))} placeholder="評価コメント" /><button type="submit">受け取り評価をする</button></form>}</article>)}</section>;
}
