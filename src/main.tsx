import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// ─── ChunkLoadError Guard ─────────────────────────────────────────────────────
// When Netlify deploys a new build, old content-hashed JS chunk URLs are
// replaced by new ones. If a user's browser still has the old index.html
// (from any cache layer) it will try to fetch chunks that no longer exist
// → "Failed to fetch dynamically imported module" / ChunkLoadError.
// Catching these globally and forcing a reload fetches fresh index.html
// which references the correct new chunk URLs.
//
// sessionStorage flag prevents an infinite reload loop if the error persists
// after a fresh fetch (e.g. a genuine runtime bug, not a stale-asset issue).
// ─────────────────────────────────────────────────────────────────────────────
const CHUNK_RELOAD_KEY = 'chunk_reload_attempted';

function isChunkLoadError(value: unknown): boolean {
  if (!value) return false;
  const msg =
    (value as Error)?.message ?? (value as { reason?: string })?.reason ?? String(value);
  return (
    (value as Error)?.name === 'ChunkLoadError' ||
    msg.includes('Loading chunk') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Unable to preload CSS')
  );
}

// Synchronous script errors (e.g. chunk parse failure)
window.addEventListener('error', (event) => {
  if (isChunkLoadError(event.error)) {
    if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      console.warn('[App] ChunkLoadError detected (error event) — reloading for fresh assets');
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
    } else {
      // Already reloaded once and still failing — clear flag and let
      // ErrorBoundary show the fallback UI instead of looping.
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }
  }
});

// Promise rejections from dynamic import() calls
window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault(); // stop it appearing in the console as unhandled
    if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      console.warn('[App] ChunkLoadError detected (unhandledrejection) — reloading');
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
    } else {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }
  }
});

// Clear the reload flag on a successful load so the guard resets for the
// next deployment cycle.
window.addEventListener('load', () => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
});

// ─── App version logging ──────────────────────────────────────────────────────
// __APP_VERSION__ is injected at build time by vite.config.ts.
// Useful for debugging "which build is the user on?" in production.
console.info(`[App] shreyafuel version ${__APP_VERSION__} loaded`);

// ─── Root render ─────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// ─── Service Worker registration ─────────────────────────────────────────────
// The SW (public/sw.js) uses network-first for HTML and cache-first only for
// hashed assets.  On every new deploy the activate() handler purges old caches.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' }) // never cache sw.js itself
      .then((registration) => {
        // When a new SW is waiting, reload all clients so they immediately
        // get the fresh assets rather than waiting for the tab to be closed.
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'activated' &&
              navigator.serviceWorker.controller
            ) {
              console.info('[SW] New version activated — reloading for fresh assets');
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  });
}

