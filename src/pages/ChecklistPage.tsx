/**
 * ファイル概要: hackathon-frontend/src/pages/ChecklistPage.tsx
 *
 * 役割:
 * チェックリスト商品を販売中/売却済みに分けて検索・閲覧できる画面です。
 *
 */

/**
 * 実装詳細メモ:
 * 気になる商品を保存するチェックリスト画面です。
 * 一覧から削除したときにローカルstateも即時更新し、API完了後の再取得を待たずに操作結果が分かるようにしています。
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { checklistApi, meApi } from '../api/client';
import { fuzzyIncludes, itemSearchText } from '../searchUtils';
import type { Item } from '../types';
import { firstImageUrl, formatDate, formatYen, isVideoUrl, statusLabel } from '../utils';

// ChecklistItemCard は、チェックリスト内の商品を1件表示するためのカードです。
// 商品詳細へのリンクとチェックリスト削除操作を同じカードにまとめ、一覧からすぐ購入検討を再開できるようにします。
function ChecklistItemCard({ item, onRemove }: { item: Item; onRemove: (id: number) => Promise<void> }) {
  // チェックリストのカードは、商品詳細へ遷移しやすい概要表示に絞ります。
  // 詳しいコメント・DM・価格交渉・購入導線は商品詳細ページに集約します。
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

// ChecklistPage は、ログインユーザーが保存した「気になる商品」を管理する画面です。
// AvailableとSOLDを分けることで、今買える商品と売り切れた商品を同じ検索語で見比べられます。
export function ChecklistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  // load は、本人のチェックリスト商品をAPIから取得してstateへ反映します。
  // meApi.checklist側でnullを配列に正規化しているため、画面では常にmap/filterできる配列として扱えます。
  async function load() {
    setError('');
    try {
      setItems(await meApi.checklist());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チェックリストの取得に失敗しました');
    }
  }
  useEffect(() => { load(); }, []);

  // 検索はAvailable/SOLDの両方を対象に行い、その後で左右の列に分けます。
  const filtered = useMemo(() => items.filter((item) => fuzzyIncludes(itemSearchText(item), query)), [items, query]);

  // Available商品は、古い更新ほど上に置き、価格変更や販売停滞に気づきやすくします。
  const availableItems = useMemo(() => filtered.filter((item) => item.status === 'available').sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()), [filtered]);

  // SOLD商品は、売れた直近商品を見返しやすくするため、新しい更新ほど上に置きます。
  const soldItems = useMemo(() => filtered.filter((item) => item.status === 'sold').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [filtered]);

  // remove は、指定商品をチェックリストから外し、完了後に一覧を再取得します。
  // サーバー側の状態を再読込することで、チェックリスト数や商品ステータスの最新値も一緒に反映されます。
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
