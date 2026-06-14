import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { checklistApi, meApi } from '../api/client';
import { fuzzyIncludes, itemSearchText } from '../searchUtils';
import type { Item } from '../types';
import { formatDate, formatYen, normalizeImageUrl, statusLabel } from '../utils';

export function ChecklistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  async function load() { setError(''); try { setItems(await meApi.checklist()); } catch (e) { setError(e instanceof Error ? e.message : 'チェックリストの取得に失敗しました'); } }
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => items.filter((item) => fuzzyIncludes(itemSearchText(item), query)), [items, query]);
  async function remove(id: number) { await checklistApi.remove(id); await load(); }
  return <section className="stack"><h1>チェックリスト</h1><p className="muted">気になった商品を保存します。商品情報が更新された場合は通知にも表示されます。</p>{error && <p className="error">{error}</p>}<div className="card inlineSearch"><label><span>チェックリスト内検索</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="商品名、カテゴリ、色など" /></label></div>{items.length === 0 ? <p className="muted">チェックリストに商品はありません。</p> : filtered.length === 0 ? <p className="muted">該当する商品はありません。</p> : filtered.map((item) => <article key={item.id} className="card historyCard"><div className="historyHeader"><div><span className="productCode">{item.productCode}</span><h2>{item.title}</h2><p className="muted">最終更新日時: {formatDate(item.updatedAt)}</p></div><span className={`statusText ${item.status}`}>{statusLabel(item.status)}</span></div>{item.imageUrl && <img className="thumb" src={normalizeImageUrl(item.imageUrl)} alt={item.title} />}<p>{item.description}</p><strong>{formatYen(item.priceYen)}</strong><p className="likeCount">♡ {item.checklistCount}</p><div className="actions"><Link className="button secondary" to={`/items/${item.id}`}>商品詳細を見る</Link><button type="button" className="dangerButton" onClick={() => remove(item.id)}>チェックリストから外す</button></div></article>)}</section>;
}
