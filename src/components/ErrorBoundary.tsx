import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  // Track how many consecutive reloads have been attempted to prevent
  // infinite reload loops when the error is not chunk-load related.
  reloadCount: number;
}

const RELOAD_COUNT_KEY = 'eb_reload_count';
const MAX_AUTO_RELOADS = 1;

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    reloadCount: parseInt(sessionStorage.getItem(RELOAD_COUNT_KEY) || '0', 10),
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);

    // If this looks like a stale-chunk error (old HTML references a JS chunk
    // that no longer exists after a new deploy), reload once automatically.
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module');

    if (isChunkError && this.state.reloadCount < MAX_AUTO_RELOADS) {
      const next = this.state.reloadCount + 1;
      sessionStorage.setItem(RELOAD_COUNT_KEY, String(next));
      console.warn(`[ErrorBoundary] ChunkLoadError — auto-reloading (attempt ${next})`);
      window.location.reload();
    }
  }

  handleManualReload = () => {
    // Clear the reload counter so the user gets a clean retry.
    sessionStorage.removeItem(RELOAD_COUNT_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.name === 'ChunkLoadError' ||
        this.state.error?.message.includes('Loading chunk') ||
        this.state.error?.message.includes('Failed to fetch dynamically imported module');

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            padding: '24px',
            background: '#f8fafc',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            ⚠️
          </div>

          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
            {isChunkError ? 'App Updated — Reload Required' : 'Something went wrong'}
          </h1>

          <p style={{ margin: 0, color: '#64748b', maxWidth: 380, lineHeight: 1.6, fontSize: 14 }}>
            {isChunkError
              ? 'A new version of Shreya Petroleum was deployed. Please reload to get the latest version.'
              : 'An unexpected error occurred. Your data is safe — try reloading the page.'}
          </p>

          {/* Show the error message in dev so developers can diagnose it */}
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                background: '#1e293b',
                color: '#f1f5f9',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 12,
                textAlign: 'left',
                maxWidth: '100%',
                overflow: 'auto',
                maxHeight: 180,
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleManualReload}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
