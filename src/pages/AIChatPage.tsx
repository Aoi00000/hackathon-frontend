import { FormEvent, useState } from 'react';

import { aiApi } from '../api/client';

type ChatMessage = { role: 'user' | 'assistant'; text: string; notice?: string };

const examples = [
  '休日の遊びのおすすめない？',
  '家の模様替えをしてみたいんだけどいい案ない？',
  '勉強に集中したいんだけど便利なグッズない？',
  '自炊を始めたいんだけど何を揃えるといい？',
];

export function AIChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'こんにちは。やりたいことや困っていることを自由に相談してください。回答の最後に、役立ちそうなおすすめグッズも一般名で提案します。' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const text = (preset ?? input).trim();
    if (!text || isLoading) return;
    setError('');
    setInput('');
    setMessages((current) => [...current, { role: 'user', text }]);
    setIsLoading(true);
    try {
      const result = await aiApi.chat(text);
      setMessages((current) => [...current, { role: 'assistant', text: result.text, notice: result.notice }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI対話に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="aiChatPage stack">
      <div className="card aiChatHero">
        <span className="aiBadge">AI対話</span>
        <h1>暮らしと買い物の相談AI</h1>
        <p className="muted">休日の過ごし方、模様替え、勉強、自炊など、自由な相談に答えます。最後にフリマで探しやすい一般名のおすすめグッズも提示します。</p>
        <div className="examplePromptList">
          {examples.map((example) => <button type="button" className="secondaryButton" key={example} onClick={() => submit(undefined, example)}>{example}</button>)}
        </div>
      </div>

      <div className="card aiChatWindow">
        <div className="chatMessages">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`chatBubble ${message.role}`}>
              <strong>{message.role === 'user' ? 'あなた' : 'AI'}</strong>
              <p>{message.text}</p>
              {message.notice && <small className="muted">{message.notice}</small>}
            </div>
          ))}
          {isLoading && <div className="chatBubble assistant"><strong>AI</strong><p className="loadingInline"><span className="spinner" />回答を生成しています...</p></div>}
        </div>
        {error && <p className="error">{error}</p>}
        <form className="aiChatForm" onSubmit={(event) => submit(event)}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="例: 休日の遊びのおすすめない？" />
          <button type="submit" disabled={isLoading || !input.trim()}>送信</button>
        </form>
      </div>
    </section>
  );
}
