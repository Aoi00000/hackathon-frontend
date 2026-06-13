import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { itemApi, meApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Item, ItemStatus } from '../types';
import { formatYen, normalizeImageUrl, statusLabel } from '../utils';

const categories = ['', 'ファッション', 'ガジェット', '本・教材', '家具', 'その他'];
const conditions = ['', '新品・未使用', '未使用に近い', '目立った傷や汚れなし', 'やや傷や汚れあり', '全体的に状態が悪い'];
const statuses: Array<'' | ItemStatus> = ['', 'available', 'sold'];

export function ItemListPage() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState('');
  const [status, setStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState('recommended');
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [saveName, setSaveName] = useState('');
  const [message, setMessage] = useState('');

  async function loadItems() {
    setError('');
    try { setItems(await itemApi.list({ q, category, size, color, condition, status, minPrice, maxPrice, tag, sort })); }
    catch (e) { setError(e instanceof Error ? e.message : '商品一覧の取得に失敗しました'); }
  }
  useEffect(() => { loadItems(); }, []);

  async function saveSearch() {
    if (!user) { setError('検索条件の保存にはログインが必要です'); return; }
    const name = saveName.trim() || `検索条件 ${new Date().toLocaleString('ja-JP')}`;
    const queryJson = JSON.stringify({ q, category, size, color, condition, status, minPrice, maxPrice, tag, sort });
    try { await meApi.saveSearch(name, queryJson); setMessage('検索条件を保存しました'); setSaveName(''); }
    catch (e) { setError(e instanceof Error ? e.message : '検索条件の保存に失敗しました'); }
  }

  return (
    <section>
      <div className="hero"><h1>AIが出品と購入判断を支援する次世代フリマ</h1><p>購入フロー、仮想通貨、コメント/DM、検索保存、通知を備えたWebコース準拠のMVPです。</p></div>
      <form className="search advancedSearch" onSubmit={(event) => { event.preventDefault(); loadItems(); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="キーワード" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((x) => <option key={x} value={x}>{x || 'カテゴリ'}</option>)}</select>
        <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="サイズ" />
        <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="色" />
        <select value={condition} onChange={(e) => setCondition(e.target.value)}>{conditions.map((x) => <option key={x} value={x}>{x || '状態'}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((x) => <option key={x} value={x}>{x ? statusLabel(x) : '販売状況'}</option>)}</select>
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))} placeholder="最低価格" />
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} placeholder="最高価格" />
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="タグ" />
        <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recommended">おすすめ順</option><option value="new">新着順</option><option value="price_asc">価格が安い順</option><option value="price_desc">価格が高い順</option><option value="checklist_desc">チェックリスト追加が多い順</option></select>
        <button type="submit">検索</button>
      </form>
      <div className="saveSearchRow"><input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="検索条件名" /><button type="button" onClick={saveSearch}>検索条件を保存</button></div>
      {message && <p className="success">{message}</p>}{error && <p className="error">{error}</p>}
      <div className="grid">{items.map((item) => <Link key={item.id} className="itemCard" to={`/items/${item.id}`}>{item.imageUrl ? <img src={normalizeImageUrl(item.imageUrl)} alt={item.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <div className="noImage">No Image</div>}<div className="itemBody"><span className="productCode">{item.productCode}</span><h2>{item.title}</h2><p>{item.category} / {item.conditionText}</p><p className="muted">{item.size || '-'} / {item.color || '-'}</p><strong>{formatYen(item.priceYen)}</strong><span className={`badge ${item.status}`}>{statusLabel(item.status)}</span><span className="muted">チェック {item.checklistCount}</span></div></Link>)}</div>
    </section>
  );
}
