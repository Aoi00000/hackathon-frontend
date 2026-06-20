/**
 * ファイル概要: hackathon-frontend/src/pages/MyPage.tsx
 *
 * 役割:
 * プロフィール、残高、支払い方法、月別売上/利用額グラフ、運営問い合わせを管理する画面です。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
/**
 * マイページ。
 *
 * 残高、月別収支グラフ、支払い方法、住所、保存検索条件、ブロック、運営DMを管理します。
 */
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { authApi, meApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { describeSavedSearch } from '../savedSearch';
import type { BlockedUser, MonthlyMoneySummary, PaymentMethod, SavedSearch, SupportMessage, User } from '../types';
import { formatCoins, formatDate, ratingStars, safeNumber } from '../utils';

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function ensureArray<T>(value: T[] | null | undefined): T[] { return Array.isArray(value) ? value : []; }

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function groupSupportMessages(messages: SupportMessage[]): Array<{ subject: string; messages: SupportMessage[] }> {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const map = new Map<string, SupportMessage[]>();
  messages.forEach((message) => {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const subject = message.subject || '一般相談';
    map.set(subject, [...(map.get(subject) ?? []), message]);
  });
  return Array.from(map.entries()).map(([subject, rows]) => ({ subject, messages: rows }));
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function monthLabel(value: string): string {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [, month] = value.split('-');
  return month ? `${Number(month)}月` : value;
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function MonthlyMoneyChart({ rows }: { rows: MonthlyMoneySummary[] }) {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const max = Math.max(1, ...rows.flatMap((row) => [row.salesYen, row.spendYen]));
  return (
    <div className="moneyChart" aria-label="月別売上額と利用額の棒グラフ">
      <div className="moneyChartLegend"><span className="salesLegend">売上額</span><span className="spendLegend">利用額</span></div>
      <div className="moneyChartPlot">
        {rows.map((row) => (
          <div className="moneyChartMonth" key={row.month}>
            <div className="moneyBars">
              <div className="moneyBar salesBar" style={{ height: `${Math.max(4, (row.salesYen / max) * 150)}px` }} title={`売上額 ${formatCoins(row.salesYen)}`}><span>{row.salesYen ? formatCoins(row.salesYen) : ''}</span></div>
              <div className="moneyBar spendBar" style={{ height: `${Math.max(4, (row.spendYen / max) * 150)}px` }} title={`利用額 ${formatCoins(row.spendYen)}`}><span>{row.spendYen ? formatCoins(row.spendYen) : ''}</span></div>
            </div>
            <strong>{monthLabel(row.month)}</strong>
          </div>
        ))}
      </div>
      <p className="muted">取引がない月も0円として表示し、売上と利用額の増減を比較しやすくしています。</p>
    </div>
  );
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function MyPage() {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const { user } = useAuth();
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const paymentRef = useRef<HTMLDivElement | null>(null);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [profile, setProfile] = useState<User | null>(user);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [chargeAmount, setChargeAmount] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [shippingRegion, setShippingRegion] = useState(user?.shippingRegion ?? '');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [shippingAddress, setShippingAddress] = useState(user?.shippingAddress ?? '');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [monthlySummary, setMonthlySummary] = useState<MonthlyMoneySummary[]>([]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [supportSubject, setSupportSubject] = useState('取引について');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [supportBody, setSupportBody] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [error, setError] = useState('');
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const [sectionMessages, setSectionMessages] = useState<Record<string, string>>({});
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【React状態】useStateは、ユーザー操作やAPI取得結果に応じて画面を書き換えるための状態を保持します。
  const [paymentForm, setPaymentForm] = useState({ label: '', cardNumber: '', holderName: '', expiryMonth: '', expiryYear: '', securityCode: '', isDefault: true });

// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const savedSearchList = useMemo(() => ensureArray<SavedSearch>(savedSearches), [savedSearches]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const blockedUserList = useMemo(() => ensureArray<BlockedUser>(blockedUsers), [blockedUsers]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  // 【計算のメモ化】useMemoは、入力が変わらない限り計算結果を再利用し、不要な再計算を抑えます。
  const supportThreads = useMemo(() => groupSupportMessages(ensureArray<SupportMessage>(supportMessages)), [supportMessages]);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  const hasDefaultPayment = paymentMethods.some((method) => method.isDefault);

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  function showSectionMessage(section: string, text: string) { setSectionMessages((current) => ({ ...current, [section]: text })); }

  async function load() {
    setError('');
    try {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
      const [me, ss, bs, support, monthly, payments] = await Promise.all([
        authApi.me(),
        meApi.savedSearches().catch((): SavedSearch[] => []),
        meApi.blocks().catch((): BlockedUser[] => []),
        meApi.supportMessages().catch((): SupportMessage[] => []),
        meApi.monthlyMoneySummary().catch((): MonthlyMoneySummary[] => []),
        meApi.paymentMethods().catch((): PaymentMethod[] => []),
      ]);
      setProfile(me);
      setShippingRegion(me.shippingRegion ?? '');
      setShippingAddress(me.shippingAddress ?? '');
      setSavedSearches(ensureArray<SavedSearch>(ss));
      setBlockedUsers(ensureArray<BlockedUser>(bs));
      setSupportMessages(ensureArray<SupportMessage>(support));
      setMonthlySummary(ensureArray<MonthlyMoneySummary>(monthly));
      setPaymentMethods(ensureArray<PaymentMethod>(payments));
    } catch (e) { setError(e instanceof Error ? e.message : 'マイページの取得に失敗しました'); }
  }

  // 【副作用】useEffectは、画面表示後のAPI取得、イベント登録、タイマー管理などReact外部との接続点です。
  useEffect(() => { load(); }, []);

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
  function scrollToPayments() { paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  async function charge() {
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const amount = Number(chargeAmount);
    if (!Number.isInteger(amount) || amount <= 0) { setError('チャージ金額を入力してください'); return; }
    if (!hasDefaultPayment) {
      setError('残高チャージには、既定の支払い方法登録が必要です。');
      showSectionMessage('charge', '支払い方法が未登録です。下の「支払い方法登録」へ進んでください。');
      scrollToPayments();
      return;
    }
    try {
      setError('');
      setProfile(await authApi.charge(amount));
      setChargeAmount('');
      showSectionMessage('charge', `${formatCoins(amount)}をチャージしました。通知一覧にも記録しました。`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チャージに失敗しました');
      if (e instanceof Error && e.message.includes('支払い方法')) scrollToPayments();
    }
  }

  async function createPayment(event: FormEvent) {
    event.preventDefault();
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const expiryMonth = Number(paymentForm.expiryMonth);
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const expiryYear = Number(paymentForm.expiryYear);
    try {
      setError('');
      await meApi.createPaymentMethod({ ...paymentForm, expiryMonth, expiryYear, isDefault: paymentForm.isDefault || paymentMethods.length === 0 });
      setPaymentForm({ label: '', cardNumber: '', holderName: '', expiryMonth: '', expiryYear: '', securityCode: '', isDefault: true });
      showSectionMessage('payments', '支払い方法を登録しました。通知一覧にも記録しました。');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : '支払い方法の登録に失敗しました'); }
  }

  async function setDefaultPayment(id: number) { try { setError(''); await meApi.setDefaultPaymentMethod(id); showSectionMessage('payments', 'チャージに使用する支払い方法を変更しました。通知一覧にも記録しました。'); await load(); } catch (e) { setError(e instanceof Error ? e.message : '既定支払い方法の変更に失敗しました'); } }
  async function deletePayment(id: number) { if (!confirm('この支払い方法を削除しますか？')) return; try { setError(''); await meApi.deletePaymentMethod(id); showSectionMessage('payments', '支払い方法を削除しました。通知一覧にも記録しました。'); await load(); } catch (e) { setError(e instanceof Error ? e.message : '支払い方法の削除に失敗しました'); } }

  async function updateProfile(event: FormEvent) { event.preventDefault(); try { setError(''); setProfile(await authApi.updateMe({ shippingRegion, shippingAddress })); showSectionMessage('profile', '発送元・お届け先住所を保存しました。'); } catch (e) { setError(e instanceof Error ? e.message : '保存に失敗しました'); } }
  async function sendSupport(event: FormEvent) { event.preventDefault(); if (!supportBody.trim()) { setError('運営への連絡内容を入力してください'); return; } try { setError(''); await meApi.support(supportSubject.trim() || '一般相談', supportBody); setSupportBody(''); showSectionMessage('support', '運営へ連絡しました。'); await load(); } catch (e) { setError(e instanceof Error ? e.message : '運営への連絡に失敗しました'); } }
  async function deleteSearch(id: number) { try { setError(''); await meApi.deleteSavedSearch(id); showSectionMessage('savedSearches', '検索条件を削除しました。'); await load(); } catch (e) { setError(e instanceof Error ? e.message : '検索条件の削除に失敗しました'); } }
  async function unblock(userId: number) { try { setError(''); await meApi.unblock(userId); showSectionMessage('blocks', 'ブロックを解除しました。'); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'ブロック解除に失敗しました'); } }

  if (!profile) return <p>読み込み中...</p>;

  return (
    <section className="stack myPageSurface">
      <h1>マイページ</h1>
      {error && <p className="error">{error}</p>}

      <div className="card wallet walletDashboard colorfulCard walletColorCard">
        <div className="walletBalancePanel"><h2 className="walletTitle">残高</h2><p className="bigNumber">{formatCoins(profile.balanceCoins)}</p></div>
        <div className="walletUsagePanel"><div className="walletMetric"><span>今月の売上額</span><strong>{formatCoins(profile.monthlySalesCoins)}</strong></div><div className="walletMetric"><span>今月の利用額</span><strong>{formatCoins(profile.monthlySpendCoins)}</strong></div><div className="walletMetric"><span>累計売上額</span><strong>{formatCoins(profile.totalSalesCoins)}</strong></div><div className="walletMetric"><span>累計利用額</span><strong>{formatCoins(profile.totalSpendCoins)}</strong></div></div>
        <div className="walletSellerPanel"><h2 className="walletTitle">出品者評価</h2><p className="sellerRatingSummary">{safeNumber(profile.ratingCount) > 0 ? <><span className="stars">{ratingStars(profile.ratingAverage)}</span><span>{safeNumber(profile.ratingAverage).toFixed(1)} / 5.0 ({safeNumber(profile.ratingCount)}件)</span></> : '評価なし'}</p><p className="walletMetric inline"><span>取引実績</span><strong>{safeNumber(profile.transactionCount)}件</strong></p></div>
      </div>

      <div className="card colorfulCard moneyTrendCard"><h2>月別のお金の出入り</h2><MonthlyMoneyChart rows={monthlySummary} /></div>

      <div className="card colorfulCard chargeCard"><h2>残高チャージ</h2>{sectionMessages.charge && <p className={hasDefaultPayment ? 'success' : 'error'}>{sectionMessages.charge}</p>}<p className="muted">チャージには、下の支払い方法登録で既定のカードを1つ選択しておく必要があります。</p><div className="actions"><input value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value.replace(/\D/g, ''))} placeholder="チャージ金額" /><button onClick={charge}>チャージ</button>{!hasDefaultPayment && <button type="button" className="secondaryButton" onClick={scrollToPayments}>支払い方法を登録する</button>}</div></div>

      <div className="card colorfulCard paymentCard" ref={paymentRef}><h2>支払い方法登録</h2>{sectionMessages.payments && <p className="success">{sectionMessages.payments}</p>}<p className="muted">デモ用の登録機能です。実運用ではカード番号を直接保存せず、決済代行サービスのトークン化を使います。</p>{paymentMethods.length === 0 ? <p className="error">支払い方法が未登録です。残高チャージ前に1つ登録してください。</p> : <div className="paymentMethodList">{paymentMethods.map((method) => <div key={method.id} className={`paymentMethodCard ${method.isDefault ? 'default' : ''}`}><div><strong>{method.label}</strong><p>**** **** **** {method.cardLast4} / {method.holderName} / {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}</p>{method.isDefault && <span className="defaultBadge">チャージに使用</span>}</div><div className="actions"><button type="button" className="secondaryButton" onClick={() => setDefaultPayment(method.id)} disabled={method.isDefault}>既定にする</button><button type="button" className="dangerButton" onClick={() => deletePayment(method.id)}>削除</button></div></div>)}</div>}
        <form className="form paymentForm" onSubmit={createPayment}><label>登録名<input value={paymentForm.label} onChange={(e) => setPaymentForm((c) => ({ ...c, label: e.target.value }))} placeholder="例: メインカード" required /></label><label>カード番号<input value={paymentForm.cardNumber} onChange={(e) => setPaymentForm((c) => ({ ...c, cardNumber: e.target.value.replace(/[^0-9\s-]/g, '') }))} placeholder="4242 4242 4242 4242" required /></label><label>名義<input value={paymentForm.holderName} onChange={(e) => setPaymentForm((c) => ({ ...c, holderName: e.target.value.toUpperCase() }))} placeholder="TARO HONGO" required /></label><div className="formTwoColumns"><label>有効期限(月)<input value={paymentForm.expiryMonth} onChange={(e) => setPaymentForm((c) => ({ ...c, expiryMonth: e.target.value.replace(/\D/g, '') }))} placeholder="12" required /></label><label>有効期限(年)<input value={paymentForm.expiryYear} onChange={(e) => setPaymentForm((c) => ({ ...c, expiryYear: e.target.value.replace(/\D/g, '') }))} placeholder="28" required /></label></div><label>セキュリティコード<input value={paymentForm.securityCode} onChange={(e) => setPaymentForm((c) => ({ ...c, securityCode: e.target.value.replace(/\D/g, '') }))} placeholder="123" required /></label><label className="checkboxLabel"><input type="checkbox" checked={paymentForm.isDefault} onChange={(e) => setPaymentForm((c) => ({ ...c, isDefault: e.target.checked }))} />この支払い方法をチャージに使用する</label><button type="submit">支払い方法を登録</button></form>
      </div>

      <form className="card form colorfulCard addressCard" onSubmit={updateProfile}><h2>発送元・お届け先住所</h2>{sectionMessages.profile && <p className="success">{sectionMessages.profile}</p>}<label>地域<input value={shippingRegion} onChange={(e) => setShippingRegion(e.target.value)} placeholder="例: 東京都" /></label><label>住所<textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="お届け先住所・発送元住所" /></label><button type="submit">保存</button></form>

      <div className="card colorfulCard savedSearchColorCard"><h2>保存した検索条件</h2>{sectionMessages.savedSearches && <p className="success">{sectionMessages.savedSearches}</p>}{savedSearchList.length === 0 ? <p className="muted">保存した検索条件はありません。</p> : <div className="savedSearchList">{savedSearchList.map((s) => <div key={s.id} className="savedSearchCard"><strong>{s.name}</strong><div className="conditionChips">{describeSavedSearch(s.queryJson).map((row) => <span key={`${s.id}-${row.label}`}>{row.label}: {row.value}</span>)}{describeSavedSearch(s.queryJson).length === 0 && <span>条件指定なし</span>}</div><div className="actions"><Link className="button secondary" to={`/?savedSearch=${s.id}`}>商品一覧で反映する</Link><button className="dangerButton" onClick={() => deleteSearch(s.id)}>削除</button></div></div>)}</div>}</div>

      <div className="card colorfulCard blockColorCard"><h2>ブロックしたユーザー</h2>{sectionMessages.blocks && <p className="success">{sectionMessages.blocks}</p>}{blockedUserList.length === 0 ? <p className="muted">ブロック中のユーザーはいません。</p> : blockedUserList.map((b) => <div key={b.id} className="notice"><strong>{b.blockedName}</strong><button className="secondaryButton" onClick={() => unblock(b.blockedId)}>ブロック解除</button></div>)}</div>

      <form className="card form supportForm colorfulCard supportColorCard" onSubmit={sendSupport}><h2>運営にDMする</h2>{sectionMessages.support && <p className="success">{sectionMessages.support}</p>}<label>話題<input value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="例: 取引について" /></label><label>本文<textarea value={supportBody} onChange={(e) => setSupportBody(e.target.value)} placeholder="取引上の問題や相談内容を入力してください" /></label><button type="submit">運営へ送信</button></form>

      <div className="card colorfulCard supportHistoryColorCard"><h2>運営DM履歴</h2>{supportThreads.length === 0 ? <p className="muted">運営へのDMはまだありません。</p> : supportThreads.map((thread) => <div key={thread.subject} className="supportThread"><h3>{thread.subject}</h3>{thread.messages.map((m) => <div key={m.id} className="message ownPrivateMessage"><div className="messageHeader"><strong>{m.userName}</strong><span className="muted">{formatDate(m.createdAt)}</span></div><p>{m.body}</p></div>)}</div>)}</div>
    </section>
  );
}
