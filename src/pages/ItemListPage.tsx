/**
 * ファイル概要: hackathon-frontend/src/pages/ItemListPage.tsx
 *
 * 役割:
 * 商品一覧、検索、保存検索、AI自然言語検索、MerRec風おすすめを表示するメイン画面です。
 *
 */

/**
 * 実装詳細メモ:
 * 通常検索、自然言語検索、保存検索、推薦表示が同じItemSearchParamsへ集約される点がこの画面の中心です。
 * AI検索は最終的に通常検索フォームへ反映するため、バックエンドのフィルタ処理と画面表示を二重実装しない構成になっています。
 */
/**
 * 商品一覧ページ。
 *
 * この画面は、Demo Dayで最初に見せるトップページであり、
 * 1. Amazon/Mercari風の左サイドバー検索、
 * 2. Gemini/Vertex AIまたはローカル規則による自然言語検索、
 * 3. C2C取引傾向を想定したおすすめ商品表示、
 * 4. コンパクトな商品カード一覧
 * をまとめて担当します。
 *
 * 自然言語検索は、既存の検索フォームの状態へ変換してから通常の商品一覧APIを呼びます。
 * これにより、AI検索と通常検索で検索ロジックが二重化しないようにしています。
 */
import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { aiApi, itemApi, meApi, type ItemSearchParams } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useI18n, translateKnownValue } from '../i18n';
import { TranslatedText } from '../TranslatedText';
import { colors, conditions, deliveryWithinOptions, searchableCategories, sizes } from '../formOptions';
import { describeSavedSearch, parseSavedSearchQuery } from '../savedSearch';
import type { Item, ItemStatus, RecommendationResponse, SavedSearch } from '../types';
import { formatYen, firstImageUrl, statusLabel } from '../utils';

// 商品一覧の販売状況フィルタで使う候補です。
// DB上の値は available / sold ですが、画面では分かりやすいラベルで表示します。
const statuses: Array<{ value: ItemStatus; label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'SOLD' },
];

// 左サイドバーの複数選択フィルタを共通化するためのpropsです。
type OptionGroupProps = {
  title: string;
  values: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  translateLabel?: (value: string) => string;
};

// チェックボックス1つを押したとき、選択済みなら外し、未選択なら追加します。
function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

// Amazon風サイドバーの折りたたみフィルタです。
// details/summaryを使うことで、少ない実装で開閉UIとキーボード操作を両立します。
function MultiFilter({ title, values, selected, onChange, translateLabel = (v) => v }: OptionGroupProps) {
  const selectedLabel = selected.length > 0 ? `（${selected.length}件）` : '';

  return (
    <details className="filterDetails">
      <summary>{translateLabel(title)}{selectedLabel}</summary>
      <div className="checkboxList">
        {values.filter(Boolean).map((value) => {
          const displayValue = translateLabel(statuses.find((s) => s.value === value)?.label ?? value);
          return (
            <label key={value} className="checkboxOption">
              <input type="checkbox" checked={selected.includes(value)} onChange={() => onChange(toggleValue(selected, value))} />
              <span>{displayValue}</span>
            </label>
          );
        })}
      </div>
    </details>
  );
}

// APIの検索パラメータはカンマ区切り文字列で送るため、配列との相互変換をまとめます。
// join は、チェックボックスで複数選択されたカテゴリ・サイズ・色などをURLクエリ用の文字列へ変換します。
function join(values: string[]): string { return values.join(','); }

// split は、保存検索やURLから戻ってきたカンマ区切り条件を、チェックボックス用の配列へ戻します。
// 空文字は未選択として扱い、filter(Boolean)で余分な空要素を取り除きます。
function split(value?: string): string[] { return value ? value.split(',').filter(Boolean) : []; }

// Goのnil sliceがJSON nullになる場合でも、React側では常に配列として扱います。
function safeRecommendationItems(recommendation: RecommendationResponse | null): Item[] {
  return Array.isArray(recommendation?.items) ? recommendation.items : [];
}

// ItemListPage は、商品一覧、検索フォーム、自然言語検索、保存検索、MerRec風おすすめをまとめるトップ画面です。
// AI検索も最終的には通常検索パラメータへ変換し、一覧APIを再利用することで検索ロジックの重複を避けています。
export function ItemListPage() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const [searchParams] = useSearchParams();

  // 通常検索フォームの状態です。保存検索条件や自然言語検索も最終的にはここへ反映します。
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [tag, setTag] = useState('');
  const [deliveryWithin, setDeliveryWithin] = useState('');
  const [sort, setSort] = useState('recommended');

  // 商品一覧、レコメンド、保存検索条件の状態です。
  const [items, setItems] = useState<Item[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // 生成AIを活用した自然言語検索用の状態です。
  // AIが使えない場合もバックエンド側でローカル規則にフォールバックします。
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [naturalLanguageMessage, setNaturalLanguageMessage] = useState('');
  const [naturalLanguageError, setNaturalLanguageError] = useState('');
  const [isNaturalLanguageLoading, setIsNaturalLanguageLoading] = useState(false);

  // 画面全体の検索・エラー・保存メッセージ状態です。
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveName, setSaveName] = useState('');
  const [message, setMessage] = useState('');

  // 現在の検索フォーム状態をAPIパラメータへ変換します。
  function currentParams(): ItemSearchParams {
    return {
      q,
      category: join(categories),
      size: join(selectedSizes),
      color: join(selectedColors),
      condition: join(selectedConditions),
      status: join(selectedStatuses),
      minPrice,
      maxPrice,
      tag,
      deliveryWithin,
      sort,
    };
  }

  // 保存検索条件・自然言語検索・リセットなどから、一括でフォーム状態を更新します。
  function applyParams(params: ItemSearchParams) {
    setQ(params.q ?? '');
    setCategories(split(params.category));
    setSelectedSizes(split(params.size));
    setSelectedColors(split(params.color));
    setSelectedConditions(split(params.condition));
    setSelectedStatuses(split(params.status));
    setMinPrice(params.minPrice ?? '');
    setMaxPrice(params.maxPrice ?? '');
    setTag(params.tag ?? '');
    setDeliveryWithin(params.deliveryWithin ?? '');
    setSort(params.sort ?? 'recommended');
  }

  // 商品一覧を取得します。
  async function loadItems(params = currentParams(), searched = true) {
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      setItems(await itemApi.list(params));
      setIsSearched(searched);
    } catch (e) {
      setError(e instanceof Error ? e.message : '商品一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }

  // 保存検索条件を読み込みます。未ログイン時は空にします。
  async function loadSavedSearches() {
    if (!user) {
      setSavedSearches([]);
      return;
    }
    setSavedSearches(await meApi.savedSearches().catch(() => []));
  }

  // 初回表示では「検索結果なし」の表示を出さず、通常の商品一覧だけ取得します。
  useEffect(() => { loadItems(currentParams(), false); }, []);
  useEffect(() => { loadSavedSearches(); }, [user?.id]);

  // レコメンドは少し遅れても枠が常に見えるよう、ロード中表示を出します。
  useEffect(() => {
    let cancelled = false;
    async function loadRecommendations() {
      setRecommendationError('');
      if (!user) {
        setRecommendation(null);
        setIsRecommendationLoading(false);
        return;
      }
      setIsRecommendationLoading(true);
      try {
        const data = await meApi.recommendations();
        if (!cancelled) setRecommendation(data);
      } catch (e) {
        if (!cancelled) {
          setRecommendation(null);
          setRecommendationError(e instanceof Error ? e.message : 'おすすめの取得に失敗しました');
        }
      } finally {
        if (!cancelled) setIsRecommendationLoading(false);
      }
    }
    loadRecommendations();
    return () => { cancelled = true; };
  }, [user?.id]);

  // 通知やマイページから保存済み検索条件ID付きで戻ってきた場合、その条件を反映します。
  useEffect(() => {
    const savedSearchID = searchParams.get('savedSearch');
    if (!savedSearchID || savedSearches.length === 0) return;
    const row = savedSearches.find((s) => String(s.id) === savedSearchID);
    if (row) applySavedSearch(row);
  }, [searchParams, savedSearches.length]);

  // 現在の検索条件をマイページの保存検索条件として保存します。
  async function saveSearch() {
    if (!user) {
      setError('検索条件の保存にはログインが必要です');
      return;
    }
    const name = saveName.trim() || `検索条件 ${new Date().toLocaleString('ja-JP')}`;
    const queryJson = JSON.stringify(currentParams());
    try {
      setError('');
      await meApi.saveSearch(name, queryJson);
      setMessage('検索条件を保存しました');
      setSaveName('');
      await loadSavedSearches();
    } catch (e) {
      setError(e instanceof Error ? e.message : '検索条件の保存に失敗しました');
    }
  }

  // 保存済み検索条件を商品一覧に反映します。
  async function applySavedSearch(search: SavedSearch) {
    const params = parseSavedSearchQuery(search.queryJson);
    applyParams(params);
    await loadItems(params, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 通常の検索フォーム送信です。
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    loadItems(currentParams(), true);
  }

  // 自然言語検索の送信です。
  // バックエンドが自然文を既存検索パラメータへ変換し、同じ商品一覧APIで絞り込みます。
  async function submitNaturalLanguageSearch(event: FormEvent) {
    event.preventDefault();
    const query = naturalLanguageQuery.trim();
    if (!query) {
      setNaturalLanguageError('検索したい内容を入力してください');
      return;
    }
    setNaturalLanguageError('');
    setNaturalLanguageMessage('');
    setIsNaturalLanguageLoading(true);
    try {
      const parsed = await aiApi.parseSearch(query);
      const params: ItemSearchParams = {
        q: parsed.q ?? '',
        category: parsed.category ?? '',
        size: parsed.size ?? '',
        color: parsed.color ?? '',
        condition: parsed.condition ?? '',
        status: parsed.status ?? '',
        minPrice: parsed.minPrice ?? '',
        maxPrice: parsed.maxPrice ?? '',
        tag: parsed.tag ?? '',
        deliveryWithin: parsed.deliveryWithin ?? '',
        sort: parsed.sort ?? 'recommended',
      };
      applyParams(params);
      await loadItems(params, true);
      setNaturalLanguageMessage([parsed.explanation, parsed.notice].filter(Boolean).join(' '));
    } catch (e) {
      setNaturalLanguageError(e instanceof Error ? e.message : '自然言語検索に失敗しました');
    } finally {
      setIsNaturalLanguageLoading(false);
    }
  }
  const recommendationItems = safeRecommendationItems(recommendation);

  return (
    <section className="marketPage">
      <div className="marketLayout">
        <aside className="filterSidebar" aria-label="商品検索条件">
          <form className="sidebarSearchForm" onSubmit={submitSearch}>
            <label className="fieldBlock">
              <span>{t('キーワード')}</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="例: たまねぎ" />
            </label>

            <MultiFilter title="カテゴリ" translateLabel={(value) => translateKnownValue(t(value), lang)} values={searchableCategories} selected={categories} onChange={setCategories} />
            <MultiFilter title="商品状態" translateLabel={(value) => translateKnownValue(t(value), lang)} values={conditions} selected={selectedConditions} onChange={setSelectedConditions} />
            <MultiFilter title="サイズ" translateLabel={(value) => translateKnownValue(t(value), lang)} values={sizes} selected={selectedSizes} onChange={setSelectedSizes} />
            <MultiFilter title="色" translateLabel={(value) => translateKnownValue(t(value), lang)} values={colors} selected={selectedColors} onChange={setSelectedColors} />
            <MultiFilter title="販売状況" translateLabel={(value) => translateKnownValue(t(value), lang)} values={statuses.map((s) => s.value)} selected={selectedStatuses} onChange={setSelectedStatuses} />

            <label className="fieldBlock">
              <span>{t('発送までの日数')}</span>
              <select value={deliveryWithin} onChange={(e) => setDeliveryWithin(e.target.value)}>
                {deliveryWithinOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="fieldBlock"><span>{t('検索用タグ')}</span><input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="例: 教材" /></label>
            <div className="priceFilterPair">
              <label><span>{t('最低価格')}</span><input value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" /></label>
              <label><span>{t('最高価格')}</span><input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" /></label>
            </div>
            <label className="fieldBlock">
              <span>{t('並び替え')}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recommended">おすすめ順</option>
                <option value="new">新着順</option>
                <option value="price_asc">価格が安い順</option>
                <option value="price_desc">価格が高い順</option>
                <option value="checklist_desc">チェックリスト追加が多い順</option>
              </select>
            </label>
            <button type="submit">{t('検索')}</button>
            <button type="button" className="secondaryButton" onClick={() => { applyParams({ sort: 'recommended' }); loadItems({ sort: 'recommended' }, false); }}>{t('条件をリセット')}</button>

            {user && (
              <div className="sidebarSaveBox">
                <strong>{t('検索条件を保存')}</strong>
                <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="保存名" />
                <button type="button" className="secondaryButton" onClick={saveSearch}>{t('保存')}</button>
              </div>
            )}

            {user && savedSearches.length > 0 && (
              <details className="filterDetails savedSearchDetails">
                <summary>{t('保存済み検索条件')}</summary>
                <div className="sidebarSavedSearches">
                  {savedSearches.map((s) => (
                    <button key={s.id} type="button" className="savedSearchMini" onClick={() => applySavedSearch(s)}>
                      <strong>{s.name}</strong>
                      <small>{describeSavedSearch(s.queryJson).map((row) => `${row.label}: ${row.value}`).join(' / ') || '条件指定なし'}</small>
                    </button>
                  ))}
                </div>
              </details>
            )}
          </form>
        </aside>

        <div className="marketMain">
          <div className="hero compactHero smartHero">
            <div className="heroMessage">
              <p className="eyebrow">Regatear ~ AI Flea Market ~</p>
              <h1>{t('AIが出品と購入判断を支援する次世代フリマ')}</h1>
              <p>出品文生成、購入前チェック、自然言語検索、AI対話などを通して、探す・売る・買うをまとめて支援します。</p>
            </div>
            <form className="naturalSearchBox" onSubmit={submitNaturalLanguageSearch}>
              <strong>生成AIで自然言語検索</strong>
              <p>例: 参考書 300円 ~ 1500円</p>
              <div className="naturalSearchRow">
                <input value={naturalLanguageQuery} onChange={(e) => setNaturalLanguageQuery(e.target.value)} placeholder="例: 参考書 300円 ~ 1500円" />
                <button type="submit" disabled={isNaturalLanguageLoading}>{isNaturalLanguageLoading ? '解析中...' : 'AI検索'}</button>
              </div>
              {naturalLanguageMessage && <small className="success">{naturalLanguageMessage}</small>}
              {naturalLanguageError && <small className="error">{naturalLanguageError}</small>}
            </form>
          </div>

          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
          {isLoading && <p className="muted">{t('商品を読み込んでいます...')}</p>}
          {!isLoading && !error && isSearched && items.length === 0 && (
            <div className="card emptyState">
              <h2>{t('条件に合う商品はありませんでした')}</h2>
              <p className="muted">{t('キーワード、価格、カテゴリ、販売状況などの条件を少し広げて再検索してください。')}</p>
            </div>
          )}

          <div className="recommendationStrip card highlightedRecommendation">
            <div className="recommendationHeader">
              <div>
                <p className="eyebrow">Recommended for you</p>
                <h2>{t('おすすめ商品')}</h2>
              </div>
              <span className="aiBadge">AI + C2C signals</span>
            </div>
            {isRecommendationLoading ? (
              <p className="muted loadingInline"><span className="spinner" />C2C取引の閲覧・チェックリスト傾向をもとに、おすすめ商品を生成しています...</p>
            ) : !user ? (
              <p className="muted">ログインすると、閲覧傾向・カテゴリ・価格帯を使ったおすすめが表示されます。</p>
            ) : recommendationError ? (
              <p className="error">{recommendationError}</p>
            ) : recommendationItems.length === 0 ? (
              <p className="muted">現在表示できるおすすめ商品はありません。商品を閲覧・チェックリスト追加するとおすすめが変化します。</p>
            ) : (
              <>
                <p className="muted"><strong>{t('おすすめ理由')}:</strong> <TranslatedText text={recommendation?.reason ?? '閲覧傾向やカテゴリ、価格帯が近い商品をおすすめしています。'} /></p>
                <div className="miniRecommendationGrid wideMiniRecommendationGrid">
                  {recommendationItems.slice(0, 8).map((rec) => (
                    <Link key={rec.id} to={`/items/${rec.id}`} className="miniRecCard">
                      {rec.imageUrl ? (
                        <img className="miniRecImage" src={firstImageUrl(rec.imageUrl)} alt={rec.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <div className="miniRecNoImage">No Image</div>
                      )}
                      <TranslatedText text={rec.title} as="strong" />
                      <span>{formatYen(rec.priceYen)}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="grid denseGrid">
            {items.map((item) => (
              <Link key={item.id} className="itemCard compactItemCard" to={`/items/${item.id}`}>
                {item.imageUrl ? (
                  <img src={firstImageUrl(item.imageUrl)} alt={item.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div className="noImage">No Image</div>
                )}
                <div className="itemBody">
                  <span className="productCode">{item.productCode}</span>
                  <TranslatedText text={item.title} as="h2" />
                  <p>{translateKnownValue(item.category, lang)}</p>
                  <p className="muted">{translateKnownValue(item.conditionText, lang)}</p>
                  <strong>{formatYen(item.priceYen)}</strong>
                  <span className={`badge ${item.status}`}>{translateKnownValue(statusLabel(item.status), lang)}</span>
                  <span className="likeCount">♡ {item.checklistCount}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
