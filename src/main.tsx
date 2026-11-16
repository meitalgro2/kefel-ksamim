import { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fredoka';
import './styles.css';
import App from './App';

// Ask the browser not to evict our data (important on iPhone).
try {
  navigator.storage?.persist?.();
} catch {
  /* optional */
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="app">
        <section className="screen center">
          <div className="card">
            <h2>אופס, משהו השתבש</h2>
            <p>ההתקדמות שמורה. אפשר לנסות לפתוח שוב.</p>
            <button className="btn btn-primary btn-xl" onClick={() => location.reload()}>לפתוח שוב</button>
          </div>
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
