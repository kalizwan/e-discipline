import React from 'react';
import { Shield, BookOpen, Sun, Moon } from 'lucide-react';
import { DEFAULT_AVATAR } from '../data/mockData';

export default function TopHeader({ currentUser, currentRole, onLogout, theme, onToggleTheme, onOpenRules, onOpenAdminProfile }) {
  if (!currentUser) return null;

  const roleBadgeText =
    currentRole === 'admin' ? 'ADMIN HEP' :
    currentRole === 'lecturer' ? 'PENSYARAH' : 'PELAJAR';

  const roleSubText =
    currentRole === 'admin' ? '🛡️ Pentadbir' :
    currentRole === 'lecturer' ? '👨‍🏫 Pensyarah' : '🎓 Pelajar';

  const defaultAvatar = DEFAULT_AVATAR;

  return (
    <header className="top-header-junction">
      {/* Junction Left: Brand Logo in Header (0px - 240px) */}
      <div className="top-header-brand-junction">
        <img
          src="/kk_tawau_logo_transparent.png?v=2"
          alt="Logo Kolej Komuniti Tawau"
          style={{
            height: '38px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />
        <div className="top-header-brand-text">
          <span className="top-header-brand-name">Disiplin kk Tawau</span>
          <span className="top-header-brand-sub">Sistem Pengurusan Disiplin</span>
        </div>
      </div>

      {/* Junction Right: Header Actions & Account Pill */}
      <div className="top-header-right-junction">
        {/* Peraturan Kolej */}
        <button className="btn btn-secondary btn-sm" onClick={onOpenRules}>
          <BookOpen size={15} /> Peraturan Kolej
        </button>

        {/* Theme Toggle */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onToggleTheme}
          title="Mod Gelap / Terang"
        >
          {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#3b82f6" />}
          <span>{theme === 'dark' ? 'Mod Terang' : 'Mod Gelap'}</span>
        </button>

        {/* User Account Pill (Avatar + Name + Role + Logout) */}
        <div className="user-account-pill">
          <div
            onClick={onOpenAdminProfile}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
            title="Klik untuk ke Akaun Admin"
          >
            <img
              src={currentUser.avatar || defaultAvatar}
              alt={currentUser.name}
              className="user-account-avatar"
            />
            <div className="user-account-text">
              <span className="user-account-name">{currentUser.name}</span>
              <span className="user-account-sub">{roleSubText}</span>
            </div>
            <span className="badge badge-info user-role-badge">
              <Shield size={11} /> {roleBadgeText}
            </span>
          </div>
          <button className="btn btn-danger btn-sm logout-pill-btn" onClick={onLogout} title="Log Keluar">
            Log Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
