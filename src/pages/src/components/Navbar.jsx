import React from 'react';
import { Shield, Sun, Moon, LogIn, LogOut, UserCheck, School, Sparkles, BookOpen } from 'lucide-react';

export default function Navbar({ currentUser, onOpenLogin, onLogout, currentRole, onSwitchRole, theme, onToggleTheme, onOpenRules }) {
  return (
    <header className="glass-panel" style={{ borderRadius: '0 0 20px 20px', borderTop: 'none', padding: '1rem 2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }} onClick={() => window.location.reload()}>
          <div style={{ 
            width: '45px', 
            height: '45px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
          }}>
            <Shield size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              JUM DISIPLIN
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <School size={12} /> Sistem Pengurusan Disiplin Kolej
            </p>
          </div>
        </div>

        {/* Demo Role Quick Switcher (For smooth testing & presentation) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', paddingLeft: '0.5rem' }}>Demomode:</span>
          
          <button 
            className={`btn btn-sm ${currentRole === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSwitchRole('admin')}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            🛡️ Admin
          </button>
          
          <button 
            className={`btn btn-sm ${currentRole === 'lecturer' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSwitchRole('lecturer')}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            👨‍🏫 Pensyarah
          </button>
          
          <button 
            className={`btn btn-sm ${currentRole === 'student' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSwitchRole('student')}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            🎓 Student
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Rules Modal Button */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenRules}
            title="Buku Peraturan Kolej"
          >
            <BookOpen size={16} /> Peraturan Kolej
          </button>

          {/* Theme Switcher */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onToggleTheme}
            style={{ width: '38px', height: '38px', padding: 0 }}
            title="Mod Gelap / Terang"
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#3b82f6" />}
          </button>

          {/* User Account / Login State */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <UserCheck size={18} color="var(--primary)" />
                )}
                <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {currentUser.role === 'admin' && '🛡️ Pentadbir'}
                    {currentUser.role === 'lecturer' && '👨‍🏫 Pensyarah'}
                    {currentUser.role === 'student' && `🎓 ${currentUser.matrixNo}`}
                  </div>
                </div>
              </div>

              <button className="btn btn-danger btn-sm" onClick={onLogout} title="Log Keluar">
                <LogOut size={16} /> Log Keluar
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onOpenLogin}>
              <LogIn size={18} /> Log Masuk / Daftar
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
