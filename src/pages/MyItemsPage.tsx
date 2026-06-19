import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { itemApi, meApi } from '../api/client';
import { ImageReorderGrid } from '../components/ImageReorderGrid';
import { categories, colors, conditions, deliveryMethods, sizes } from '../formOptions';
import { fileToCompressedDataUrl } from '../imageUpload';
import { fuzzyIncludes, itemSearchText } from '../searchUtils';
import type { Item } from '../types';
import {
  firstImageUrl,
  formatDate,
  formatYen,
  nextPurchaseStep,
  parseImageUrls,
  purchaseStatusLabel,
  statusLabel,
  stringifyImageUrls,
} from '../utils';

function EditableItemCard({ item, onChanged }: { item: Item; onChanged: () => Promise<void> }) {
  // 編集モードのON/OFFです。販売中の商品だけ編集可能にします。
  const [isEditing, setIsEditing] = useState(false);

  // 編集フォームの入力値です。初期値は現在の商品情報から作ります。
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [conditionText, setConditionText] = useState(item.conditionText);
  const [priceInput, setPriceInput] = useState(String(item.priceYen));
  const [imageUrls, setImageUrls] = useState<string[]>(() => parseImageUrls(item.imageUrl));
  const [description, setDescription] = useState(item.description);
  const [deliveryMethod, setDeliveryMethod] = useState(item.deliveryMethod);
  const [shippingDays, setShippingDays] = useState(String(item.shippingDays));
  const [shipFromRegion, setShipFromRegion] = useState(item.shipFromRegion);
  const [size, setSize] = useState(item.size || '');
  const [color, setColor] = useState(item.color || '');
  const [tags, setTags] = useState(item.tags || '');

  // 画像ファイル入力をリセットするためのkeyです。
  const [imageInputKey, setImageInputKey] = useState(0);

  // 画像変換中や保存エラーを画面へ出します。
  const [isImageConverting, setIsImageConverting] = useState(false);
  const [error, setError] = useState('');

  // sold/canceled の商品は情報改変を避けるため編集・キャンセル不可にします。
  const canEdit = item.status === 'available';

  // 取引の次アクションを出品者に提示します。
  const next = nextPurchaseStep(item.purchaseStatus);

  // 親一覧の再取得で item が更新されたとき、編集フォームも最新の値に同期します。
  useEffect(() => {
    if (isEditing) return;
    resetEditForm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.updatedAt, item.imageUrl, item.status]);

  function clearErrorOnEdit() {
    // バリデーションエラーは、入力を直した時点で消します。
    // これにより「発送元の地域を入力してください」が解決後も残る問題を防ぎます。
    if (error) setError('');
  }

  async function onImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    // 出品時と同じく、ファイルアプリから選んだ複数画像をData URLへ圧縮変換します。
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setError('');
    setIsImageConverting(true);
    try {
      const converted = await Promise.all(files.map((file) => fileToCompressedDataUrl(file)));
      setImageUrls((current) => [...current, ...converted]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像の読み込みに失敗しました');
    } finally {
      setIsImageConverting(false);
      setImageInputKey((current) => current + 1);
    }
  }

  function removeImage(index: number) {
    // 登録済み画像や誤選択した画像を、1枚単位で削除します。
    clearErrorOnEdit();
    setImageUrls((current) => current.filter((_, i) => i !== index));
    setImageInputKey((current) => current + 1);
  }

  function resetEditForm(close = true) {
    // 編集を取り消した場合は、商品データの値に戻します。
    setTitle(item.title);
    setCategory(item.category);
    setConditionText(item.conditionText);
    setPriceInput(String(item.priceYen));
    setImageUrls(parseImageUrls(item.imageUrl));
    setDescription(item.description);
    setDeliveryMethod(item.deliveryMethod);
    setShippingDays(String(item.shippingDays));
    setShipFromRegion(item.shipFromRegion);
    setSize(item.size || '');
    setColor(item.color || '');
    setTags(item.tags || '');
    setError('');
    setImageInputKey((current) => current + 1);
    if (close) setIsEditing(false);
  }

  async function cancelListing() {
    // 出品キャンセル時はバックエンド側で出品者とチェックリスト登録者へ通知します。
    setError('');
    if (!confirm('この出品をキャンセルしますか？')) return;
    try {
      await itemApi.cancel(item.id);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'キャンセルに失敗しました');
    }
  }

  async function ship() {
    // 発送通知を送ると、購入者側に受け取り評価依頼が通知されます。
    setError('');
    try {
      await itemApi.ship(item.id);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : '発送通知に失敗しました');
    }
  }

  async function save(event: FormEvent) {
    // 編集内容を検証してから、PUT /api/items/:id へ送ります。
    event.preventDefault();
    setError('');
    const priceYen = Number(priceInput);
    const days = Number(shippingDays);
    if (!title.trim() || !description.trim()) {
      setError('商品名と商品説明を入力してください');
      return;
    }
    if (!shipFromRegion.trim()) {
      setError('発送元の地域を入力してください');
      return;
    }
    if (!Number.isInteger(priceYen) || priceYen <= 0 || !Number.isInteger(days) || days <= 0) {
      setError('価格と発送日数を正しく入力してください');
      return;
    }
    try {
      await itemApi.update(item.id, {
        title,
        category,
        conditionText,
        priceYen,
        imageUrl: stringifyImageUrls(imageUrls),
        description,
        deliveryMethod,
        shippingDays: days,
        shipFromRegion,
        size,
        color,
        tags,
      });
      setError('');
      setIsEditing(false);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    }
  }

  const representativeImage = firstImageUrl(item.imageUrl);

  return (
    <article className="card historyCard">
      <div className="historyHeader">
        <div>
          <span className="productCode">{item.productCode}</span>
          <h2>{item.title}</h2>
          <p className="muted">最終更新日時: {formatDate(item.updatedAt)}</p>
        </div>
        <span className={`statusText ${item.status}`}>{statusLabel(item.status)}</span>
      </div>

      {!isEditing ? (
        <>
          {representativeImage && <img className="thumb" src={representativeImage} alt={item.title} />}
          <p>{item.description}</p>
          <dl className="meta compact">
            <dt>カテゴリ</dt><dd>{item.category}</dd>
            <dt>状態</dt><dd>{item.conditionText}</dd>
            <dt>価格</dt><dd>{formatYen(item.priceYen)}</dd>
            <dt>受け渡し</dt><dd>{item.deliveryMethod}</dd>
            <dt>発送目安</dt><dd>{item.shippingDays}日</dd>
            <dt>発送元</dt><dd>{item.shipFromRegion}</dd>
            <dt>購入者</dt><dd>{item.buyerName || '-'}</dd>
            <dt>お届け先</dt><dd>{item.buyerShippingAddress || '-'}</dd>
            <dt>現在の取引状態</dt><dd>{item.purchaseStatus ? <span className={`purchaseStatusBadge ${item.purchaseStatus}`}>{purchaseStatusLabel(item.purchaseStatus)}</span> : '-'}</dd>
            {next && <><dt>次の段階</dt><dd><strong>{next}</strong></dd></>}
            <dt>チェック数</dt><dd>♡ {item.checklistCount}</dd>
          </dl>
          <div className="actions">
            <Link className="button secondary" to={`/items/${item.id}`}>商品詳細を見る</Link>
            <button type="button" onClick={() => { setError(''); setIsEditing(true); }} disabled={!canEdit}>商品情報を編集</button>
            <button type="button" className="dangerButton" onClick={cancelListing} disabled={!canEdit}>出品キャンセル</button>
            {item.purchaseStatus === 'paid' && !item.shippedAt && <button type="button" onClick={ship}>発送通知を送る</button>}
            {item.shippedAt && <button type="button" className="secondaryButton" disabled>発送通知送信済み</button>}
          </div>
        </>
      ) : (
        <form onSubmit={save} className="form">
          <label>商品名<input value={title} onChange={(e) => { clearErrorOnEdit(); setTitle(e.target.value); }} required /></label>
          <label>カテゴリ<select value={category} onChange={(e) => { clearErrorOnEdit(); setCategory(e.target.value); }}>{categories.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>状態<select value={conditionText} onChange={(e) => { clearErrorOnEdit(); setConditionText(e.target.value); }}>{conditions.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>価格(円)<input value={priceInput} onChange={(e) => { clearErrorOnEdit(); setPriceInput(e.target.value.replace(/\D/g, '')); }} inputMode="numeric" required /></label>

          <label>
            商品画像
            <input key={imageInputKey} type="file" accept="image/*" multiple onChange={onImageFileChange} />
            {isImageConverting && <span className="muted">画像を読み込んでいます...</span>}
            {imageUrls.length > 0 ? (
              <>
                <p className="muted compactHint">ドラッグ&ドロップで、商品詳細や一覧で使う画像順を変更できます。</p>
                <ImageReorderGrid
                  imageUrls={imageUrls}
                  onChange={(next) => { clearErrorOnEdit(); setImageUrls(next); }}
                  onRemove={removeImage}
                  altPrefix="編集中の商品画像"
                />
              </>
            ) : <span className="muted">画像は登録されていません。</span>}
          </label>

          <label>受け渡し方法<select value={deliveryMethod} onChange={(e) => { clearErrorOnEdit(); setDeliveryMethod(e.target.value); }}>{deliveryMethods.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>発送までの日数<input value={shippingDays} onChange={(e) => { clearErrorOnEdit(); setShippingDays(e.target.value.replace(/\D/g, '')); }} /></label>
          <label>発送元地域<input value={shipFromRegion} onChange={(e) => { clearErrorOnEdit(); setShipFromRegion(e.target.value); }} /></label>
          <label>サイズ<select value={size} onChange={(e) => { clearErrorOnEdit(); setSize(e.target.value); }}>{sizes.map((x) => <option key={x} value={x}>{x || '選択しない'}</option>)}</select></label>
          <label>色<select value={color} onChange={(e) => { clearErrorOnEdit(); setColor(e.target.value); }}>{colors.map((x) => <option key={x} value={x}>{x || '選択しない'}</option>)}</select></label>
          <label>タグ<input value={tags} onChange={(e) => { clearErrorOnEdit(); setTags(e.target.value); }} /></label>
          <label>商品説明<textarea value={description} onChange={(e) => { clearErrorOnEdit(); setDescription(e.target.value); }} required /></label>
          <div className="actions">
            <button type="submit">保存する</button>
            <button type="button" className="secondaryButton" onClick={() => resetEditForm(true)}>戻る</button>
          </div>
        </form>
      )}
      {error && <p className="error">{error}</p>}
    </article>
  );
}

export function MyItemsPage() {
  // 出品履歴一覧です。
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
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

  useEffect(() => { load(); }, []);

  // 「数学」⇔「すうがく」、「ギター」⇔「ぎたー」などを searchUtils で柔軟に判定します。
  const filtered = useMemo(() => items.filter((item) => fuzzyIncludes(itemSearchText(item), query)), [items, query]);

  return (
    <section className="stack">
      {searchParams.get('created') === '1' && <p className="success">出品が完了しました。</p>}
      <div className="pageTitleRow"><h1>出品履歴</h1><Link className="button" to="/items/new">新しく出品する</Link></div>
      {error && <p className="error">{error}</p>}
      <div className="card inlineSearch"><label><span>出品履歴内検索</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="商品名、カテゴリ、購入者など" /></label></div>
      {items.length === 0 ? <p className="muted">まだ出品した商品はありません。</p> : filtered.length === 0 ? <p className="muted">該当する商品はありません。</p> : filtered.map((item) => <EditableItemCard key={item.id} item={item} onChanged={load} />)}
    </section>
  );
}
