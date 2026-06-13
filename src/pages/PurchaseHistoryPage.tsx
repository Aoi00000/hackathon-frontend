import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { meApi } from '../api/client';
import type { PurchaseHistory } from '../types';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function PurchaseHistoryPage() {
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setError('');
    meApi
      .purchases()
      .then(setHistory)
      .catch((e) => setError(e instanceof Error ? e.message : '購入履歴の取得に失敗しました'));
  }, []);

  return (
    <section className="stack">
      {searchParams.get('purchased') === '1' && <p className="success">購入が完了しました。</p>}
      <h1>購入履歴</h1>
      {error && <p className="error">{error}</p>}
      {history.length === 0 ? (
        <p className="muted">まだ購入した商品はありません。</p>
      ) : (
        history.map((row) => (
          <article key={row.purchaseId} className="card historyCard">
            <div className="historyHeader">
              <div>
                <h2>{row.title}</h2>
                <p className="muted">購入日時: {formatDate(row.purchasedAt)}</p>
                <p className="muted">最終更新日時: {formatDate(row.updatedAt)}</p>
              </div>
              <strong>¥{row.priceYen.toLocaleString()}</strong>
            </div>
            <p>{row.description}</p>
            <dl className="meta compact">
              <dt>出品者</dt>
              <dd>{row.sellerName}</dd>
              <dt>カテゴリ</dt>
              <dd>{row.category}</dd>
              <dt>状態</dt>
              <dd>{row.conditionText}</dd>
            </dl>
            <Link className="button secondary" to={`/items/${row.itemId}`}>商品詳細を見る</Link>
          </article>
        ))
      )}
    </section>
  );
}
