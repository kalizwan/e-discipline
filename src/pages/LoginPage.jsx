import React, { useState, useEffect, useRef } from 'react';
import { Shield, Mail, Key, LogIn, BookOpen, Sun, Moon, AlertCircle } from 'lucide-react';
import GlassLeaves from '../components/GlassLeaves';

export default function LoginPage({ onLogin, onRegisterLecturer, onOpenRules, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const pageRef = useRef(null);

  // Kesan kabut oren lembut mengikut pergerakan tetikus (dilicinkan dengan lerp)
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const fast = { ...target };
    const slow = { ...target };
    let raf;

    const onMove = (e) => { target.x = e.clientX; target.y = e.clientY; };
    const tick = () => {
      fast.x += (target.x - fast.x) * 0.12;
      fast.y += (target.y - fast.y) * 0.12;
      slow.x += (target.x - slow.x) * 0.04;
      slow.y += (target.y - slow.y) * 0.04;
      el.style.setProperty('--fog-x', `${fast.x}px`);
      el.style.setProperty('--fog-y', `${fast.y}px`);
      el.style.setProperty('--fog-x2', `${slow.x}px`);
      el.style.setProperty('--fog-y2', `${slow.y}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const res = onLogin({ email, password });
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="login-page" ref={pageRef}>
      <div className="login-ambient" aria-hidden="true"><span /><span /><span /></div>
      <GlassLeaves />
      <div className="login-fog" aria-hidden="true" />
      {/* ── Top Bar ── */}
      <header className="login-topbar">
        <div className="login-topbar-brand">
          <img
            src="/kk_tawau_logo_transparent.png?v=2"
            alt="Logo Kolej Komuniti Tawau"
            style={{
              height: '38px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          />
          <div>
            <div className="login-topbar-name">Disiplin kk Tawau</div>
            <div className="login-topbar-sub">Kolej Komuniti Tawau, Sabah</div>
          </div>
        </div>

        <div className="login-topbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={onOpenRules}>
            <BookOpen size={14} /> Peraturan Kolej
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onToggleTheme}
            style={{ width: '38px', height: '38px', padding: 0 }}
            title="Mod Gelap / Terang"
          >
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#3b82f6" />}
          </button>
        </div>
      </header>

      {/* ── Center Login Card ── */}
      <main className="login-main">
        <div className="login-card glass-panel">

          {/* Logo & Title */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0.85rem' }}>
              <img
                src="/kk_tawau_logo_transparent.png?v=2"
                alt="Logo Kolej Komuniti Tawau"
                style={{
                  height: '52px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
                }}
              />
            </div>

            <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.3rem 1rem' }}>
              PORTAL DISIPLIN KOLEJ KOMUNITI TAWAU
            </span>
            <h2 className="login-title" style={{ marginTop: '0.4rem' }}>Disiplin kk Tawau</h2>
            <p className="login-subtitle">
              Sila masukkan Emel dan Kata Laluan
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="login-error">
              <AlertCircle size={15} /> {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Emel / No. Matrik</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan email anda"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Kata Laluan</label>
              <div className="login-input-wrap">
                <Key size={16} className="login-input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Masukkan kata laluan anda"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-submit-btn">
              <LogIn size={16} /> Log Masuk
            </button>
          </form>

          {/* Rules link */}
          <button
            type="button"
            className="login-rules-link"
            onClick={onOpenRules}
          >
            📋 Jum ikut peraturan kolej yang telah di buat
          </button>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="login-footer">
        © 2026 <strong>Jum Disiplin</strong> — Kolej Komuniti Tawau (Akta 174 HEP)
      </footer>
    </div>
  );
}
