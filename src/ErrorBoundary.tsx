/**
 * ファイル概要: hackathon-frontend/src/ErrorBoundary.tsx
 *
 * 役割:
 * React画面で例外が発生しても白画面にせず、ユーザーへ復旧導線を示します。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
type Props = { children: ReactNode };
// 【詳細コメント】このtype宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route rendering failed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <section className="card">
          <h1>画面の表示に失敗しました</h1>
          <p className="error">{this.state.error.message}</p>
          <p className="muted">ページ全体が白くなる代わりに、原因調査用のエラーを表示しています。ブラウザのConsoleも確認してください。</p>
        </section>
      );
    }
    return this.props.children;
  }
}
