import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { checklistApi, itemApi, meApi, messageApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Item, Message, PrivateMessage } from '../types';
import { formatDate, formatYen, normalizeImageUrl, purchaseStatusLabel, safeNumber, statusLabel } from '../utils';

type Thread = { parent: Message; replies: Message[] };
function buildThreads(messages: Message[]): Thread[] { const parents = messages.filter((m) => !m.parentMessageId); const replies = messages.filter((m) => m.parentMessageId); return parents.map((p) => ({ parent: p, replies: replies.filter((r) => r.parentMessageId === p.id) })); }
function CommentBox({ message, isReply }: { message: Message; isReply?: boolean }) { return <div className={`message ${isReply ? 'replyMessage' : ''} ${message.isSeller ? 'sellerMessage' : ''}`}><div className="messageHeader"><strong className={message.isSeller ? 'sellerName' : ''}>{message.senderName}</strong>{message.isSeller && <span className="sellerBadge">出品者</span>}<span className="muted">{formatDate(message.updatedAt)}</span></div><p>{message.body}</p></div>; }

export function ItemDetailPage() {
  const { id } = useParams();
  const itemId = Number(id);
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [privateBody, setPrivateBody] = useState('');
  const [replyBodies, setReplyBodies] = useState<Record<number, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const [imageBroken, setImageBroken] = useState(false);
  const threads = useMemo(() => buildThreads(messages), [messages]);

  async function load() {
    if (!itemId) return;
    setError('');
    try {
      const [itemData, messageData] = await Promise.all([itemApi.get(itemId), messageApi.list(itemId).catch(() => [])]);
      setItem(itemData); setMessages(messageData);
      if (user) {
        setPrivateMessages(await messageApi.listPrivate(itemId).catch(() => []));
        if (user.id !== itemData.sellerId) setIsChecked((await checklistApi.status(itemId).catch(() => ({ checked: false }))).checked); else setIsChecked(false);
      }
    } catch (e) { setError(e instanceof Error ? e.message : '商品取得に失敗しました'); }
  }
  useEffect(() => { load(); }, [itemId, user?.id]);

  async function toggleChecklist() { if (!item || !user) return; setError(''); try { if (isChecked) { await checklistApi.remove(item.id); setIsChecked(false); } else { await checklistApi.add(item.id); setIsChecked(true); } } catch (e) { setError(e instanceof Error ? e.message : 'チェックリスト操作に失敗しました'); } }
  async function askAI(event: FormEvent) { event.preventDefault(); if (!item || !question) return; setError(''); setAiAnswer(''); try { setAiAnswer((await itemApi.ask(item.id, question)).text); } catch (e) { setError(e instanceof Error ? e.message : 'AI回答に失敗しました'); } }
  async function sendComment(event: FormEvent) { event.preventDefault(); if (!item || !user || !commentBody.trim()) return; setError(''); try { await messageApi.send(item.id, commentBody); setCommentBody(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'コメント送信に失敗しました'); } }
  async function sendReply(parentId: number) { if (!item || !user) return; const body = replyBodies[parentId]?.trim(); if (!body) return; setError(''); try { await messageApi.send(item.id, body, parentId); setReplyBodies((c) => ({ ...c, [parentId]: '' })); await load(); } catch (e) { setError(e instanceof Error ? e.message : '返信に失敗しました'); } }
  async function sendPrivate(event: FormEvent) { event.preventDefault(); if (!item || !user || !privateBody.trim()) return; setError(''); try { await messageApi.sendPrivate(item.id, privateBody, item.sellerId === user.id ? privateMessages.find((m) => m.senderId !== user.id)?.senderId : undefined); setPrivateBody(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'DM送信に失敗しました'); } }
  async function blockSeller() { if (!item) return; if (!confirm(`${item.sellerName} をブロックしますか？`)) return; try { await meApi.block(item.sellerId); alert('ブロックしました'); } catch (e) { setError(e instanceof Error ? e.message : 'ブロックに失敗しました'); } }

  if (!item) return <p>読み込み中...</p>;
  const isOwnItem = Boolean(user && user.id === item.sellerId);
  const canPurchase = Boolean(user && item.status === 'available' && !isOwnItem);
  const canUseChecklist = Boolean(user && !isOwnItem && item.status !== 'canceled');
  const image = normalizeImageUrl(item.imageUrl);

  return <section className="detail">
    <div className="card">
      {image && !imageBroken ? <img className="detailImage" src={image} alt={item.title} onError={() => setImageBroken(true)} /> : <div className="detailNoImage">No Image<br /><small>画像URLが直接画像を返さない場合は表示できません。Google Driveの場合は共有リンクではなく画像ファイルの直リンクを指定してください。</small></div>}
      <div className="historyHeader"><div><span className="productCode">{item.productCode}</span><h1>{item.title}</h1><p className="muted">出品者: {item.sellerName}</p></div>{isOwnItem && <span className="ownerBadge">自分が出品した商品です</span>}</div>
      <p>{item.description}</p>
      <dl className="meta"><dt>独自商品ID</dt><dd>{item.productCode}</dd><dt>カテゴリ</dt><dd>{item.category}</dd><dt>状態</dt><dd>{item.conditionText}</dd><dt>価格</dt><dd>{formatYen(item.priceYen)}</dd><dt>送料</dt><dd>送料無料</dd><dt>商品の受け渡し方法</dt><dd>{item.deliveryMethod}</dd><dt>発送までの日数</dt><dd>{item.shippingDays}日</dd><dt>発送元の地域</dt><dd>{item.shipFromRegion}</dd><dt>サイズ</dt><dd>{item.size || '-'}</dd><dt>色</dt><dd>{item.color || '-'}</dd><dt>タグ</dt><dd>{item.tags || '-'}</dd><dt>ステータス</dt><dd><span className={`statusText ${item.status}`}>{statusLabel(item.status)}</span></dd><dt>最終更新日時</dt><dd>{formatDate(item.updatedAt)}</dd><dt>出品者評価</dt><dd>{item.sellerRatingCount ? `${safeNumber(item.sellerRatingAverage).toFixed(1)} / 5 (${item.sellerRatingCount}件)` : '評価なし'}</dd><dt>取引実績</dt><dd>{item.sellerTransactionCount}件</dd></dl>
      {item.purchaseStatus && <p className="success">取引状態: {purchaseStatusLabel(item.purchaseStatus)} {item.shippingDeadline && ` / 発送期限: ${formatDate(item.shippingDeadline)}`}</p>}
      <div className="actions">{canPurchase && <Link className="button" to={`/items/${item.id}/purchase`}>購入手続きへ</Link>}{canUseChecklist && <button className={isChecked ? 'checklistCheckedButton' : 'checklistButton'} onClick={toggleChecklist}>{isChecked ? 'チェックリストに追加済み' : 'チェックリストに追加'}</button>}{user && !isOwnItem && <button className="secondaryButton" onClick={blockSeller}>この出品者をブロック</button>}{isOwnItem && <Link className="button secondary" to="/my/items">出品履歴で編集する</Link>}</div>
      {error && <p className="error">{error}</p>}
    </div>
    {!isOwnItem && <div className="card"><h2>AIに商品について質問する</h2><form onSubmit={askAI} className="form"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例: 初心者にも使いやすいですか？" /><button type="submit">AIに聞く</button></form>{aiAnswer && <p className="aiAnswer">{aiAnswer}</p>}</div>}
    <div className="card"><h2>公開コメント</h2><p className="muted">他ユーザーにも公開される質問・補足欄です。</p>{user ? <form onSubmit={sendComment} className="form commentForm"><textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="コメントを追加" /><button type="submit">コメントを追加</button></form> : <p className="muted">ログインするとコメントできます。</p>}<div className="messages">{threads.map((thread) => <div key={thread.parent.id} className="thread"><CommentBox message={thread.parent} /><div className="replies">{thread.replies.map((reply) => <CommentBox key={reply.id} message={reply} isReply />)}</div>{user && <div className="replyForm"><input value={replyBodies[thread.parent.id] ?? ''} onChange={(e) => setReplyBodies((c) => ({ ...c, [thread.parent.id]: e.target.value }))} placeholder="このコメントに返信" /><button type="button" onClick={() => sendReply(thread.parent.id)}>返信</button></div>}</div>)}</div></div>
    {user && <div className="card"><h2>非公開DM</h2><p className="muted">購入検討者と出品者だけが見られるDMです。運営への連絡はマイページから行えます。</p><div className="messages">{privateMessages.map((m) => <div key={m.id} className={`message ${m.senderId === user.id ? 'ownPrivateMessage' : ''}`}><div className="messageHeader"><strong>{m.senderName}</strong><span className="muted">{formatDate(m.createdAt)}</span></div><p>{m.body}</p></div>)}</div><form onSubmit={sendPrivate} className="form"><textarea value={privateBody} onChange={(e) => setPrivateBody(e.target.value)} placeholder="非公開DMを入力" /><button type="submit">DMを送信</button></form></div>}
  </section>;
}
