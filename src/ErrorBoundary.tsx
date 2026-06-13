import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
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
