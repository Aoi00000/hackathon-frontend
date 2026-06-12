import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { aiApi, itemApi } from '../api/client';

// CreateItemPage は商品出品画面です。
// AI説明生成により、出品者が文章作成で詰まる課題を減らす設計にしています。
export function CreateItemPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ファッション');
  const [conditionText, setConditionText] = useState('目立った傷や汚れなし');
  const [priceYen, setPriceYen] = useState(1000);
  const [imageUrl, setImageUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  async function generateDescription() {
    setError('');
    setIsGenerating(true);

    try {
      const result = await aiApi.generateDescription({
        title,
        category,
        conditionText,
        keywords,
      });
      setDescription(result.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI説明生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      const item = await itemApi.create({
        title,
        description,
        category,
        conditionText,
        priceYen,
        imageUrl,
      });
      navigate(`/items/${item.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '出品に失敗しました');
    }
  }

  return (
    <section className="card">
      <h1>商品を出品する</h1>

      <form onSubmit={onSubmit} className="form">
        <label>
          商品名
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          カテゴリ
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>ファッション</option>
            <option>ガジェット</option>
            <option>本・教材</option>
            <option>家具</option>
            <option>その他</option>
          </select>
        </label>

        <label>
          状態
          <select value={conditionText} onChange={(e) => setConditionText(e.target.value)}>
            <option>新品・未使用</option>
            <option>未使用に近い</option>
            <option>目立った傷や汚れなし</option>
            <option>やや傷や汚れあり</option>
            <option>全体的に状態が悪い</option>
          </select>
        </label>

        <label>
          価格
          <input value={priceYen} onChange={(e) => setPriceYen(Number(e.target.value))} type="number" min={1} required />
        </label>

        <label>
          画像URL
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </label>

        <label>
          AIに伝えるメモ
          <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="購入時期、サイズ感、注意点など" />
        </label>

        <button type="button" onClick={generateDescription} disabled={isGenerating || !title}>
          {isGenerating ? 'AI生成中...' : 'AIで商品説明を生成'}
        </button>

        <label>
          商品説明
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={8} />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit">出品する</button>
      </form>
    </section>
  );
}
