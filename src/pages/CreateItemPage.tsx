import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { aiApi, itemApi } from '../api/client';

const categories = ['ファッション', 'ガジェット', '本・教材', '家具', 'その他'];
const conditions = ['新品・未使用', '未使用に近い', '目立った傷や汚れなし', 'やや傷や汚れあり', '全体的に状態が悪い'];

export function CreateItemPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ファッション');
  const [conditionText, setConditionText] = useState('目立った傷や汚れなし');
  const [priceInput, setPriceInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('対面・配送相談');
  const [shippingDays, setShippingDays] = useState('2');
  const [shipFromRegion, setShipFromRegion] = useState('東京都');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  function onPriceChange(value: string) { setPriceInput(value.replace(/\D/g, '')); }
  function priceToNumber(): number | null { if (priceInput.trim() === '') return null; const n = Number(priceInput); return Number.isInteger(n) && n > 0 ? n : null; }

  async function generateDescription() {
    setError(''); setIsGenerating(true);
    try {
      const result = await aiApi.generateDescription({ title, category, conditionText, keywords });
      setDescription(result.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI説明生成に失敗しました');
    } finally { setIsGenerating(false); }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault(); setError('');
    const priceYen = priceToNumber();
    const days = Number(shippingDays);
    if (priceYen === null) { setError('価格(円)を1円以上の整数で入力してください'); return; }
    if (!Number.isInteger(days) || days <= 0) { setError('発送までの日数を1日以上の整数で入力してください'); return; }
    try {
      await itemApi.create({ title, description, category, conditionText, priceYen, imageUrl, deliveryMethod, shippingDays: days, shipFromRegion, size, color, tags });
      navigate('/my/items?created=1');
    } catch (e) { setError(e instanceof Error ? e.message : '出品に失敗しました'); }
  }

  return (
    <section className="card">
      <h1>商品を出品する</h1>
      <p className="muted">送料は全商品「送料無料」として扱います。</p>
      <form onSubmit={onSubmit} className="form">
        <label>商品名<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label>カテゴリ<select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>状態<select value={conditionText} onChange={(e) => setConditionText(e.target.value)}>{conditions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>価格(円)<input value={priceInput} onChange={(e) => onPriceChange(e.target.value)} inputMode="numeric" placeholder="例: 500" required /></label>
        <label>画像URL<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" /></label>
        <label>商品の受け渡し方法<input value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} placeholder="例: 対面・配送相談" required /></label>
        <label>発送までの日数<input value={shippingDays} onChange={(e) => setShippingDays(e.target.value.replace(/\D/g, ''))} inputMode="numeric" required /></label>
        <label>発送元の地域<input value={shipFromRegion} onChange={(e) => setShipFromRegion(e.target.value)} placeholder="例: 東京都" required /></label>
        <label>サイズ<input value={size} onChange={(e) => setSize(e.target.value)} placeholder="例: M / A4 / 24cm" /></label>
        <label>色<input value={color} onChange={(e) => setColor(e.target.value)} placeholder="例: 黒" /></label>
        <label>検索用タグ<input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例: 教科書, 初学者向け, 東大" /></label>
        <label>AIに伝えるメモについて(商品内容、購入時期、サイズ感、注意点など)<textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} /></label>
        <button type="button" onClick={generateDescription} disabled={isGenerating || !title}>{isGenerating ? 'AI生成中...' : 'AIで商品説明を生成'}</button>
        <label>商品説明<textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={8} /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit">出品する</button>
      </form>
    </section>
  );
}
