/**
 * ファイル概要: hackathon-frontend/src/pages/AIChatPage.tsx
 *
 * 役割:
 * 話題ごとのAI対話スレッドを表示し、会話履歴をDBに残すAI相談画面です。
 *
 */

/**
 * 実装詳細メモ:
 * ユーザーの自由相談をスレッド単位でDBに保存し、左側の話題一覧と右側の会話履歴を同期します。
 * 外部AIが失敗した場合もusedFallback/noticeを表示できるため、生成AI機能の状態をデモ中に説明しやすい画面です。
 */
/**
 * AI対話ページ。
 *
 * 以前は、この画面の会話履歴をReact stateだけで持っていたため、ページを開き直すと履歴が消えていました。
 * 現在は、バックエンドの ai_chat_threads / ai_chat_messages テーブルに保存し、
 * 「話題ごとのスレッド」と「各スレッド内の発言履歴」を読み直せる構成にしています。
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { aiApi } from '../api/client';
import type { AIChatMessage, AIChatThread } from '../types';
import { formatDate } from '../utils';

// デモでワンクリック送信しやすい例文です。
// 「次世代フリマ」らしく、生活相談から自然におすすめグッズへつなげられる題材にしています。
const examples = [
  '休日の遊びのおすすめない？',
  '家の模様替えをしてみたいんだけどいい案ない？',
  '勉強に集中したいんだけど便利なグッズない？',
  '自炊を始めたいんだけど何を揃えるといい？',
];

// 空スレッドや読み込み直後に表示する案内用メッセージです。
// DBには保存せず、UI上だけに出すことで履歴データを汚さないようにします。
const welcomeMessage: AIChatMessage = {
  id: 0,
  threadId: 0,
  role: 'assistant',
  body: 'こんにちは。左側で話題を選ぶか、「新しい話題」を作って相談してください。回答の最後に、フリマで探しやすいおすすめグッズも一般名で提案します。',
  usedFallback: false,
  createdAt: new Date().toISOString(),
};

// スレッド一覧は、更新されたものが上に来る方が会話アプリらしく使いやすいです。
// 送信直後に返ってきた updatedAt を使い、フロント側でも即座に並び替えます。
function sortThreads(threads: AIChatThread[]): AIChatThread[] {
  return [...threads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// 既存スレッドを更新するか、まだリストにない新規スレッドを先頭へ足します。
// 新規作成直後・メッセージ送信直後のどちらにも使えるようにしています。
function upsertThread(threads: AIChatThread[], next: AIChatThread): AIChatThread[] {
  const without = threads.filter((thread) => thread.id !== next.id);
  return sortThreads([next, ...without]);
}

// AIChatPage は、DBに保存されるAI対話スレッドとメッセージを操作する画面です。
// 左で話題を選び、右で会話を続ける構成にして、フリマ相談や商品提案の履歴を後から読み返せるようにします。
export function AIChatPage() {
  // 入力欄に現在打っている相談文です。
  const [input, setInput] = useState('');
  // 左側サイドバーに出すAI対話スレッド一覧です。
  const [threads, setThreads] = useState<AIChatThread[]>([]);
  // 現在開いているスレッドIDです。nullなら、まだ話題が選ばれていない状態です。
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  // 右側チャット欄に出す、選択中スレッドのメッセージ履歴です。
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  // API通信中にボタンを二重押しできないようにするためのフラグです。
  const [isLoading, setIsLoading] = useState(false);
  // 画面上部に出すエラーメッセージです。
  const [error, setError] = useState('');

  // activeThreadIdから、現在選択中のスレッド本体を取り出します。
  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeThreadId) ?? null, [threads, activeThreadId]);

  // 初回表示時に、DBへ保存済みのAI対話スレッドを読み込みます。
  // 既存スレッドがあれば一番新しいものを自動選択し、なければ空状態のまま案内を表示します。
  useEffect(() => {
    let cancelled = false;
    async function loadThreads() {
      try {
        setError('');
        const list = sortThreads(await aiApi.chatThreads());
        if (cancelled) return;
        setThreads(list);
        setActiveThreadId((current) => current ?? list[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'AI対話スレッドの取得に失敗しました');
      }
    }
    loadThreads();
    return () => { cancelled = true; };
  }, []);

  // 選択中スレッドが変わったら、そのスレッドの履歴をDBから読み込みます。
  // スレッド未選択なら、案内メッセージだけを表示します。
  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      if (!activeThreadId) {
        setMessages([welcomeMessage]);
        return;
      }
      try {
        setError('');
        const history = await aiApi.chatMessages(activeThreadId);
        if (cancelled) return;
        setMessages(history.length > 0 ? history : [{ ...welcomeMessage, threadId: activeThreadId }]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'AI対話履歴の取得に失敗しました');
      }
    }
    loadMessages();
    return () => { cancelled = true; };
  }, [activeThreadId]);

  // 「新しい話題」ボタン用の処理です。
  // 空のスレッドを先に作って選択し、ユーザーが後から自由に送信できる状態にします。
  async function createThread(title = '新しい相談') {
    setError('');
    setIsLoading(true);
    try {
      const thread = await aiApi.createChatThread(title);
      setThreads((current) => upsertThread(current, thread));
      setActiveThreadId(thread.id);
      setMessages([{ ...welcomeMessage, threadId: thread.id, body: '新しい話題を作りました。相談内容を入力してください。' }]);
      return thread;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI対話スレッドの作成に失敗しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  // 左側のスレッド削除ボタン用の処理です。
  // 削除後は、残っている一番新しいスレッドを開き、なければ案内状態へ戻します。
  async function deleteThread(threadId: number) {
    if (!confirm('このAI対話スレッドを削除しますか？')) return;
    setError('');
    try {
      await aiApi.deleteChatThread(threadId);
      setThreads((current) => {
        const next = current.filter((thread) => thread.id !== threadId);
        if (activeThreadId === threadId) setActiveThreadId(next[0]?.id ?? null);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI対話スレッドの削除に失敗しました');
    }
  }

  // 送信処理です。
  // スレッド未選択の場合は、最初の相談文をタイトルにしてスレッドを自動作成してから送ります。
  async function submit(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const text = (preset ?? input).trim();
    if (!text || isLoading) return;

    setError('');
    setInput('');
    setIsLoading(true);

    try {
      let targetThreadId = activeThreadId;
      if (!targetThreadId) {
        const thread = await aiApi.createChatThread(text);
        setThreads((current) => upsertThread(current, thread));
        setActiveThreadId(thread.id);
        targetThreadId = thread.id;
      }

      // welcomeMessageはDB由来ではないため、実際の発言を追加する直前に取り除きます。
      setMessages((current) => current.filter((message) => message.id !== 0));
      const result = await aiApi.sendChatMessage(targetThreadId, text);
      setThreads((current) => upsertThread(current, result.thread));
      setActiveThreadId(result.thread.id);
      setMessages((current) => [
        ...current.filter((message) => message.id !== 0),
        result.userMessage,
        result.assistantMessage,
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI対話に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="aiChatPage stack fullWidthPage">
      {error && <p className="error">{error}</p>}

      <div className="aiChatLayout">
        <aside className="card aiChatSidebar">
          <div className="sectionHeaderCompact">
            <div>
              <span className="muted">話題リスト</span>
              <h2>AI対話スレッド</h2>
            </div>
            <button type="button" onClick={() => createThread()} disabled={isLoading}>新しい話題</button>
          </div>
          {threads.length === 0 ? (
            <p className="muted">まだ保存済みの話題はありません。右側に相談を入力すると自動で作成されます。</p>
          ) : (
            <div className="aiThreadList">
              {threads.map((thread) => (
                <button key={thread.id} type="button" className={`aiThreadButton ${thread.id === activeThreadId ? 'active' : ''}`} onClick={() => setActiveThreadId(thread.id)}>
                  <span>{thread.title}</span>
                  <small>{formatDate(thread.updatedAt)}</small>
                  <em role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); deleteThread(thread.id); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); deleteThread(thread.id); } }}>削除</em>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="aiChatMainColumn">
          <div className="card aiChatHero">
            <span className="aiBadge">AI対話</span>
            <h1>暮らしと買い物の相談AI</h1>
            <p className="muted">話題ごとにスレッドを分けて、休日の過ごし方、模様替え、勉強、自炊などを相談できます。履歴はDBに保存されるため、ページを開き直しても続きから確認できます。</p>
            <div className="examplePromptList">
              {examples.map((example) => <button type="button" className="secondaryButton" key={example} onClick={() => submit(undefined, example)}>{example}</button>)}
            </div>
          </div>

          <div className="card aiChatWindow">
          <div className="aiChatWindowHeader">
            <div>
              <span className="muted">選択中の話題</span>
              <h2>{activeThread?.title ?? '新しい相談'}</h2>
            </div>
            {activeThread && <small className="muted">最終更新: {formatDate(activeThread.updatedAt)}</small>}
          </div>

          <div className="chatMessages">
            {messages.map((message) => (
              <div key={`${message.threadId}-${message.id}-${message.role}`} className={`chatBubble ${message.role}`}>
                <strong>{message.role === 'user' ? 'あなた' : 'AI'}</strong>
                <p>{message.body}</p>
                {message.notice && <small className="muted">{message.notice}</small>}
              </div>
            ))}
            {isLoading && <div className="chatBubble assistant"><strong>AI</strong><p className="loadingInline"><span className="spinner" />回答を生成しています...</p></div>}
          </div>

          <form className="aiChatForm" onSubmit={(event) => submit(event)}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="例: 休日の遊びのおすすめない？" />
            <button type="submit" disabled={isLoading || !input.trim()}>送信</button>
          </form>
          </div>
        </main>
      </div>
    </section>
  );
}
