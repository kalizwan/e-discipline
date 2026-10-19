import React, { useState } from 'react';
import {
  LayoutDashboard, UserCheck, GraduationCap, AlertTriangle,
  FileText, BarChart3, ChevronLeft, ChevronRight, Menu, X, User, UserCog
} from 'lucide-react';

// ─── Nav items per role ───────────────────────────────────────
const ADMIN_NAV = [
  { id: 'dashboard',      label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'staff-requests', label: 'Pengurusan Staf',  icon: UserCheck },
  { id: 'students',       label: 'Akaun Pelajar',    icon: GraduationCap },
  { id: 'cases',          label: 'Database Kes',     icon: AlertTriangle },
  { id: 'appeals',        label: 'Rayuan',           icon: FileText },
  { id: 'analytics',      label: 'Butiran Akaun Pelajar', icon: User },
  { id: 'admin-profile',  label: 'Akaun Admin',      icon: UserCog },
];

const LECTURER_NAV = [
  { id: 'lecturer-home',      label: 'Portal Pensyarah',    icon: LayoutDashboard },
  { id: 'lecturer-dashboard', label: 'Dashboard Analitik',  icon: BarChart3 },
];

const STUDENT_NAV = [
  { id: 'student-home', label: 'Portal Pelajar', icon: LayoutDashboard },
];

export default function Sidebar({
  currentUser,
  currentRole,
  activeTab,
  onChangeTab,
  onSwitchRole,
  pendingStaffCount = 0,
  pendingAppealsCount = 0,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = currentRole === 'admin' ? ADMIN_NAV
    : currentRole === 'lecturer' ? LECTURER_NAV
    : STUDENT_NAV;

  const getBadge = (id) => {
    if (id === 'staff-requests') return 0;
    if (id === 'appeals') return pendingAppealsCount;
    return 0;
  };

  const sidebarWidth = collapsed ? 68 : 230;

  const handleNavClick = (id) => {
    onChangeTab(id);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="sidebar-inner">
      {/* ── Nav Items ── */}
      <nav className="sidebar-nav">
        {!collapsed && (
          <span className="sidebar-section-label" style={{ marginBottom: '0.4rem', marginTop: '0.2rem' }}>
            {currentRole === 'admin' ? 'MENU ADMIN' : currentRole === 'lecturer' ? 'MENU STAF' : 'MENU PELAJAR'}
          </span>
        )}
        {navItems.map(item => {
          const Icon = item.icon;
          const badge = getBadge(item.id);
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              title={collapsed ? item.label : ''}
            >
              <span className="sidebar-nav-icon">
                <Icon size={18} />
              </span>
              {!collapsed && (
                <span className="sidebar-nav-label">{item.label}</span>
              )}
              {badge > 0 && (
                <span className={`sidebar-badge ${collapsed ? 'sidebar-badge-dot' : ''}`}>
                  {collapsed ? '' : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Collapse Toggle (desktop) ── */}
      <button
        className="sidebar-collapse-btn"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Buka sidebar' : 'Kecilkan sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );

  return (
    <>
      {/* ── Mobile Hamburger Button ── */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Buka menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Desktop Sidebar (Junction below 64px header) ── */}
      <aside
        className="sidebar"
        style={{ width: `${sidebarWidth}px` }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar (slide-in) ── */}
      <aside className={`sidebar sidebar-mobile ${mobileOpen ? 'open' : ''}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
