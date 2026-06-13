import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { itemApi } from '../api/client';
import type { Item } from '../types';

function statusLabel(status: Item['status']): string {
  if (status === 'sold') return '購入済み';
  if (status === 'canceled') return '出品キャンセル';
  return '販売中';
}

// ItemListPage は商品一覧・検索画面です。
export function ItemListPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');

  async function loadItems(keyword: string) {
    setError('');
    try {
      const data = await itemApi.list(keyword);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '商品一覧の取得に失敗しました');
    }
  }

  useEffect(() => {
    loadItems('');
  }, []);

  return (
    <section>
      <div className="hero">
        <h1>AIが出品と購入判断を支援する次世代フリマ</h1>
        <p>商品説明の自動生成、商品Q&A、コメント欄を備えたWebコース準拠のMVPです。</p>
      </div>

      <form
        className="search"
        onSubmit={(event) => {
          event.preventDefault();
          loadItems(q);
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="商品名・カテゴリで検索" />
        <button type="submit">検索</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {items.map((item) => (
          <Link key={item.id} className="itemCard" to={`/items/${item.id}`}>
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div className="noImage">No Image</div>}
            <div className="itemBody">
              <h2>{item.title}</h2>
              <p>{item.category} / {item.conditionText}</p>
              <strong>¥{item.priceYen.toLocaleString()}</strong>
              <span className={`badge ${item.status}`}>{statusLabel(item.status)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
