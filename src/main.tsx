import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Filter unhandled errors and rejections coming from browser extensions (e.g. MetaMask, phantom, etc.)
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  const file = event.filename || '';
  if (
    file.includes('chrome-extension://') ||
    file.includes('moz-extension://') ||
    msg.includes('MetaMask') ||
    msg.toLowerCase().includes('failed to connect to metamask')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = typeof reason === 'string' ? reason : reason?.message || '';
  const stack = reason?.stack || '';
  if (
    msg.includes('MetaMask') ||
    msg.toLowerCase().includes('failed to connect to metamask') ||
    stack.includes('chrome-extension://') ||
    stack.includes('moz-extension://')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
