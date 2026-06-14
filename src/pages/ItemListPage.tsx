import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { itemApi, meApi, type ItemSearchParams } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useI18n, translateKnownValue } from '../i18n';
import { TranslatedText } from '../TranslatedText';
import { colors, conditions, deliveryWithinOptions, searchableCategories, sizes } from '../formOptions';
import { describeSavedSearch, parseSavedSearchQuery } from '../savedSearch';
import type { Item, ItemStatus, RecommendationResponse, SavedSearch } from '../types';
import { formatYen, normalizeImageUrl, statusLabel } from '../utils';

const statuses: Array<{ value: ItemStatus; label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'SOLD' },
];

type OptionGroupProps = {
  title: string;
  values: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  translateLabel?: (value: string) => string;
};

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

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

function join(values: string[]): string { return values.join(','); }
function split(value?: string): string[] { return value ? value.split(',').filter(Boolean) : []; }
function safeRecommendationItems(recommendation: RecommendationResponse | null): Item[] {
  // APIが items:null を返す場合でも、画面表示では空配列として扱います。
  return Array.isArray(recommendation?.items) ? recommendation.items : [];
}

export function ItemListPage() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const [searchParams] = useSearchParams();
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
  const [items, setItems] = useState<Item[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveName, setSaveName] = useState('');
  const [message, setMessage] = useState('');

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

  async function loadSavedSearches() {
    if (!user) {
      setSavedSearches([]);
      return;
    }
    setSavedSearches(await meApi.savedSearches().catch(() => []));
  }

  useEffect(() => { loadItems(currentParams(), false); }, []);
  useEffect(() => { loadSavedSearches(); }, [user?.id]);
  useEffect(() => {
    async function loadRecommendations() {
      if (!user) {
        setRecommendation(null);
        return;
      }
      setRecommendation(await meApi.recommendations().catch(() => null));
    }
    loadRecommendations();
  }, [user?.id]);
  useEffect(() => {
    const savedSearchID = searchParams.get('savedSearch');
    if (!savedSearchID || savedSearches.length === 0) return;
    const row = savedSearches.find((s) => String(s.id) === savedSearchID);
    if (row) applySavedSearch(row);
  }, [searchParams, savedSearches.length]);

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

  async function applySavedSearch(search: SavedSearch) {
    const params = parseSavedSearchQuery(search.queryJson);
    applyParams(params);
    await loadItems(params, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    loadItems(currentParams(), true);
  }

  const recommendationItems = safeRecommendationItems(recommendation);

  return (
    <section className="marketPage">
      <div className="hero compactHero">
        <h1>{t('AIが出品と購入判断を支援する次世代フリマ')}</h1>
        <p>{t('Mercari風の左サイドバー検索とコンパクトな商品カードで、画面内に多くの商品を表示します。')}</p>
      </div>

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
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
          {isLoading && <p className="muted">{t('商品を読み込んでいます...')}</p>}
          {!isLoading && !error && isSearched && items.length === 0 && (
            <div className="card emptyState">
              <h2>{t('条件に合う商品はありませんでした')}</h2>
              <p className="muted">{t('キーワード、価格、カテゴリ、販売状況などの条件を少し広げて再検索してください。')}</p>
            </div>
          )}

          {recommendationItems.length > 0 && (
            <div className="recommendationStrip card">
              <h2>{t('MerRecデータセットを想定したおすすめ')}</h2>
              <p className="muted"><strong>{t('おすすめ理由')}:</strong> <TranslatedText text={recommendation?.reason ?? '閲覧傾向やカテゴリ、価格帯が近い商品をおすすめしています。'} /></p>
              <div className="miniRecommendationGrid">
                {recommendationItems.slice(0, 4).map((rec) => (
                  <Link key={rec.id} to={`/items/${rec.id}`} className="miniRecCard">
                    <TranslatedText text={rec.title} as="strong" />
                    <span>{formatYen(rec.priceYen)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid denseGrid">
            {items.map((item) => (
              <Link key={item.id} className="itemCard compactItemCard" to={`/items/${item.id}`}>
                {item.imageUrl ? (
                  <img src={normalizeImageUrl(item.imageUrl)} alt={item.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
