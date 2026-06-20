/**
 * ファイル概要: hackathon-frontend/src/pages/ChecklistPage.tsx
 *
 * 役割:
 * チェックリスト商品を販売中/売却済みに分けて検索・閲覧できる画面です。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { checklistApi, meApi } from '../api/client';
import { fuzzyIncludes, itemSearchText } from '../searchUtils';
import type { Item } from '../types';
import { firstImageUrl, formatDate, formatYen, isVideoUrl, statusLabel } from '../utils';

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function ChecklistItemCard({ item, onRemove }: { item: Item; onRemove: (id: number) => Promise<void> }) {
  // チェックリストのカードは、商品詳細へ遷移しやすい概要表示に絞ります。
  // 詳しいコメント・DM・価格交渉・購入導線は商品詳細ページに集約します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const representativeMedia = firstImageUrl(item.imageUrl);
  return (
    <article className="card historyCard compactHistoryCard">
      <Link className="historyCardLink" to={`/items/${item.id}`} aria-label={`${item.title}の商品詳細へ移動`}>
        <div className="historyHeader">
          <div>
            <span className="productCode">{item.productCode}</span>
            <h2>{item.title}</h2>
            <p className="muted">最終更新日時: {formatDate(item.updatedAt)}</p>
          </div>
          <span className={`statusText ${item.status}`}>{statusLabel(item.status)}</span>
        </div>
        {representativeMedia && (isVideoUrl(representativeMedia) ? <video className="thumb" src={representativeMedia} muted playsInline /> : <img className="thumb" src={representativeMedia} alt={item.title} />)}
        <p className="historyDescription">{item.description}</p>
        <strong>{formatYen(item.priceYen)}</strong>
        <p className="likeCount">♡ {item.checklistCount}</p>
      </Link>
      <div className="actions">
        <Link className="button secondary" to={`/items/${item.id}`}>商品詳細を見る</Link>
        <button type="button" className="dangerButton" onClick={() => onRemove(item.id)}>チェックリストから外す</button>
      </div>
    </article>
  );
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function ChecklistPage() {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [items, setItems] = useState<Item[]>([]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [query, setQuery] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setItems(await meApi.checklist());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チェックリストの取得に失敗しました');
    }
  }

  // 【副作用】useEffectは、画面表示後のAPI取得、イベント登録、タイマー管理などReact外部との接続点です。
  useEffect(() => { load(); }, []);

  // 検索はAvailable/SOLDの両方を対象に行い、その後で左右の列に分けます。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const filtered = useMemo(() => items.filter((item) => fuzzyIncludes(itemSearchText(item), query)), [items, query]);

  // Available商品は、古い更新ほど上に置き、価格変更や販売停滞に気づきやすくします。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const availableItems = useMemo(() => filtered.filter((item) => item.status === 'available').sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()), [filtered]);

  // SOLD商品は、売れた直近商品を見返しやすくするため、新しい更新ほど上に置きます。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const soldItems = useMemo(() => filtered.filter((item) => item.status === 'sold').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [filtered]);

  async function remove(id: number) {
    setError('');
    try {
      await checklistApi.remove(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チェックリストから外せませんでした');
    }
  }

  return (
    <section className="stack fullWidthPage historySplitPage">
      <h1>チェックリスト</h1>
      <p className="muted">気になった商品を保存します。商品情報が更新された場合は通知にも表示されます。</p>
      {error && <p className="error">{error}</p>}
      <div className="card inlineSearch"><label><span>チェックリスト内検索</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="商品名、カテゴリ、色など" /></label></div>
      {items.length === 0 ? <p className="muted">チェックリストに商品はありません。</p> : filtered.length === 0 ? <p className="muted">該当する商品はありません。</p> : (
        <div className="historyTwoColumnLayout">
          <section className="historyColumn availableColumn">
            <div className="historyColumnHeader"><h2>Available</h2><span>{availableItems.length}件</span></div>
            <p className="muted compactHint">購入可能な商品を、更新時刻が古い順に表示します。</p>
            <div className="historyColumnList">{availableItems.map((item) => <ChecklistItemCard key={item.id} item={item} onRemove={remove} />)}{availableItems.length === 0 && <p className="muted emptyColumnText">該当するAvailable商品はありません。</p>}</div>
          </section>
          <section className="historyColumn soldColumn">
            <div className="historyColumnHeader"><h2>SOLD</h2><span>{soldItems.length}件</span></div>
            <p className="muted compactHint">売り切れた商品を、更新時刻が新しい順に表示します。</p>
            <div className="historyColumnList">{soldItems.map((item) => <ChecklistItemCard key={item.id} item={item} onRemove={remove} />)}{soldItems.length === 0 && <p className="muted emptyColumnText">該当するSOLD商品はありません。</p>}</div>
          </section>
        </div>
      )}
    </section>
  );
}
