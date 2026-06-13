import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n';
import './styles.css';

// Reactアプリのエントリーポイントです。
// BrowserRouterで画面遷移を有効にし、AuthProviderでログイン状態を全体共有します。
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
