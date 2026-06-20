/**
 * ファイル概要: hackathon-frontend/src/pages/MyItemsPage.tsx
 *
 * 役割:
 * 自分の出品を販売中/売却済みに分け、編集や取引状況確認へつなげる画面です。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { itemApi, meApi } from '../api/client';
import { ImageReorderGrid } from '../components/ImageReorderGrid';
import { categories, colors, conditions, deliveryMethods, sizes } from '../formOptions';
import { fileToMediaDataUrl } from '../imageUpload';
import { fuzzyIncludes, itemSearchText } from '../searchUtils';
import type { Item } from '../types';
import {
  firstImageUrl,
  isVideoUrl,
  formatDate,
  formatYen,
  nextPurchaseStep,
  parseImageUrls,
  purchaseStatusLabel,
  statusLabel,
  stringifyImageUrls,
} from '../utils';

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function EditableItemCard({ item, onChanged }: { item: Item; onChanged: () => Promise<void> }) {
  // 編集モードのON/OFFです。販売中の商品だけ編集可能にします。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [isEditing, setIsEditing] = useState(false);

  // 編集フォームの入力値です。初期値は現在の商品情報から作ります。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [title, setTitle] = useState(item.title);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [category, setCategory] = useState(item.category);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [conditionText, setConditionText] = useState(item.conditionText);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [priceInput, setPriceInput] = useState(String(item.priceYen));
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [imageUrls, setImageUrls] = useState<string[]>(() => parseImageUrls(item.imageUrl));
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [description, setDescription] = useState(item.description);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [deliveryMethod, setDeliveryMethod] = useState(item.deliveryMethod);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [shippingDays, setShippingDays] = useState(String(item.shippingDays));
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [shipFromRegion, setShipFromRegion] = useState(item.shipFromRegion);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [size, setSize] = useState(item.size || '');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [color, setColor] = useState(item.color || '');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [tags, setTags] = useState(item.tags || '');

  // 画像ファイル入力をリセットするためのkeyです。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [imageInputKey, setImageInputKey] = useState(0);

  // 画像変換中や保存エラーを画面へ出します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [isImageConverting, setIsImageConverting] = useState(false);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [error, setError] = useState('');

  // sold/canceled の商品は情報改変を避けるため編集・キャンセル不可にします。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const canEdit = item.status === 'available';

  // 取引の次アクションを出品者に提示します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const next = nextPurchaseStep(item.purchaseStatus);

  // 親一覧の再取得で item が更新されたとき、編集フォームも最新の値に同期します。
  // 【副作用】useEffectは、画面表示後のAPI取得、イベント登録、タイマー管理などReact外部との接続点です。
  useEffect(() => {
    if (isEditing) return;
    resetEditForm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.updatedAt, item.imageUrl, item.status]);

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  function clearErrorOnEdit() {
    // バリデーションエラーは、入力を直した時点で消します。
    // これにより「発送元の地域を入力してください」が解決後も残る問題を防ぎます。
    if (error) setError('');
  }

  async function onImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    // 出品時と同じく、ファイルアプリから選んだ複数画像をData URLへ圧縮変換します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setError('');
    setIsImageConverting(true);
    try {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
      const converted = await Promise.all(files.map((file) => fileToMediaDataUrl(file)));
      setImageUrls((current) => [...current, ...converted]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像・動画の読み込みに失敗しました');
    } finally {
      setIsImageConverting(false);
      setImageInputKey((current) => current + 1);
    }
  }

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  function removeImage(index: number) {
    // 登録済み画像や誤選択した画像を、1枚単位で削除します。
    clearErrorOnEdit();
    setImageUrls((current) => current.filter((_, i) => i !== index));
    setImageInputKey((current) => current + 1);
  }

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
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
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const priceYen = Number(priceInput);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
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

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
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
          <Link className="historyCardLink" to={`/items/${item.id}`} aria-label={`${item.title} の商品情報詳細を開く`}>
            {representativeImage && (isVideoUrl(representativeImage) ? <video className="thumb" src={representativeImage} muted playsInline /> : <img className="thumb" src={representativeImage} alt={item.title} />)}
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
          </Link>
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
            商品画像・動画
            <input key={imageInputKey} type="file" accept="image/*,video/*" multiple onChange={onImageFileChange} />
            {isImageConverting && <span className="muted">画像・動画を読み込んでいます...</span>}
            {imageUrls.length > 0 ? (
              <>
                <p className="muted compactHint">ドラッグ&ドロップで、商品詳細や一覧で使う画像・動画の順番を変更できます。</p>
                <ImageReorderGrid
                  imageUrls={imageUrls}
                  onChange={(next) => { clearErrorOnEdit(); setImageUrls(next); }}
                  onRemove={removeImage}
                  altPrefix="編集中の商品画像・動画"
                />
              </>
            ) : <span className="muted">画像・動画は登録されていません。</span>}
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

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function MyItemsPage() {
  // 出品履歴一覧です。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [items, setItems] = useState<Item[]>([]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [query, setQuery] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [error, setError] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [searchParams] = useSearchParams();

  async function load() {
    setError('');
    try {
      setItems(await meApi.items());
    } catch (e) {
      setError(e instanceof Error ? e.message : '出品履歴の取得に失敗しました');
    }
  }

  // 【副作用】useEffectは、画面表示後のAPI取得、イベント登録、タイマー管理などReact外部との接続点です。
  useEffect(() => { load(); }, []);

  // 「数学」⇔「すうがく」、「ギター」⇔「ぎたー」などを searchUtils で柔軟に判定します。
  // 検索後に左右2列へ分けることで、検索対象としては全商品を保ちながら、表示は取引状態ごとに整理します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const filtered = useMemo(() => items.filter((item) => fuzzyIncludes(itemSearchText(item), query)), [items, query]);

  // Available列は、売れ残り期間が長いものを上に出すため、更新時刻が古い順に並べます。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const availableItems = useMemo(() => filtered.filter((item) => item.status === 'available').sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()), [filtered]);

  // SOLD列は、直近の取引確認をしやすくするため、更新時刻が新しい順に並べます。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const soldItems = useMemo(() => filtered.filter((item) => item.status === 'sold').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [filtered]);

  return (
    <section className="stack fullWidthPage historySplitPage">
      {searchParams.get('created') === '1' && <p className="success">出品が完了しました。</p>}
      <div className="pageTitleRow"><h1>出品履歴</h1><Link className="button" to="/items/new">新しく出品する</Link></div>
      {error && <p className="error">{error}</p>}
      <div className="card inlineSearch"><label><span>出品履歴内検索</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="商品名、カテゴリ、購入者など" /></label></div>
      {items.length === 0 ? <p className="muted">まだ出品した商品はありません。</p> : filtered.length === 0 ? <p className="muted">該当する商品はありません。</p> : (
        <div className="historyTwoColumnLayout">
          <section className="historyColumn availableColumn">
            <div className="historyColumnHeader"><h2>Available</h2><span>{availableItems.length}件</span></div>
            <p className="muted compactHint">更新時刻が古い順に表示します。長く売れ残っている商品を上から確認できます。</p>
            <div className="historyColumnList">{availableItems.map((item) => <EditableItemCard key={item.id} item={item} onChanged={load} />)}{availableItems.length === 0 && <p className="muted emptyColumnText">該当するAvailable商品はありません。</p>}</div>
          </section>
          <section className="historyColumn soldColumn">
            <div className="historyColumnHeader"><h2>SOLD</h2><span>{soldItems.length}件</span></div>
            <p className="muted compactHint">更新時刻が新しい順に表示します。最近の取引状況をすぐ確認できます。</p>
            <div className="historyColumnList">{soldItems.map((item) => <EditableItemCard key={item.id} item={item} onChanged={load} />)}{soldItems.length === 0 && <p className="muted emptyColumnText">該当するSOLD商品はありません。</p>}</div>
          </section>
        </div>
      )}
    </section>
  );
}
