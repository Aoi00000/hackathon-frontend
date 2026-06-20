/**
 * ファイル概要: hackathon-frontend/src/pages/CreateItemPage.tsx
 *
 * 役割:
 * 商品出品と商品編集を兼ね、AI説明生成、画像・動画並び替え、必須入力検証を行います。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
/**
 * 商品出品ページ。
 *
 * 複数画像アップロード、画像削除、AI商品説明生成、カテゴリ別購入者チェックポイント、
 * マイページに登録した発送元地域の初期反映を担当します。
 * AI生成では、外部AIが失敗した場合も本文だけを説明欄に入れ、注意文はラベル横に分離して表示します。
 */
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { aiApi, authApi, itemApi } from '../api/client';
import { ImageReorderGrid } from '../components/ImageReorderGrid';
import { useAuth } from '../context/AuthContext';
import { categories, colors, conditions, deliveryMethods, sizes } from '../formOptions';
import { fileToMediaDataUrl } from '../imageUpload';
import { stringifyImageUrls } from '../utils';

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function RequiredMark() {
  // 必須項目であることを視覚的に示す小さな赤いマークです。
  return <span className="requiredMark">*</span>;
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function LabelText({ children, example, required }: { children: string; example?: string; required?: boolean }) {
  // ラベル名、必須マーク、入力例を一箇所で整形します。
  return (
    <span className="labelText">
      {children}{required && <RequiredMark />}
      {example && <small>（例: {example}）</small>}
    </span>
  );
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function CreateItemPage() {
  // 出品完了後に出品履歴へ移動するための navigate です。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const navigate = useNavigate();

  // ログインユーザーのマイページ登録情報を、出品フォームの初期値に反映するために使います。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const { user } = useAuth();

  // 以下は出品フォームの各入力値です。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [title, setTitle] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [category, setCategory] = useState('本・教材');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [conditionText, setConditionText] = useState('目立った傷や汚れなし');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [priceInput, setPriceInput] = useState('');

  // 複数画像を扱うため、画像は配列で管理します。
  // バックエンドには既存互換のため imageUrl という1つの文字列として送りますが、
  // 2枚以上の場合は JSON.stringify([...]) した文字列として保存します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [imageUrls, setImageUrls] = useState<string[]>([]);

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [deliveryMethod, setDeliveryMethod] = useState('対面・配送相談');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [shippingDays, setShippingDays] = useState('2');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [shipFromRegion, setShipFromRegion] = useState('東京都');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [size, setSize] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [color, setColor] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [tags, setTags] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [keywords, setKeywords] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [description, setDescription] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [aiNotice, setAiNotice] = useState('');

  // 画像変換やAI説明生成のローディング状態です。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [isGenerating, setIsGenerating] = useState(false);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [isImageConverting, setIsImageConverting] = useState(false);

  // file input は value を直接空にしにくいので、keyを変えて再マウントします。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [imageInputKey, setImageInputKey] = useState(0);

  // 画面表示用のエラーと、カテゴリ別のC2C取引チェックポイントです。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [error, setError] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [categoryTips, setCategoryTips] = useState<string[]>([]);

  // 【副作用】useEffectは、画面表示後のAPI取得、イベント登録、タイマー管理などReact外部との接続点です。
  useEffect(() => {
    // マイページで発送元地域を登録済みの場合、出品フォームの初期値に反映します。
    // ただし、ユーザーがすでに手入力した値を上書きしないよう、空欄または初期値の東京都のときだけ更新します。
// 【詳細コメント】このlet宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    let cancelled = false;
    authApi.me()
      .then((me) => {
        if (cancelled || !me.shippingRegion) return;
        setShipFromRegion((current) => (current.trim() === '' || current === '東京都' ? me.shippingRegion : current));
      })
      .catch(() => {
        // 未ログインや通信エラーの場合は、従来どおりフォームの初期値を使います。
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  // 【副作用】useEffectは、画面表示後のAPI取得、イベント登録、タイマー管理などReact外部との接続点です。
  useEffect(() => {
    // カテゴリが変わるたびに、そのカテゴリで購入者が気にしやすい点を取得します。
    // これは商品説明やAIに伝えるメモの記入補助として使うため、メモ欄の近くに表示します。
// 【詳細コメント】このlet宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    let cancelled = false;
    aiApi.categoryKnowledge(category)
      .then((res) => { if (!cancelled) setCategoryTips(res.tips); })
      .catch(() => { if (!cancelled) setCategoryTips([]); });
    return () => { cancelled = true; };
  }, [category]);

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  function clearErrorOnEdit() {
    // 入力修正後も過去の警告が残り続けると混乱するため、編集時に消します。
    if (error) setError('');
  }

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  function onPriceChange(value: string) {
    // 価格欄には数字だけを残します。
    clearErrorOnEdit();
    setPriceInput(value.replace(/\D/g, ''));
  }

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  function priceToNumber(): number | null {
    // 空欄や0円以下を不正値として弾くため、送信前に数値へ変換します。
    if (priceInput.trim() === '') return null;
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const n = Number(priceInput);
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  async function onImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    // 選択された複数画像を順番にData URLへ圧縮変換し、プレビュー一覧へ追加します。
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
    // 誤って選択した画像だけを削除します。
    setImageUrls((current) => current.filter((_, i) => i !== index));
    setImageInputKey((current) => current + 1);
  }

  async function generateDescription() {
    // Gemini / Vertex AI が使える場合は商品説明を生成し、使えない場合はAPI側のエラーを表示します。
    setError('');
    setIsGenerating(true);
    try {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
      const result = await aiApi.generateDescription({ title, category, conditionText, keywords });
      setDescription(result.text);
      setAiNotice(result.notice ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI説明生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    // フォーム送信時に入力値を検証し、バックエンドへ出品リクエストを送ります。
    event.preventDefault();
    setError('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const priceYen = priceToNumber();
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const days = Number(shippingDays);
    if (priceYen === null) { setError('価格(円)を1円以上の整数で入力してください'); return; }
    if (!Number.isInteger(days) || days <= 0) { setError('発送までの日数を1日以上の整数で入力してください'); return; }
    if (!shipFromRegion.trim()) { setError('発送元の地域を入力してください'); return; }
    try {
      await itemApi.create({
        title,
        description,
        category,
        conditionText,
        priceYen,
        imageUrl: stringifyImageUrls(imageUrls),
        deliveryMethod,
        shippingDays: days,
        shipFromRegion,
        size,
        color,
        tags,
      });
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
        <label><LabelText required example="微分積分学参考書">商品名</LabelText><input value={title} onChange={(e) => { clearErrorOnEdit(); setTitle(e.target.value); }} required /></label>
        <label><LabelText required>カテゴリ</LabelText><select value={category} onChange={(e) => { clearErrorOnEdit(); setCategory(e.target.value); }}>{categories.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label><LabelText required>状態</LabelText><select value={conditionText} onChange={(e) => { clearErrorOnEdit(); setConditionText(e.target.value); }}>{conditions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label><LabelText required example="500">価格(円)</LabelText><input value={priceInput} onChange={(e) => onPriceChange(e.target.value)} inputMode="numeric" required /></label>

        <label>
          <LabelText>商品画像・動画</LabelText>
          <input key={imageInputKey} type="file" accept="image/*,video/*" multiple onChange={onImageFileChange} />
          {isImageConverting && <span className="muted">画像・動画を読み込んでいます...</span>}
          {imageUrls.length > 0 && (
            <>
              <p className="muted compactHint">画像・動画をドラッグ&ドロップすると、商品詳細で表示される順番を変更できます。</p>
              <ImageReorderGrid
                imageUrls={imageUrls}
                onChange={(next) => { clearErrorOnEdit(); setImageUrls(next); }}
                onRemove={removeImage}
                altPrefix="選択した商品画像・動画"
              />
            </>
          )}
        </label>

        <label><LabelText required>商品の受け渡し方法</LabelText><select value={deliveryMethod} onChange={(e) => { clearErrorOnEdit(); setDeliveryMethod(e.target.value); }}>{deliveryMethods.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label><LabelText required example="2">発送までの日数</LabelText><input value={shippingDays} onChange={(e) => { clearErrorOnEdit(); setShippingDays(e.target.value.replace(/\D/g, '')); }} inputMode="numeric" required /></label>
        <label><LabelText required example="東京都">発送元の地域</LabelText><input value={shipFromRegion} onChange={(e) => { clearErrorOnEdit(); setShipFromRegion(e.target.value); }} required /></label>
        <label><LabelText example="M / A4 / 24cm">サイズ</LabelText><select value={size} onChange={(e) => { clearErrorOnEdit(); setSize(e.target.value); }}>{sizes.map((x) => <option key={x} value={x}>{x || '選択しない'}</option>)}</select></label>
        <label><LabelText example="黒 / 白 / ネイビー">色</LabelText><select value={color} onChange={(e) => { clearErrorOnEdit(); setColor(e.target.value); }}>{colors.map((x) => <option key={x} value={x}>{x || '選択しない'}</option>)}</select></label>
        <label><LabelText example="参考書, 初学者向け, 数学, 大学受験">検索用タグ</LabelText><input value={tags} onChange={(e) => { clearErrorOnEdit(); setTags(e.target.value); }} /></label>

        <label><LabelText example="商品内容、購入時期、サイズ感、注意点など">AIに伝えるメモ</LabelText><textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} /></label>
        {categoryTips.length > 0 && (
          <div className="aiTipsBox">
            <strong>MerRecデータセットのC2C取引知識から、このカテゴリで購入者が気にしやすい点</strong>
            <p className="muted">商品説明やAIに伝えるメモを書くときに、購入者が不安に感じやすい点を先回りして補足できます。</p>
            <ul>{categoryTips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
          </div>
        )}

        <button type="button" onClick={generateDescription} disabled={isGenerating || !title}>
          {isGenerating ? <span className="loadingInline"><span className="spinner" />AIで商品説明を生成中...</span> : 'AIで商品説明を生成'}
        </button>
        <label>
          <span className="labelText">商品説明<RequiredMark />{aiNotice && <small className="aiNoticeInline">{aiNotice}</small>}</span>
          <textarea value={description} onChange={(e) => { clearErrorOnEdit(); setAiNotice(''); setDescription(e.target.value); }} required rows={8} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">出品する</button>
      </form>
    </section>
  );
}
