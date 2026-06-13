import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { checklistApi, itemApi, messageApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Item, Message } from '../types';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusLabel(status: Item['status']): string {
  if (status === 'sold') return '購入済み';
  if (status === 'canceled') return '出品キャンセル';
  return '販売中';
}

type Thread = {
  parent: Message;
  replies: Message[];
};

function buildThreads(messages: Message[]): Thread[] {
  const parents = messages.filter((message) => !message.parentMessageId);
  const replies = messages.filter((message) => message.parentMessageId);

  return parents.map((parent) => ({
    parent,
    replies: replies.filter((reply) => reply.parentMessageId === parent.id),
  }));
}

function CommentBox({ message, isReply }: { message: Message; isReply?: boolean }) {
  return (
    <div className={`message ${isReply ? 'replyMessage' : ''} ${message.isSeller ? 'sellerMessage' : ''}`}>
      <div className="messageHeader">
        <strong className={message.isSeller ? 'sellerName' : ''}>{message.senderName}</strong>
        {message.isSeller && <span className="sellerBadge">出品者</span>}
        <span className="muted">{formatDate(message.updatedAt)}</span>
      </div>
      <p>{message.body}</p>
    </div>
  );
}

// ItemDetailPage は商品詳細、購入、AI質問、コメント欄をまとめて扱う画面です。
export function ItemDetailPage() {
  const { id } = useParams();
  const itemId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [replyBodies, setReplyBodies] = useState<Record<number, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');

  const threads = useMemo(() => buildThreads(messages), [messages]);

  async function load() {
    if (!itemId) return;
    setError('');

    try {
      const [itemData, messageData] = await Promise.all([
        itemApi.get(itemId),
        messageApi.list(itemId).catch(() => []),
      ]);
      setItem(itemData);
      setMessages(messageData);

      if (user && user.id !== itemData.sellerId) {
        const status = await checklistApi.status(itemId).catch(() => ({ checked: false }));
        setIsChecked(status.checked);
      } else {
        setIsChecked(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '商品取得に失敗しました');
    }
  }

  useEffect(() => {
    load();
  }, [itemId, user?.id]);

  async function purchase() {
    if (!item) return;
    setError('');

    try {
      await itemApi.purchase(item.id);
      navigate('/my/purchases?purchased=1');
    } catch (e) {
      setError(e instanceof Error ? e.message : '購入に失敗しました');
    }
  }

  async function toggleChecklist() {
    if (!item || !user) return;
    setError('');

    try {
      if (isChecked) {
        await checklistApi.remove(item.id);
        setIsChecked(false);
      } else {
        await checklistApi.add(item.id);
        setIsChecked(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チェックリスト操作に失敗しました');
    }
  }

  async function askAI(event: FormEvent) {
    event.preventDefault();
    if (!item || !question) return;

    setError('');
    setAiAnswer('');

    try {
      const result = await itemApi.ask(item.id, question);
      setAiAnswer(result.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI回答に失敗しました');
    }
  }

  async function sendComment(event: FormEvent) {
    event.preventDefault();
    if (!item || !user || !commentBody.trim()) return;

    setError('');
    try {
      await messageApi.send(item.id, commentBody);
      setCommentBody('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'コメント送信に失敗しました');
    }
  }

  async function sendReply(parentId: number) {
    if (!item || !user) return;
    const body = replyBodies[parentId]?.trim();
    if (!body) return;

    setError('');
    try {
      await messageApi.send(item.id, body, parentId);
      setReplyBodies((current) => ({ ...current, [parentId]: '' }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '返信に失敗しました');
    }
  }

  if (!item) {
    return <p>読み込み中...</p>;
  }

  const isOwnItem = Boolean(user && user.id === item.sellerId);
  const canPurchase = Boolean(user && item.status === 'available' && user.id !== item.sellerId);
  const canUseChecklist = Boolean(user && user.id !== item.sellerId && item.status !== 'canceled');

  return (
    <section className="detail">
      <div className="card">
        {item.imageUrl ? <img className="detailImage" src={item.imageUrl} alt={item.title} /> : <div className="detailNoImage">No Image</div>}

        <div className="historyHeader">
          <div>
            <h1>{item.title}</h1>
            <p className="muted">出品者: {item.sellerName}</p>
          </div>
          {isOwnItem && <span className="ownerBadge">自分が出品した商品です</span>}
        </div>

        <p>{item.description}</p>

        <dl className="meta">
          <dt>カテゴリ</dt>
          <dd>{item.category}</dd>
          <dt>状態</dt>
          <dd>{item.conditionText}</dd>
          <dt>価格</dt>
          <dd>¥{item.priceYen.toLocaleString()}</dd>
          <dt>ステータス</dt>
          <dd><span className={`statusText ${item.status}`}>{statusLabel(item.status)}</span></dd>
          <dt>最終更新日時</dt>
          <dd>{formatDate(item.updatedAt)}</dd>
        </dl>

        <div className="actions">
          {canPurchase && <button onClick={purchase}>購入する</button>}
          {canUseChecklist && (
            <button className={isChecked ? 'checkedButton' : 'secondaryButton'} onClick={toggleChecklist}>
              {isChecked ? 'チェックリストに追加済み' : 'チェックリストに追加'}
            </button>
          )}
          {isOwnItem && <Link className="button secondary" to="/my/items">出品履歴で編集する</Link>}
        </div>

        {error && <p className="error">{error}</p>}
      </div>

      {!isOwnItem && (
        <div className="card">
          <h2>AIに商品について質問する</h2>
          <form onSubmit={askAI} className="form">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例: 初心者にも使いやすいですか？" />
            <button type="submit">AIに聞く</button>
          </form>
          {aiAnswer && <p className="aiAnswer">{aiAnswer}</p>}
        </div>
      )}

      <div className="card">
        <h2>コメント</h2>
        <p className="muted">質問・補足・返信をコメント欄として残せます。返信が追加されたスレッドほど上に表示されます。</p>

        {user ? (
          <form onSubmit={sendComment} className="form commentForm">
            <textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="コメントを追加" />
            <button type="submit">コメントを追加</button>
          </form>
        ) : (
          <p className="muted">ログインするとコメントできます。</p>
        )}

        <div className="messages">
          {threads.map((thread) => (
            <div key={thread.parent.id} className="thread">
              <CommentBox message={thread.parent} />

              <div className="replies">
                {thread.replies.map((reply) => (
                  <CommentBox key={reply.id} message={reply} isReply />
                ))}
              </div>

              {user && (
                <div className="replyForm">
                  <input
                    value={replyBodies[thread.parent.id] ?? ''}
                    onChange={(e) => setReplyBodies((current) => ({ ...current, [thread.parent.id]: e.target.value }))}
                    placeholder="このコメントに返信"
                  />
                  <button type="button" onClick={() => sendReply(thread.parent.id)}>返信</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
