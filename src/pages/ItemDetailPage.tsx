import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { itemApi, messageApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Item, Message } from '../types';

// ItemDetailPage は商品詳細、購入、AI質問、DMをまとめて扱う画面です。
export function ItemDetailPage() {
  const { id } = useParams();
  const itemId = Number(id);
  const { user } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageBody, setMessageBody] = useState('');
  const [error, setError] = useState('');

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
    } catch (e) {
      setError(e instanceof Error ? e.message : '商品取得に失敗しました');
    }
  }

  useEffect(() => {
    load();
  }, [itemId]);

  async function purchase() {
    if (!item) return;
    setError('');

    try {
      await itemApi.purchase(item.id);
      await load();
      alert('購入しました');
    } catch (e) {
      setError(e instanceof Error ? e.message : '購入に失敗しました');
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

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!item || !user || !messageBody) return;

    // MVPでは、購入者から出品者へ送る想定にしています。
    const receiverId = item.sellerId;

    setError('');
    try {
      await messageApi.send(item.id, receiverId, messageBody);
      setMessageBody('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'メッセージ送信に失敗しました');
    }
  }

  if (!item) {
    return <p>読み込み中...</p>;
  }

  const canPurchase = user && item.status === 'available' && user.id !== item.sellerId;
  const canMessage = user && user.id !== item.sellerId;

  return (
    <section className="detail">
      <div className="card">
        {item.imageUrl ? <img className="detailImage" src={item.imageUrl} alt={item.title} /> : <div className="detailNoImage">No Image</div>}

        <h1>{item.title}</h1>
        <p className="muted">出品者: {item.sellerName}</p>
        <p>{item.description}</p>

        <dl className="meta">
          <dt>カテゴリ</dt>
          <dd>{item.category}</dd>
          <dt>状態</dt>
          <dd>{item.conditionText}</dd>
          <dt>価格</dt>
          <dd>¥{item.priceYen.toLocaleString()}</dd>
          <dt>ステータス</dt>
          <dd>{item.status}</dd>
        </dl>

        {canPurchase && <button onClick={purchase}>購入する</button>}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>AIに商品について質問する</h2>
        <form onSubmit={askAI} className="form">
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例: 初心者にも使いやすいですか？" />
          <button type="submit">AIに聞く</button>
        </form>
        {aiAnswer && <p className="aiAnswer">{aiAnswer}</p>}
      </div>

      <div className="card">
        <h2>DM</h2>

        <div className="messages">
          {messages.map((message) => (
            <div key={message.id} className="message">
              <strong>{message.senderName}</strong>
              <p>{message.body}</p>
            </div>
          ))}
        </div>

        {canMessage ? (
          <form onSubmit={sendMessage} className="form">
            <textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="出品者に質問する" />
            <button type="submit">送信</button>
          </form>
        ) : (
          <p className="muted">ログインすると出品者に質問できます。</p>
        )}
      </div>
    </section>
  );
}
