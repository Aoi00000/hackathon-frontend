import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { itemApi, meApi } from '../api/client';
import { fuzzyIncludes, itemSearchText } from '../searchUtils';
import type { PurchaseHistory } from '../types';
import { formatDate, formatYen, nextPurchaseStep, purchaseStatusLabel, ratingStars, safeNumber, statusLabel } from '../utils';

function purchaseSearchText(row: PurchaseHistory): string {
  return itemSearchText({ ...row, sellerName: row.sellerName });
}

export function PurchaseHistoryPage() {
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searchParams] = useSearchParams();
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  async function load() { setError(''); try { setHistory(await meApi.purchases()); } catch (e) { setError(e instanceof Error ? e.message : '購入履歴の取得に失敗しました'); } }
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => history.filter((row) => fuzzyIncludes(purchaseSearchText(row), query)), [history, query]);
  async function complete(event: FormEvent, row: PurchaseHistory) { event.preventDefault(); const rating = Number(ratings[row.itemId] || '5'); try { await itemApi.complete(row.itemId, rating, comments[row.itemId] ?? ''); await load(); } catch (e) { setError(e instanceof Error ? e.message : '受け取り評価に失敗しました'); } }
  return <section className="stack">{searchParams.get('purchased') === '1' && <p className="success">購入が完了しました。</p>}<h1>購入履歴</h1>{error && <p className="error">{error}</p>}<div className="card inlineSearch"><label><span>購入履歴内検索</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="商品名、カテゴリ、出品者など" /></label></div>{history.length === 0 ? <p className="muted">まだ購入した商品はありません。</p> : filtered.length === 0 ? <p className="muted">該当する商品はありません。</p> : filtered.map((row) => { const next = nextPurchaseStep(row.purchaseStatus); return <article key={row.purchaseId} className="card historyCard"><div className="historyHeader"><div><span className="productCode">{row.productCode}</span><h2>{row.title}</h2><p className="muted">購入日時: {formatDate(row.purchasedAt)}</p><p className="muted">発送期限: {formatDate(row.shippingDeadline)}</p></div><strong>{formatYen(row.priceYen)}</strong></div><p>{row.description}</p><dl className="meta compact"><dt>出品者</dt><dd>{row.sellerName}</dd><dt>出品者評価</dt><dd>{row.sellerRatingCount ? <><span className="stars">{ratingStars(row.sellerRatingAverage)}</span> {safeNumber(row.sellerRatingAverage).toFixed(1)} / 5.0 ({row.sellerRatingCount}件)</> : '評価なし'}</dd><dt>状態</dt><dd>{row.conditionText}</dd><dt>商品状態</dt><dd>{statusLabel(row.status)}</dd><dt>現在の取引状態</dt><dd><span className={`purchaseStatusBadge ${row.purchaseStatus}`}>{purchaseStatusLabel(row.purchaseStatus)}</span></dd>{next && <><dt>次の段階</dt><dd><strong>{next}</strong></dd></>}<dt>受け渡し</dt><dd>{row.deliveryMethod}</dd><dt>発送元</dt><dd>{row.shipFromRegion}</dd><dt>お届け先</dt><dd>{row.deliveryAddress}</dd>{row.shippedAt && <><dt>発送通知</dt><dd>{formatDate(row.shippedAt)} <span className="statusText shipped">発送通知送信済み</span></dd></>}{row.completedAt && <><dt>取引完了</dt><dd>{formatDate(row.completedAt)} <span className="statusText completed">受け取り評価済み</span></dd><dt>受け取り評価</dt><dd><span className="stars">{ratingStars(row.rating ?? 0)}</span> {row.rating ? `${row.rating}.0 / 5.0` : ''}{row.ratingComment ? ` ： ${row.ratingComment}` : ''}</dd></>}</dl><div className="actions"><Link className="button secondary" to={`/items/${row.itemId}`}>商品詳細を見る</Link></div>{row.purchaseStatus === 'shipped' && <form className="form inlineForm" onSubmit={(e) => complete(e, row)}><label>受け取り評価<select value={ratings[row.itemId] ?? '5'} onChange={(e) => setRatings((c) => ({ ...c, [row.itemId]: e.target.value }))}><option value="5">★★★★★ 5</option><option value="4">★★★★☆ 4</option><option value="3">★★★☆☆ 3</option><option value="2">★★☆☆☆ 2</option><option value="1">★☆☆☆☆ 1</option></select></label><input value={comments[row.itemId] ?? ''} onChange={(e) => setComments((c) => ({ ...c, [row.itemId]: e.target.value }))} placeholder="評価コメント" /><button type="submit">受け取り評価をする</button></form>}</article>; })}</section>;
}
