import React from 'react';
import ReactDOM from 'react-dom/client';
import { lazy, Suspense } from 'react';
import './index.css';

const CorporateSite = lazy(() => import('./corporate/CorporateSite'));
const EmployeePortal = lazy(() => import('./App'));
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const isPortal = path === '/portal' || path.startsWith('/portal/') || path === '/admin';
if (isPortal) {
  document.title = 'Employee Portal | HST Enterprises';
  const robots = document.createElement('meta');
  robots.name = 'robots'; robots.content = 'noindex, nofollow'; document.head.appendChild(robots);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Suspense fallback={<div role="status" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8f7f3', color: '#232361', fontFamily: 'sans-serif', fontSize: 14 }}>Loading HST Enterprises…</div>}>
      {isPortal ? <EmployeePortal /> : path === '/' ? <CorporateSite /> : <div style={{ padding: '15vh 24px', textAlign: 'center', fontFamily: 'sans-serif' }}><h1>Page not found</h1><p>This page may have moved.</p><a href="/">Return to HST Enterprises</a> · <a href="/portal">Employee portal</a></div>}
    </Suspense>
  </React.StrictMode>
);
