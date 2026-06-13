import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { itemApi, meApi } from '../api/client';
import type { Item } from '../types';
import { formatDate, purchaseStatusLabel, statusLabel } from '../utils';

function EditableItemCard({ item, onChanged }: { item: Item; onChanged: () => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [conditionText, setConditionText] = useState(item.conditionText);
  const [priceInput, setPriceInput] = useState(String(item.priceYen));
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const [description, setDescription] = useState(item.description);
  const [deliveryMethod, setDeliveryMethod] = useState(item.deliveryMethod);
  const [shippingDays, setShippingDays] = useState(String(item.shippingDays));
  const [shipFromRegion, setShipFromRegion] = useState(item.shipFromRegion);
  const [size, setSize] = useState(item.size || '');
  const [color, setColor] = useState(item.color || '');
  const [tags, setTags] = useState(item.tags || '');
  const [error, setError] = useState('');
  const canEdit = item.status === 'available';

  async function cancelListing() { if (!confirm('この出品をキャンセルしますか？')) return; try { await itemApi.cancel(item.id); await onChanged(); } catch (e) { setError(e instanceof Error ? e.message : 'キャンセルに失敗しました'); } }
  async function ship() { try { await itemApi.ship(item.id); await onChanged(); } catch (e) { setError(e instanceof Error ? e.message : '発送通知に失敗しました'); } }
  async function save(event: FormEvent) { event.preventDefault(); const priceYen = Number(priceInput); const days = Number(shippingDays); if (!Number.isInteger(priceYen) || priceYen <= 0 || !Number.isInteger(days) || days <= 0) { setError('価格と発送日数を正しく入力してください'); return; } try { await itemApi.update(item.id, { title, category, conditionText, priceYen, imageUrl, description, deliveryMethod, shippingDays: days, shipFromRegion, size, color, tags }); setIsEditing(false); await onChanged(); } catch (e) { setError(e instanceof Error ? e.message : '保存に失敗しました'); } }

  return <article className="card historyCard"><div className="historyHeader"><div><span className="productCode">{item.productCode}</span><h2>{item.title}</h2><p className="muted">最終更新日時: {formatDate(item.updatedAt)}</p></div><span className={`statusText ${item.status}`}>{statusLabel(item.status)}</span></div>{!isEditing ? <><p>{item.description}</p><dl className="meta compact"><dt>カテゴリ</dt><dd>{item.category}</dd><dt>状態</dt><dd>{item.conditionText}</dd><dt>価格</dt><dd>¥{item.priceYen.toLocaleString()}</dd><dt>受け渡し</dt><dd>{item.deliveryMethod}</dd><dt>発送目安</dt><dd>{item.shippingDays}日</dd><dt>発送元</dt><dd>{item.shipFromRegion}</dd><dt>購入者</dt><dd>{item.buyerName || '-'}</dd><dt>お届け先</dt><dd>{item.buyerShippingAddress || '-'}</dd><dt>取引状態</dt><dd>{item.purchaseStatus ? purchaseStatusLabel(item.purchaseStatus) : '-'}</dd></dl><div className="actions"><Link className="button secondary" to={`/items/${item.id}`}>商品詳細を見る</Link><button type="button" onClick={() => setIsEditing(true)} disabled={!canEdit}>商品情報を編集</button><button type="button" className="dangerButton" onClick={cancelListing} disabled={!canEdit}>出品キャンセル</button>{item.purchaseStatus === 'paid' && <button type="button" onClick={ship}>発送通知を送る</button>}</div></> : <form onSubmit={save} className="form"><label>商品名<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label>カテゴリ<input value={category} onChange={(e) => setCategory(e.target.value)} required /></label><label>状態<input value={conditionText} onChange={(e) => setConditionText(e.target.value)} required /></label><label>価格(円)<input value={priceInput} onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ''))} inputMode="numeric" required /></label><label>画像URL<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></label><label>受け渡し方法<input value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} /></label><label>発送までの日数<input value={shippingDays} onChange={(e) => setShippingDays(e.target.value.replace(/\D/g, ''))} /></label><label>発送元地域<input value={shipFromRegion} onChange={(e) => setShipFromRegion(e.target.value)} /></label><label>サイズ<input value={size} onChange={(e) => setSize(e.target.value)} /></label><label>色<input value={color} onChange={(e) => setColor(e.target.value)} /></label><label>タグ<input value={tags} onChange={(e) => setTags(e.target.value)} /></label><label>商品説明<textarea value={description} onChange={(e) => setDescription(e.target.value)} required /></label><div className="actions"><button type="submit">保存する</button><button type="button" className="secondaryButton" onClick={() => setIsEditing(false)}>戻る</button></div></form>}{error && <p className="error">{error}</p>}</article>;
}

export function MyItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  async function load() { setError(''); try { setItems(await meApi.items()); } catch (e) { setError(e instanceof Error ? e.message : '出品履歴の取得に失敗しました'); } }
  useEffect(() => { load(); }, []);
  return <section className="stack">{searchParams.get('created') === '1' && <p className="success">出品が完了しました。</p>}<div className="pageTitleRow"><h1>出品履歴</h1><Link className="button" to="/items/new">新しく出品する</Link></div>{error && <p className="error">{error}</p>}{items.length === 0 ? <p className="muted">まだ出品した商品はありません。</p> : items.map((item) => <EditableItemCard key={item.id} item={item} onChanged={load} />)}</section>;
}
