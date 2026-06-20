/**
 * ファイル概要: hackathon-frontend/src/pages/PurchaseHistoryPage.tsx
 *
 * 役割:
 * 購入履歴を取引中/完了済みに分け、発送確認や受け取り評価へ進める画面です。
 *
 */

/**
 * 実装詳細メモ:
 * 購入済み商品の進行状況を、発送待ち・受取評価待ち・完了に分けて表示します。
 * 評価送信は購入完了APIと直結し、出品者の評価平均や取引数の更新につながります。
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { itemApi, meApi } from '../api/client';
import { fuzzyIncludes, itemSearchText } from '../searchUtils';
import type { PurchaseHistory } from '../types';
import { firstImageUrl, formatDate, formatYen, isVideoUrl, nextPurchaseStep, purchaseStatusLabel, ratingStars, safeNumber, statusLabel } from '../utils';

// purchaseSearchText は、購入履歴1件を検索用の長い文字列へ変換します。
// 商品名だけでなく出品者名やカテゴリも検索対象にすることで、過去の取引を思い出しやすくします。
function purchaseSearchText(row: PurchaseHistory): string {
  // 購入履歴検索では、商品情報に加えて出品者名も検索対象にします。
  // itemSearchText は Item 風のオブジェクトを受け取るため、PurchaseHistoryにsellerNameを補って渡します。
  return itemSearchText({ ...row, sellerName: row.sellerName });
}

// PurchaseHistoryCard は、購入履歴の商品1件と取引状態を表示するカードです。
// shipped状態の取引では、同じカード内で受け取り評価を送れるようにし、取引完了までの導線を短くします。
function PurchaseHistoryCard({ row, onComplete }: { row: PurchaseHistory; onComplete: (event: FormEvent, row: PurchaseHistory) => Promise<void> }) {
  // カード内で評価入力を持つため、各商品ごとに独立したstateを用意します。
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const next = nextPurchaseStep(row.purchaseStatus);
  const representativeMedia = firstImageUrl(row.imageUrl);

  return (
    <article className="card historyCard compactHistoryCard">
      <Link className="historyCardLink" to={`/items/${row.itemId}`} aria-label={`${row.title}の商品詳細へ移動`}>
        <div className="historyHeader">
          <div>
            <span className="productCode">{row.productCode}</span>
            <h2>{row.title}</h2>
            <p className="muted">購入日時: {formatDate(row.purchasedAt)}</p>
            <p className="muted">発送期限: {formatDate(row.shippingDeadline)}</p>
          </div>
          <strong>{formatYen(row.priceYen)}</strong>
        </div>
        {representativeMedia && (isVideoUrl(representativeMedia) ? <video className="thumb" src={representativeMedia} muted playsInline /> : <img className="thumb" src={representativeMedia} alt={row.title} />)}
        <p className="historyDescription">{row.description}</p>
      </Link>

      <dl className="meta compact">
        <dt>出品者</dt><dd>{row.sellerName}</dd>
        <dt>出品者評価</dt><dd>{row.sellerRatingCount ? <><span className="stars">{ratingStars(row.sellerRatingAverage)}</span> {safeNumber(row.sellerRatingAverage).toFixed(1)} / 5.0 ({row.sellerRatingCount}件)</> : '評価なし'}</dd>
        <dt>状態</dt><dd>{row.conditionText}</dd>
        <dt>商品状態</dt><dd>{statusLabel(row.status)}</dd>
        <dt>現在の取引状態</dt><dd><span className={`purchaseStatusBadge ${row.purchaseStatus}`}>{purchaseStatusLabel(row.purchaseStatus)}</span></dd>
        {next && <><dt>次の段階</dt><dd><strong>{next}</strong></dd></>}
        <dt>受け渡し</dt><dd>{row.deliveryMethod}</dd>
        <dt>発送元</dt><dd>{row.shipFromRegion}</dd>
        <dt>お届け先</dt><dd>{row.deliveryAddress}</dd>
        {row.shippedAt && <><dt>発送通知</dt><dd>{formatDate(row.shippedAt)} <span className="statusText shipped">発送通知送信済み</span></dd></>}
        {row.completedAt && <><dt>取引完了</dt><dd>{formatDate(row.completedAt)} <span className="statusText completed">受け取り評価済み</span></dd><dt>受け取り評価</dt><dd><span className="stars">{ratingStars(row.rating ?? 0)}</span> {row.rating ? `${row.rating}.0 / 5.0` : ''}{row.ratingComment ? ` ： ${row.ratingComment}` : ''}</dd></>}
      </dl>

      <div className="actions">
        <Link className="button secondary" to={`/items/${row.itemId}`}>商品詳細を見る</Link>
      </div>

      {row.purchaseStatus === 'shipped' && (
        <form className="form inlineForm" onSubmit={(event) => onComplete(event, { ...row, rating: Number(rating), ratingComment: comment })}>
          <label>受け取り評価
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="5">★★★★★ 5</option>
              <option value="4">★★★★☆ 4</option>
              <option value="3">★★★☆☆ 3</option>
              <option value="2">★★☆☆☆ 2</option>
              <option value="1">★☆☆☆☆ 1</option>
            </select>
          </label>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="評価コメント" />
          <button type="submit">受け取り評価をする</button>
        </form>
      )}
    </article>
  );
}

// PurchaseHistoryPage は、購入者視点の取引履歴を「取引中」と「取引完了」に分けて表示します。
// 各列の初期順序は従来どおり維持し、古い順と新しい順を利用者が切り替えられるようにします。
export function PurchaseHistoryPage() {
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [ongoingSort, setOngoingSort] = useState<'oldest' | 'newest'>('oldest');
  const [completedSort, setCompletedSort] = useState<'oldest' | 'newest'>('newest');
  const [searchParams] = useSearchParams();

  // load は、本人の購入履歴をAPIから取得してstateへ入れます。
  // 受け取り評価後にも呼び直すことで、purchaseStatusや評価情報を最新に保ちます。
  async function load() {
    setError('');
    try {
      setHistory(await meApi.purchases());
    } catch (e) {
      setError(e instanceof Error ? e.message : '購入履歴の取得に失敗しました');
    }
  }
  useEffect(() => { load(); }, []);

  // 検索対象は左右の列で共通です。
  // まず検索で全体を絞り込み、その後に未完了/完了へ分けることで、どちらの列の商品も検索できます。
  const filtered = useMemo(() => history.filter((row) => fuzzyIncludes(purchaseSearchText(row), query)), [history, query]);

  // 未完了取引は従来どおり古い順を初期値にし、購入日時を基準に切り替えます。
  const ongoing = useMemo(() => filtered.filter((row) => row.purchaseStatus !== 'completed').sort((a, b) => {
    const difference = new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime();
    return ongoingSort === 'oldest' ? difference : -difference;
  }), [filtered, ongoingSort]);

  // 完了済み取引は従来どおり新しい順を初期値にし、完了日時を基準に切り替えます。
  const completed = useMemo(() => filtered.filter((row) => row.purchaseStatus === 'completed').sort((a, b) => {
    const difference = new Date(a.completedAt ?? a.purchasedAt).getTime() - new Date(b.completedAt ?? b.purchasedAt).getTime();
    return completedSort === 'oldest' ? difference : -difference;
  }), [completedSort, filtered]);

  // complete は、購入者の受け取り評価をバックエンドへ送る処理です。
  // 完了すると出品者の評価平均・取引数・売上残高が更新されるため、送信後に履歴を再取得します。
  async function complete(event: FormEvent, row: PurchaseHistory) {
    event.preventDefault();
    try {
      await itemApi.complete(row.itemId, row.rating ?? 5, row.ratingComment ?? '');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '受け取り評価に失敗しました');
    }
  }

  return (
    <section className="stack fullWidthPage historySplitPage">
      {searchParams.get('purchased') === '1' && <p className="success">購入が完了しました。</p>}
      <h1>購入履歴</h1>
      {error && <p className="error">{error}</p>}
      <div className="card inlineSearch"><label><span>購入履歴内検索</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="商品名、カテゴリ、出品者など" /></label></div>
      {history.length === 0 ? <p className="muted">まだ購入した商品はありません。</p> : filtered.length === 0 ? <p className="muted">該当する商品はありません。</p> : (
        <div className="historyTwoColumnLayout">
          <section className="historyColumn ongoingColumn">
            <div className="historyColumnHeader"><h2>取引中</h2><span>{ongoing.length}件</span></div>
            <label className="historySortControl">並び順<select value={ongoingSort} onChange={(e) => setOngoingSort(e.target.value as 'oldest' | 'newest')}><option value="oldest">古い順</option><option value="newest">新しい順</option></select></label>
            <p className="muted compactHint">購入日時を基準に並べます。</p>
            <div className="historyColumnList">{ongoing.map((row) => <PurchaseHistoryCard key={row.purchaseId} row={row} onComplete={complete} />)}{ongoing.length === 0 && <p className="muted emptyColumnText">未完了の取引はありません。</p>}</div>
          </section>
          <section className="historyColumn completedColumn">
            <div className="historyColumnHeader"><h2>取引完了</h2><span>{completed.length}件</span></div>
            <label className="historySortControl">並び順<select value={completedSort} onChange={(e) => setCompletedSort(e.target.value as 'oldest' | 'newest')}><option value="oldest">古い順</option><option value="newest">新しい順</option></select></label>
            <p className="muted compactHint">取引完了日時を基準に並べます。</p>
            <div className="historyColumnList">{completed.map((row) => <PurchaseHistoryCard key={row.purchaseId} row={row} onComplete={complete} />)}{completed.length === 0 && <p className="muted emptyColumnText">完了済みの取引はありません。</p>}</div>
          </section>
        </div>
      )}
    </section>
  );
}
