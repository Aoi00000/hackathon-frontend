import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { itemApi, meApi } from '../api/client';
import { fuzzyIncludes, itemSearchText } from '../searchUtils';
import type { PurchaseHistory } from '../types';
import { firstImageUrl, formatDate, formatYen, isVideoUrl, nextPurchaseStep, purchaseStatusLabel, ratingStars, safeNumber, statusLabel } from '../utils';

function purchaseSearchText(row: PurchaseHistory): string {
  // 購入履歴検索では、商品情報に加えて出品者名も検索対象にします。
  // itemSearchText は Item 風のオブジェクトを受け取るため、PurchaseHistoryにsellerNameを補って渡します。
  return itemSearchText({ ...row, sellerName: row.sellerName });
}

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

export function PurchaseHistoryPage() {
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searchParams] = useSearchParams();

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

  // 未完了取引は、古いものから上に出すことで、対応が遅れている取引に気づきやすくします。
  const ongoing = useMemo(() => filtered.filter((row) => row.purchaseStatus !== 'completed').sort((a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()), [filtered]);

  // 完了済み取引は、新しいものから上に出すことで、最近の購入履歴を見返しやすくします。
  const completed = useMemo(() => filtered.filter((row) => row.purchaseStatus === 'completed').sort((a, b) => new Date(b.completedAt ?? b.purchasedAt).getTime() - new Date(a.completedAt ?? a.purchasedAt).getTime()), [filtered]);

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
            <p className="muted compactHint">受け取り評価がまだ完了していない商品を、古い順に表示します。</p>
            <div className="historyColumnList">{ongoing.map((row) => <PurchaseHistoryCard key={row.purchaseId} row={row} onComplete={complete} />)}{ongoing.length === 0 && <p className="muted emptyColumnText">未完了の取引はありません。</p>}</div>
          </section>
          <section className="historyColumn completedColumn">
            <div className="historyColumnHeader"><h2>取引完了</h2><span>{completed.length}件</span></div>
            <p className="muted compactHint">受け取り評価まで終わった商品を、新しい順に表示します。</p>
            <div className="historyColumnList">{completed.map((row) => <PurchaseHistoryCard key={row.purchaseId} row={row} onComplete={complete} />)}{completed.length === 0 && <p className="muted emptyColumnText">完了済みの取引はありません。</p>}</div>
          </section>
        </div>
      )}
    </section>
  );
}
