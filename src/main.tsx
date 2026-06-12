import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import './styles.css';

// Reactアプリのエントリーポイントです。
// BrowserRouterで画面遷移を有効にし、AuthProviderでログイン状態を全体共有します。
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
