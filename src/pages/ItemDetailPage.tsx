import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { checklistApi, itemApi, meApi, messageApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Item, ItemAIAnalysis, Message, PrivateMessage } from '../types';
import { useI18n, translateKnownValue } from '../i18n';
import { TranslatedText } from '../TranslatedText';
import { formatDate, formatYen, nextPurchaseStep, parseImageUrls, purchaseStatusLabel, ratingStars, safeNumber, statusLabel } from '../utils';

type Thread = { parent: Message; replies: Message[] };
type PrivateThread = { parent: PrivateMessage; replies: PrivateMessage[] };

function buildThreads(messages: Message[]): Thread[] {
  const parents = messages.filter((m) => !m.parentMessageId);
  const replies = messages.filter((m) => m.parentMessageId);
  return parents.map((p) => ({ parent: p, replies: replies.filter((r) => r.parentMessageId === p.id) }));
}

function buildPrivateThreads(messages: PrivateMessage[]): PrivateThread[] {
  const parents = messages.filter((m) => !m.parentMessageId);
  const replies = messages.filter((m) => m.parentMessageId);
  return parents.map((p) => ({ parent: p, replies: replies.filter((r) => r.parentMessageId === p.id) }));
}

function CommentBox({ message, isReply }: { message: Message; isReply?: boolean }) {
  // 公開コメントの表示時刻は createdAt を使います。
  // 返信が追加されたときに親コメントの updatedAt をスレッド並び替え用に更新するため、
  // updatedAt を表示すると、過去の親コメント時刻まで最新返信時刻に見えてしまいます。
  return <div className={`message ${isReply ? 'replyMessage' : ''} ${message.isSeller ? 'sellerMessage' : ''}`}><div className="messageHeader"><strong className={message.isSeller ? 'sellerName' : ''}>{message.senderName}</strong>{message.isSeller && <span className="sellerBadge">出品者</span>}<span className="muted">{formatDate(message.createdAt)}</span></div><p>{message.body}</p></div>;
}

function PrivateMessageBox({ message, currentUserId, isReply }: { message: PrivateMessage; currentUserId: number; isReply?: boolean }) {
  return <div className={`message ${isReply ? 'replyMessage' : ''} ${message.senderId === currentUserId ? 'ownPrivateMessage' : ''}`}><div className="messageHeader"><strong>{message.senderName}</strong><span className="muted">{formatDate(message.createdAt)}</span></div><p>{message.body}</p></div>;
}

function buildSmartAssist(item: Item): string[] {
  // 外部AI APIが使えない場面でも、商品情報から購入判断の観点を即時提示します。
  // ハッカソンのデモでは、出品文生成だけでなく「購入前の不安を減らすAI的支援」として見せられます。
  const hints: string[] = [];
  if (item.status === 'available') hints.push('現在購入可能です。');
  if (item.shippingDays <= 1) hints.push('発送までが早めの商品です。');
  if (item.sellerRatingCount > 0 && item.sellerRatingAverage >= 4.5) hints.push('出品者評価が高く、安心材料があります。');
  if (item.checklistCount >= 3) hints.push('チェックリスト追加が多く、注目度が高い商品です。');
  if (item.conditionText.includes('傷') || item.conditionText.includes('汚れ')) hints.push('状態欄に傷や汚れの記載があるため、写真と説明をよく確認すると安心です。');
  if (!item.size && !item.color) hints.push('サイズ・色が未入力です。必要な場合はコメントやDMで確認するとよいです。');
  return hints.length > 0 ? hints : ['商品説明、状態、出品者評価を確認して購入判断してください。'];
}

export function ItemDetailPage() {
  const { id } = useParams();
  const itemId = Number(id);
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const [item, setItem] = useState<Item | null>(null);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiAnswerNotice, setAiAnswerNotice] = useState('');
  const [analysis, setAnalysis] = useState<ItemAIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [privateBody, setPrivateBody] = useState('');
  const [replyBodies, setReplyBodies] = useState<Record<number, string>>({});
  const [privateReplyBodies, setPrivateReplyBodies] = useState<Record<number, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const [imageBroken, setImageBroken] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSellerBlocked, setIsSellerBlocked] = useState(false);

  const threads = useMemo(() => buildThreads(messages), [messages]);
  const privateThreads = useMemo(() => buildPrivateThreads(privateMessages), [privateMessages]);

  async function load() {
    if (!itemId) return;
    setError('');
    try {
      const [itemData, messageData] = await Promise.all([itemApi.get(itemId), messageApi.list(itemId).catch(() => [])]);
      setItem(itemData);
      setMessages(messageData);
      setImageBroken(false);
      setIsAnalyzing(true);
      itemApi.analysis(itemId).then(setAnalysis).catch(() => setAnalysis(null)).finally(() => setIsAnalyzing(false));
      if (user) {
        setPrivateMessages(await messageApi.listPrivate(itemId).catch(() => []));
        if (user.id !== itemData.sellerId) {
          setIsChecked((await checklistApi.status(itemId).catch(() => ({ checked: false }))).checked);
          const blocks = await meApi.blocks().catch(() => []);
          setIsSellerBlocked(blocks.some((b) => b.blockedId === itemData.sellerId));
        } else {
          setIsChecked(false);
          setIsSellerBlocked(false);
        }
      } else {
        setPrivateMessages([]);
        setIsSellerBlocked(false);
      }
    } catch (e) { setError(e instanceof Error ? e.message : '商品取得に失敗しました'); }
  }

  useEffect(() => { load(); }, [itemId, user?.id]);

  useEffect(() => {
    // 商品が切り替わった場合は、画像カルーセルを必ず1枚目に戻します。
    setSelectedImageIndex(0);
    setImageBroken(false);
  }, [item?.id, item?.imageUrl]);

  async function toggleChecklist() {
    if (!item || !user) return;
    setError('');
    try {
      if (isChecked) {
        await checklistApi.remove(item.id);
        setIsChecked(false);
        setItem({ ...item, checklistCount: Math.max(0, item.checklistCount - 1) });
      } else {
        await checklistApi.add(item.id);
        setIsChecked(true);
        setItem({ ...item, checklistCount: item.checklistCount + 1 });
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'チェックリスト操作に失敗しました'); }
  }

  async function askAI(event: FormEvent) {
    event.preventDefault();
    if (!item || !question) return;
    setError('');
    setAiAnswer('');
    setAiAnswerNotice('');
    setIsAskingAI(true);
    try { const result = await itemApi.ask(item.id, question); setAiAnswer(result.text); setAiAnswerNotice(result.notice ?? ''); }
    catch (e) { setError(e instanceof Error ? e.message : 'AI回答に失敗しました'); }
    finally { setIsAskingAI(false); }
  }

  async function sendComment(event: FormEvent) { event.preventDefault(); if (!item || !user || !commentBody.trim()) return; setError(''); try { await messageApi.send(item.id, commentBody); setCommentBody(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'コメント送信に失敗しました'); } }
  async function sendReply(parentId: number) { if (!item || !user) return; const body = replyBodies[parentId]?.trim(); if (!body) return; setError(''); try { await messageApi.send(item.id, body, parentId); setReplyBodies((c) => ({ ...c, [parentId]: '' })); await load(); } catch (e) { setError(e instanceof Error ? e.message : '返信に失敗しました'); } }
  async function sendPrivate(event: FormEvent) { event.preventDefault(); if (!item || !user || !privateBody.trim()) return; setError(''); try { await messageApi.sendPrivate(item.id, privateBody, item.sellerId === user.id ? privateMessages.find((m) => m.senderId !== user.id)?.senderId : undefined); setPrivateBody(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'DM送信に失敗しました'); } }
  async function sendPrivateReply(parent: PrivateMessage) { if (!item || !user) return; const body = privateReplyBodies[parent.id]?.trim(); if (!body) return; const receiverId = parent.senderId === user.id ? parent.receiverId : parent.senderId; setError(''); try { await messageApi.sendPrivate(item.id, body, receiverId, parent.id); setPrivateReplyBodies((c) => ({ ...c, [parent.id]: '' })); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'DM返信に失敗しました'); } }
  async function toggleBlockSeller() {
    if (!item || !user) return;
    setError('');
    try {
      if (isSellerBlocked) {
        await meApi.unblock(item.sellerId);
        setIsSellerBlocked(false);
      } else {
        await meApi.block(item.sellerId);
        setIsSellerBlocked(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ブロック操作に失敗しました');
    }
  }

  if (!item) return <p>読み込み中...</p>;
  const isOwnItem = Boolean(user && user.id === item.sellerId);
  const canPurchase = Boolean(user && item.status === 'available' && !isOwnItem);
  const canUseChecklist = Boolean(user && !isOwnItem && item.status !== 'canceled');
  const imageUrls = parseImageUrls(item.imageUrl);
  const safeSelectedImageIndex = imageUrls.length > 0 ? selectedImageIndex % imageUrls.length : 0;
  const selectedImage = imageUrls.length > 0 ? imageUrls[safeSelectedImageIndex] : '';
  const nextStep = nextPurchaseStep(item.purchaseStatus);

  function moveImage(delta: number) {
    // 最後の画像の次は1枚目へ、1枚目の前は最後へ移動する巡回表示です。
    if (imageUrls.length === 0) return;
    setImageBroken(false);
    setSelectedImageIndex((current) => (current + delta + imageUrls.length) % imageUrls.length);
  }

  return <section className="detail">
    <div className="card">
      {selectedImage && !imageBroken ? (
        <div className="detailGallery">
          <button type="button" className="galleryNav galleryPrev" onClick={() => moveImage(-1)} aria-label="前の画像を表示">‹</button>
          <img className="detailImage" src={selectedImage} alt={item.title} onClick={() => moveImage(1)} onError={() => setImageBroken(true)} />
          <button type="button" className="galleryNav galleryNext" onClick={() => moveImage(1)} aria-label="次の画像を表示">›</button>
          {imageUrls.length > 1 && <p className="galleryCounter">{safeSelectedImageIndex + 1} / {imageUrls.length}</p>}
          {imageUrls.length > 1 && <div className="galleryThumbs">{imageUrls.map((url, index) => <button type="button" key={`${url.slice(0, 40)}-${index}`} className={index === safeSelectedImageIndex ? 'selectedGalleryThumb' : ''} onClick={() => { setImageBroken(false); setSelectedImageIndex(index); }}><img src={url} alt={`${index + 1}枚目`} /></button>)}</div>}
        </div>
      ) : <div className="detailNoImage">No Image<br /><small>画像URLが直接画像を返さない場合は表示できません。出品画面から画像ファイルを直接アップロードする方法がおすすめです。</small></div>}
      <div className="historyHeader"><div><span className="productCode">{item.productCode}</span><TranslatedText text={item.title} as="h1" /><p className="muted">出品者: {item.sellerName}</p></div>{isOwnItem && <span className="ownerBadge">自分が出品した商品です</span>}</div>
      <TranslatedText text={item.description} as="p" />
      <p className="likeSummary" aria-label={`チェックリスト追加数 ${item.checklistCount}`}>♡ {item.checklistCount}</p>
      <dl className="meta"><dt>独自商品ID</dt><dd>{item.productCode}</dd><dt>カテゴリ</dt><dd>{translateKnownValue(item.category, lang)}</dd><dt>状態</dt><dd>{translateKnownValue(item.conditionText, lang)}</dd><dt>価格</dt><dd>{formatYen(item.priceYen)}</dd><dt>送料</dt><dd>送料無料</dd><dt>商品の受け渡し方法</dt><dd>{item.deliveryMethod}</dd><dt>発送までの日数</dt><dd>{item.shippingDays}日</dd><dt>発送元の地域</dt><dd>{item.shipFromRegion}</dd><dt>サイズ</dt><dd>{item.size || '-'}</dd><dt>色</dt><dd>{item.color || '-'}</dd><dt>タグ</dt><dd>{item.tags || '-'}</dd><dt>ステータス</dt><dd><span className={`statusText ${item.status}`}>{translateKnownValue(statusLabel(item.status), lang)}</span></dd><dt>最終更新日時</dt><dd>{formatDate(item.updatedAt)}</dd><dt>出品者評価</dt><dd>{item.sellerRatingCount ? <><span className="stars">{ratingStars(item.sellerRatingAverage)}</span> {safeNumber(item.sellerRatingAverage).toFixed(1)} / 5.0 ({item.sellerRatingCount}件)</> : '評価なし'}</dd><dt>取引実績</dt><dd>{item.sellerTransactionCount}件</dd></dl>
      {item.purchaseStatus && <p className="success">取引状態: <span className={`purchaseStatusBadge ${item.purchaseStatus}`}>{purchaseStatusLabel(item.purchaseStatus)}</span>{nextStep && <> / 次の段階: <strong>{nextStep}</strong></>} {item.shippingDeadline && ` / 発送期限: ${formatDate(item.shippingDeadline)}`}</p>}
      {!isOwnItem && <div className="aiAssistCard"><strong>AI購入アシスト</strong><ul>{buildSmartAssist(item).map((hint) => <li key={hint}>{hint}</li>)}</ul></div>}
      {!isOwnItem && <div className="aiAssistCard analysisCard"><strong>{t('購入前AIチェック')}</strong>{isAnalyzing && <p className="muted">AIが商品情報を確認しています...</p>}{analysis && <div className="analysisGrid"><div><h3>{t('不安点')}</h3><ul>{analysis.riskPoints.map((x) => <li key={x}><TranslatedText text={x} /></li>)}</ul></div><div><h3>{t('質問候補')}</h3><ul>{analysis.suggestedQuestions.map((x) => <li key={x}><TranslatedText text={x} /></li>)}</ul></div><div><h3>{t('不整合チェック')}</h3><ul>{analysis.inconsistencies.map((x) => <li key={x}><TranslatedText text={x} /></li>)}</ul></div><div><h3>{t('価格チェック')}</h3><p><TranslatedText text={analysis.priceInsight} /></p></div><div><h3>{t('カテゴリ別レビュー知識')}</h3><ul>{analysis.categoryReviewHints.map((x) => <li key={x}><TranslatedText text={x} /></li>)}</ul></div></div>}</div>}
      <div className="actions">{canPurchase && <Link className="button" to={`/items/${item.id}/purchase`}>購入手続きへ</Link>}{canUseChecklist && <button className={isChecked ? 'checklistCheckedButton' : 'checklistButton'} onClick={toggleChecklist}>{isChecked ? 'チェックリストに追加済み' : 'チェックリストに追加'}</button>}{user && !isOwnItem && <button className={isSellerBlocked ? 'blockedButton' : 'secondaryButton blockButton'} onClick={toggleBlockSeller}>{isSellerBlocked ? 'ブロック中' : 'この出品者をブロック'}</button>}{isOwnItem && <Link className="button secondary" to="/my/items">出品履歴で編集する</Link>}</div>
      {error && <p className="error">{error}</p>}
    </div>
    {!isOwnItem && <div className="card"><h2>{t('AIに商品について質問する')}</h2><form onSubmit={askAI} className="form"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例: 初心者にも使いやすいですか？" /><button type="submit" disabled={isAskingAI || !question.trim()}>{isAskingAI ? <span className="loadingInline"><span className="spinner" />{t('AIが回答を生成中...')}</span> : t('AIに聞く')}</button></form>{aiAnswerNotice && <p className="muted aiNoticeInline">{aiAnswerNotice}</p>}{aiAnswer && <TranslatedText text={aiAnswer} as="p" className="aiAnswer" />}</div>}
    <div className="card"><h2>公開コメント</h2><p className="muted">他ユーザーにも公開される質問・補足欄です。</p>{user ? <form onSubmit={sendComment} className="form commentForm"><textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="コメントを追加" /><button type="submit">コメントを追加</button></form> : <p className="muted">ログインするとコメントできます。</p>}<div className="messages">{threads.map((thread) => <div key={thread.parent.id} className="thread"><CommentBox message={thread.parent} /><div className="replies">{thread.replies.map((reply) => <CommentBox key={reply.id} message={reply} isReply />)}</div>{user && <div className="replyForm"><input value={replyBodies[thread.parent.id] ?? ''} onChange={(e) => setReplyBodies((c) => ({ ...c, [thread.parent.id]: e.target.value }))} placeholder="このコメントに返信" /><button type="button" onClick={() => sendReply(thread.parent.id)}>返信</button></div>}</div>)}</div></div>
    {user && <div className="card"><h2>非公開DM</h2><p className="muted">購入検討者と出品者だけが見られるDMです。話題ごとに返信できます。</p><div className="messages">{privateThreads.map((thread) => <div key={thread.parent.id} className="thread"><PrivateMessageBox message={thread.parent} currentUserId={user.id} /><div className="replies">{thread.replies.map((reply) => <PrivateMessageBox key={reply.id} message={reply} currentUserId={user.id} isReply />)}</div><div className="replyForm"><input value={privateReplyBodies[thread.parent.id] ?? ''} onChange={(e) => setPrivateReplyBodies((c) => ({ ...c, [thread.parent.id]: e.target.value }))} placeholder="このDMに返信" /><button type="button" onClick={() => sendPrivateReply(thread.parent)}>返信</button></div></div>)}</div><form onSubmit={sendPrivate} className="form"><textarea value={privateBody} onChange={(e) => setPrivateBody(e.target.value)} placeholder="新しい非公開DMを入力" /><button type="submit">DMを送信</button></form></div>}
  </section>;
}
