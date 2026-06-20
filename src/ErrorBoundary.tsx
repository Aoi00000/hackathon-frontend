/**
 * ファイル概要: hackathon-frontend/src/ErrorBoundary.tsx
 *
 * 役割:
 * React画面で例外が発生しても白画面にせず、ユーザーへ復旧導線を示します。
 *
 */

/**
 * 実装詳細メモ:
 * Reactの描画例外を最上位で受け止め、白画面ではなく再読み込み可能な案内に変換します。
 * 商品画像、AI回答、APIレスポンスの想定外データで子コンポーネントが落ちても、アプリ全体の説明やデモを続けられるようにする保険です。
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

// Props は、ErrorBoundaryで保護したい子要素を受け取るための型です。
// App全体をchildrenとして包むことで、どこかの画面で例外が出ても白画面ではなく復旧用UIを表示できます。
type Props = { children: ReactNode };

// State は、Reactの描画中に捕捉したエラーを保持します。
// errorがnullなら通常表示、Errorオブジェクトが入ればフォールバック画面へ切り替える単純な状態管理です。
type State = { error: Error | null };

// ErrorBoundary は、Reactクラスコンポーネントでしか実装できないエラー境界です。
// 子コンポーネントのrender中エラーを受け止め、デモ中や開発中にアプリ全体が真っ白になる状況を避けます。
export class ErrorBoundary extends Component<Props, State> {
  // state.error は、最後に捕捉した描画エラーです。
  // 初期値はnullにし、問題が起きるまでは通常通りchildrenを描画します。
  state: State = { error: null };

  // getDerivedStateFromError は、Reactがエラーを検知した直後にstateを更新する特別な静的メソッドです。
  // ここでerrorを保存すると、次のrenderでフォールバックUIへ切り替わります。
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  // componentDidCatch は、エラー内容とコンポーネントスタックをログへ残すためのライフサイクルです。
  // ユーザーには簡単なメッセージだけを見せ、開発者はConsoleから原因を追えるようにします。
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route rendering failed:', error, info);
  }

  // render は、エラーがあればフォールバック画面、なければ通常の子画面を返します。
  // ErrorBoundary自体は業務ロジックを持たず、表示失敗時の最後の安全網として働きます。
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
