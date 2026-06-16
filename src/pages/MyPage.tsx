/**
 * マイページ。
 *
 * 残高、今月/累計の売上・利用額、出品者評価、発送元/お届け先住所、
 * 保存検索条件、ブロック、運営DMを管理します。
 * 操作完了メッセージは、画面上部にまとめず、操作したカードの近くに表示します。
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { authApi, meApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { describeSavedSearch } from '../savedSearch';
import type { BlockedUser, SavedSearch, SupportMessage, User } from '../types';
import { formatCoins, formatDate, ratingStars, safeNumber } from '../utils';

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function groupSupportMessages(messages: SupportMessage[]): Array<{ subject: string; messages: SupportMessage[] }> {
  const map = new Map<string, SupportMessage[]>();
  messages.forEach((message) => {
    const subject = message.subject || '一般相談';
    map.set(subject, [...(map.get(subject) ?? []), message]);
  });
  return Array.from(map.entries()).map(([subject, rows]) => ({ subject, messages: rows }));
}

export function MyPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);
  const [chargeAmount, setChargeAmount] = useState('');
  const [shippingRegion, setShippingRegion] = useState(user?.shippingRegion ?? '');
  const [shippingAddress, setShippingAddress] = useState(user?.shippingAddress ?? '');
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportSubject, setSupportSubject] = useState('取引について');
  const [supportBody, setSupportBody] = useState('');
  const [error, setError] = useState('');
  const [sectionMessages, setSectionMessages] = useState<Record<string, string>>({});

  const savedSearchList = useMemo(() => ensureArray<SavedSearch>(savedSearches), [savedSearches]);
  const blockedUserList = useMemo(() => ensureArray<BlockedUser>(blockedUsers), [blockedUsers]);
  const supportThreads = useMemo(() => groupSupportMessages(ensureArray<SupportMessage>(supportMessages)), [supportMessages]);

  function showSectionMessage(section: string, text: string) {
    // マイページには複数の独立した操作があります。
    // すべての完了通知を一箇所に出すと、画面をスクロールしないと見えないため、
    // 操作したカードの近くにだけ成功メッセージを表示します。
    setSectionMessages((current) => ({ ...current, [section]: text }));
  }

  async function load() {
    setError('');
    try {
      const [me, ss, bs, support] = await Promise.all([
        authApi.me(),
        meApi.savedSearches().catch((): SavedSearch[] => []),
        meApi.blocks().catch((): BlockedUser[] => []),
        meApi.supportMessages().catch((): SupportMessage[] => []),
      ]);

      setProfile(me);
      setShippingRegion(me.shippingRegion ?? '');
      setShippingAddress(me.shippingAddress ?? '');
      setSavedSearches(ensureArray<SavedSearch>(ss));
      setBlockedUsers(ensureArray<BlockedUser>(bs));
      setSupportMessages(ensureArray<SupportMessage>(support));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'マイページの取得に失敗しました');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function charge() {
    const amount = Number(chargeAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('チャージ金額を入力してください');
      return;
    }

    try {
      setError('');
      setProfile(await authApi.charge(amount));
      setChargeAmount('');
      showSectionMessage('charge', `${formatCoins(amount)}をチャージしました。通知一覧にも記録しました。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チャージに失敗しました');
    }
  }

  async function updateProfile(event: FormEvent) {
    event.preventDefault();
    try {
      setError('');
      setProfile(await authApi.updateMe({ shippingRegion, shippingAddress }));
      showSectionMessage('profile', '発送元・お届け先住所を保存しました。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    }
  }

  async function sendSupport(event: FormEvent) {
    event.preventDefault();
    if (!supportBody.trim()) {
      setError('運営への連絡内容を入力してください');
      return;
    }

    try {
      setError('');
      await meApi.support(supportSubject.trim() || '一般相談', supportBody);
      setSupportBody('');
      showSectionMessage('support', '運営へ連絡しました。');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '運営への連絡に失敗しました');
    }
  }

  async function deleteSearch(id: number) {
    try {
      setError('');
      await meApi.deleteSavedSearch(id);
      showSectionMessage('savedSearches', '検索条件を削除しました。');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '検索条件の削除に失敗しました');
    }
  }

  async function unblock(userId: number) {
    try {
      setError('');
      await meApi.unblock(userId);
      showSectionMessage('blocks', 'ブロックを解除しました。');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ブロック解除に失敗しました');
    }
  }

  if (!profile) return <p>読み込み中...</p>;

  return (
    <section className="stack">
      <h1>マイページ</h1>
      {error && <p className="error">{error}</p>}

      <div className="card wallet walletDashboard">
        {/* 1列目: ユーザーが現在使える残高を一番大きく表示します。 */}
        <div className="walletBalancePanel">
          <h2 className="walletTitle">残高</h2>
          <p className="bigNumber">{formatCoins(profile.balanceCoins)}</p>
        </div>

        {/* 2列目: 売上と利用額の月次・累計を縦に並べ、収支の概況を一目で見られるようにします。 */}
        <div className="walletUsagePanel">
          <div className="walletMetric"><span>今月の売上額</span><strong>{formatCoins(profile.monthlySalesCoins)}</strong></div>
          <div className="walletMetric"><span>今月の利用額</span><strong>{formatCoins(profile.monthlySpendCoins)}</strong></div>
          <div className="walletMetric"><span>累計売上額</span><strong>{formatCoins(profile.totalSalesCoins)}</strong></div>
          <div className="walletMetric"><span>累計利用額</span><strong>{formatCoins(profile.totalSpendCoins)}</strong></div>
        </div>

        {/* 3列目: 出品者としての信頼度を表示します。 */}
        <div className="walletSellerPanel">
          <h2 className="walletTitle">出品者評価</h2>
          <p className="sellerRatingSummary">
            {safeNumber(profile.ratingCount) > 0 ? (
              <>
                <span className="stars">{ratingStars(profile.ratingAverage)}</span>
                <span>{safeNumber(profile.ratingAverage).toFixed(1)} / 5.0 ({safeNumber(profile.ratingCount)}件)</span>
              </>
            ) : (
              '評価なし'
            )}
          </p>
          <p className="walletMetric inline"><span>取引実績</span><strong>{safeNumber(profile.transactionCount)}件</strong></p>
        </div>
      </div>

      <div className="card">
        <h2>残高チャージ</h2>
        {sectionMessages.charge && <p className="success">{sectionMessages.charge}</p>}
        <div className="actions">
          <input value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value.replace(/\D/g, ''))} placeholder="チャージ金額" />
          <button onClick={charge}>チャージ</button>
        </div>
      </div>

      <form className="card form" onSubmit={updateProfile}>
        <h2>発送元・お届け先住所</h2>
        {sectionMessages.profile && <p className="success">{sectionMessages.profile}</p>}
        <label>地域<input value={shippingRegion} onChange={(e) => setShippingRegion(e.target.value)} placeholder="例: 東京都" /></label>
        <label>住所<textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="お届け先住所・発送元住所" /></label>
        <button type="submit">保存</button>
      </form>


      <div className="card">
        <h2>保存した検索条件</h2>
        {sectionMessages.savedSearches && <p className="success">{sectionMessages.savedSearches}</p>}
        {savedSearchList.length === 0 ? (
          <p className="muted">保存した検索条件はありません。</p>
        ) : (
          <div className="savedSearchList">
            {savedSearchList.map((s) => (
              <div key={s.id} className="savedSearchCard">
                <strong>{s.name}</strong>
                <div className="conditionChips">
                  {describeSavedSearch(s.queryJson).map((row) => <span key={`${s.id}-${row.label}`}>{row.label}: {row.value}</span>)}
                  {describeSavedSearch(s.queryJson).length === 0 && <span>条件指定なし</span>}
                </div>
                <div className="actions">
                  <Link className="button secondary" to={`/?savedSearch=${s.id}`}>商品一覧で反映する</Link>
                  <button className="dangerButton" onClick={() => deleteSearch(s.id)}>削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>ブロックしたユーザー</h2>
        {sectionMessages.blocks && <p className="success">{sectionMessages.blocks}</p>}
        {blockedUserList.length === 0 ? (
          <p className="muted">ブロック中のユーザーはいません。</p>
        ) : (
          blockedUserList.map((b) => (
            <div key={b.id} className="notice">
              <strong>{b.blockedName}</strong>
              <button className="secondaryButton" onClick={() => unblock(b.blockedId)}>ブロック解除</button>
            </div>
          ))
        )}
      </div>

      <form className="card form supportForm" onSubmit={sendSupport}>
        <h2>運営にDMする</h2>
        {sectionMessages.support && <p className="success">{sectionMessages.support}</p>}
        <label>話題<input value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="例: 取引について" /></label>
        <label>本文<textarea value={supportBody} onChange={(e) => setSupportBody(e.target.value)} placeholder="取引上の問題や相談内容を入力してください" /></label>
        <button type="submit">運営へ送信</button>
      </form>

      <div className="card">
        <h2>運営DM履歴</h2>
        {supportThreads.length === 0 ? (
          <p className="muted">運営へのDMはまだありません。</p>
        ) : (
          supportThreads.map((thread) => (
            <div key={thread.subject} className="supportThread">
              <h3>{thread.subject}</h3>
              {thread.messages.map((m) => (
                <div key={m.id} className="message ownPrivateMessage">
                  <div className="messageHeader"><strong>{m.userName}</strong><span className="muted">{formatDate(m.createdAt)}</span></div>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
