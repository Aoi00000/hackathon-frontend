import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { itemApi, meApi } from '../api/client';
import type { Item } from '../types';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusLabel(status: Item['status']): string {
  if (status === 'sold') return '購入済み';
  if (status === 'canceled') return '出品キャンセル';
  return '販売中';
}

function EditableItemCard({ item, onChanged }: { item: Item; onChanged: () => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [conditionText, setConditionText] = useState(item.conditionText);
  const [priceInput, setPriceInput] = useState(String(item.priceYen));
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const [description, setDescription] = useState(item.description);
  const [error, setError] = useState('');

  const canEdit = item.status === 'available';

  function resetForm() {
    setTitle(item.title);
    setCategory(item.category);
    setConditionText(item.conditionText);
    setPriceInput(String(item.priceYen));
    setImageUrl(item.imageUrl);
    setDescription(item.description);
    setError('');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');

    const priceYen = Number(priceInput);
    if (!Number.isInteger(priceYen) || priceYen <= 0) {
      setError('価格(円)を1円以上の整数で入力してください');
      return;
    }

    try {
      await itemApi.update(item.id, {
        title,
        category,
        conditionText,
        priceYen,
        imageUrl,
        description,
      });
      setIsEditing(false);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : '商品情報の編集に失敗しました');
    }
  }

  async function cancelListing() {
    if (!confirm('この商品の出品をキャンセルしますか？')) return;
    setError('');
    try {
      await itemApi.cancel(item.id);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : '出品キャンセルに失敗しました');
    }
  }

  return (
    <article className="card historyCard">
      <div className="historyHeader">
        <div>
          <h2>{item.title}</h2>
          <p className="muted">最終更新日時: {formatDate(item.updatedAt)}</p>
        </div>
        <span className={`badge ${item.status}`}>{statusLabel(item.status)}</span>
      </div>

      {!isEditing ? (
        <>
          <p>{item.description}</p>
          <dl className="meta compact">
            <dt>カテゴリ</dt>
            <dd>{item.category}</dd>
            <dt>状態</dt>
            <dd>{item.conditionText}</dd>
            <dt>価格</dt>
            <dd>¥{item.priceYen.toLocaleString()}</dd>
          </dl>

          <div className="actions">
            <Link className="button secondary" to={`/items/${item.id}`}>商品詳細を見る</Link>
            <button type="button" onClick={() => setIsEditing(true)} disabled={!canEdit}>商品情報を編集</button>
            <button type="button" className="dangerButton" onClick={cancelListing} disabled={!canEdit}>出品キャンセル</button>
          </div>
        </>
      ) : (
        <form onSubmit={save} className="form">
          <label>商品名<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <label>カテゴリ<input value={category} onChange={(e) => setCategory(e.target.value)} required /></label>
          <label>状態<input value={conditionText} onChange={(e) => setConditionText(e.target.value)} required /></label>
          <label>価格(円)<input value={priceInput} onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ''))} inputMode="numeric" required /></label>
          <label>画像URL<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></label>
          <label>商品説明<textarea value={description} onChange={(e) => setDescription(e.target.value)} required /></label>
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <button type="submit">保存する</button>
            <button type="button" className="secondaryButton" onClick={() => { resetForm(); setIsEditing(false); }}>戻る</button>
          </div>
        </form>
      )}

      {error && !isEditing && <p className="error">{error}</p>}
    </article>
  );
}

export function MyItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  async function load() {
    setError('');
    try {
      setItems(await meApi.items());
    } catch (e) {
      setError(e instanceof Error ? e.message : '出品履歴の取得に失敗しました');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="stack">
      {searchParams.get('created') === '1' && <p className="success">出品が完了しました。</p>}
      <div className="pageTitleRow">
        <h1>出品履歴</h1>
        <Link className="button" to="/items/new">新しく出品する</Link>
      </div>
      {error && <p className="error">{error}</p>}
      {items.length === 0 ? <p className="muted">まだ出品した商品はありません。</p> : items.map((item) => <EditableItemCard key={item.id} item={item} onChanged={load} />)}
    </section>
  );
}
