import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Elak skrin kosong: jika ada ralat, papar mesej dan butang muat semula
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Ralat aplikasi:', error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#0b132b', color: '#e2e8f0', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Sesuatu tidak kena</h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1rem' }}>
            Paparan terhenti. Data anda selamat. Tekan butang di bawah untuk muat semula.
          </p>
          <pre style={{ fontSize: '0.7rem', textAlign: 'left', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.06)', padding: '0.6rem', borderRadius: 8, marginBottom: '1rem' }}>
            {String(this.state.error && this.state.error.message || this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
            Muat Semula
          </button>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)