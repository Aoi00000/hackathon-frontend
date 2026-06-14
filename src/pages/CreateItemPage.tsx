import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { aiApi, itemApi } from '../api/client';
import { categories, colors, conditions, deliveryMethods, sizes } from '../formOptions';
import { fileToCompressedDataUrl } from '../imageUpload';

function RequiredMark() {
  return <span className="requiredMark">*</span>;
}

function LabelText({ children, example, required }: { children: string; example?: string; required?: boolean }) {
  return (
    <span className="labelText">
      {children}{required && <RequiredMark />}
      {example && <small>（例: {example}）</small>}
    </span>
  );
}

export function CreateItemPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('本・教材');
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
  const [isImageConverting, setIsImageConverting] = useState(false);
  const [error, setError] = useState('');
  const [categoryTips, setCategoryTips] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    aiApi.categoryKnowledge(category)
      .then((res) => { if (!cancelled) setCategoryTips(res.tips); })
      .catch(() => { if (!cancelled) setCategoryTips([]); });
    return () => { cancelled = true; };
  }, [category]);

  function onPriceChange(value: string) {
    setPriceInput(value.replace(/\D/g, ''));
  }

  function priceToNumber(): number | null {
    if (priceInput.trim() === '') return null;
    const n = Number(priceInput);
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  async function onImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setIsImageConverting(true);
    try {
      setImageUrl(await fileToCompressedDataUrl(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像の読み込みに失敗しました');
    } finally {
      setIsImageConverting(false);
    }
  }

  async function generateDescription() {
    setError('');
    setIsGenerating(true);
    try {
      const result = await aiApi.generateDescription({ title, category, conditionText, keywords });
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
    const priceYen = priceToNumber();
    const days = Number(shippingDays);
    if (priceYen === null) { setError('価格(円)を1円以上の整数で入力してください'); return; }
    if (!Number.isInteger(days) || days <= 0) { setError('発送までの日数を1日以上の整数で入力してください'); return; }
    try {
      await itemApi.create({ title, description, category, conditionText, priceYen, imageUrl, deliveryMethod, shippingDays: days, shipFromRegion, size, color, tags });
      navigate('/my/items?created=1');
    } catch (e) {
      setError(e instanceof Error ? e.message : '出品に失敗しました');
    }
  }

  return (
    <section className="card">
      <h1>商品を出品する</h1>
      <p className="muted">送料は全商品「送料無料」として扱います。<span className="requiredMark">*</span> は必須項目です。</p>
      <form onSubmit={onSubmit} className="form">
        <label><LabelText required example="微分積分学参考書">商品名</LabelText><input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label><LabelText required>カテゴリ</LabelText><select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((x) => <option key={x}>{x}</option>)}</select></label>
        {categoryTips.length > 0 && <div className="aiTipsBox"><strong>MerRecデータセットのC2C取引知識から、このカテゴリで購入者が気にしやすい点</strong><ul>{categoryTips.map((tip) => <li key={tip}>{tip}</li>)}</ul></div>}
        <label><LabelText required>状態</LabelText><select value={conditionText} onChange={(e) => setConditionText(e.target.value)}>{conditions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label><LabelText required example="500">価格(円)</LabelText><input value={priceInput} onChange={(e) => onPriceChange(e.target.value)} inputMode="numeric" required /></label>
        <label>
          <LabelText>商品画像</LabelText>
          <input type="file" accept="image/*" onChange={onImageFileChange} />
          {isImageConverting && <span className="muted">画像を読み込んでいます...</span>}
          {imageUrl && <img className="imagePreview" src={imageUrl} alt="選択した商品画像" />}
        </label>
        <label><LabelText required>商品の受け渡し方法</LabelText><select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>{deliveryMethods.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label><LabelText required example="2">発送までの日数</LabelText><input value={shippingDays} onChange={(e) => setShippingDays(e.target.value.replace(/\D/g, ''))} inputMode="numeric" required /></label>
        <label><LabelText required example="東京都">発送元の地域</LabelText><input value={shipFromRegion} onChange={(e) => setShipFromRegion(e.target.value)} required /></label>
        <label><LabelText example="M / A4 / 24cm">サイズ</LabelText><select value={size} onChange={(e) => setSize(e.target.value)}>{sizes.map((x) => <option key={x} value={x}>{x || '選択しない'}</option>)}</select></label>
        <label><LabelText example="黒 / 白 / ネイビー">色</LabelText><select value={color} onChange={(e) => setColor(e.target.value)}>{colors.map((x) => <option key={x} value={x}>{x || '選択しない'}</option>)}</select></label>
        <label><LabelText example="参考書, 初学者向け, 数学, 大学受験">検索用タグ</LabelText><input value={tags} onChange={(e) => setTags(e.target.value)} /></label>
        <label><LabelText example="商品内容、購入時期、サイズ感、注意点など">AIに伝えるメモ</LabelText><textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} /></label>
        <button type="button" onClick={generateDescription} disabled={isGenerating || !title}>
          {isGenerating ? <span className="loadingInline"><span className="spinner" />AIで商品説明を生成中...</span> : 'AIで商品説明を生成'}
        </button>
        <label><LabelText required>商品説明</LabelText><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={8} /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit">出品する</button>
      </form>
    </section>
  );
}
