import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { checklistApi, meApi } from '../api/client';
import type { Item } from '../types';

function statusLabel(status: Item['status']): string {
  if (status === 'sold') return '購入済み';
  if (status === 'canceled') return '出品キャンセル';
  return '販売中';
}

export function ChecklistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setItems(await meApi.checklist());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チェックリストの取得に失敗しました');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(itemId: number) {
    setError('');
    try {
      await checklistApi.remove(itemId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チェックリストからの削除に失敗しました');
    }
  }

  return (
    <section className="stack">
      <h1>チェックリスト</h1>
      <p className="muted">気になった商品を後から見返せます。</p>
      {error && <p className="error">{error}</p>}
      {items.length === 0 ? (
        <p className="muted">チェックリストに商品はありません。</p>
      ) : (
        <div className="grid">
          {items.map((item) => (
            <article key={item.id} className="itemCard asArticle">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div className="noImage">No Image</div>}
              <div className="itemBody">
                <h2>{item.title}</h2>
                <p>{item.category} / {item.conditionText}</p>
                <strong>¥{item.priceYen.toLocaleString()}</strong>
                <span className={`badge ${item.status}`}>{statusLabel(item.status)}</span>
                <div className="actions vertical">
                  <Link className="button secondary" to={`/items/${item.id}`}>詳細を見る</Link>
                  <button type="button" className="secondaryButton" onClick={() => remove(item.id)}>チェックリストから外す</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
