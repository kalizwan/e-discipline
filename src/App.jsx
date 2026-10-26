import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import LoginPage from './pages/LoginPage';
import RegisterStudentModal from './components/RegisterStudentModal';
import ReportCaseModal from './components/ReportCaseModal';
import AppealModal from './components/AppealModal';
import RulesModal from './components/RulesModal';
import { ToastProvider, useToast } from './components/ToastContext';
import ToastContainer from './components/Toast';

import AdminDashboard from './pages/AdminDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import StudentDashboard from './pages/StudentDashboard';

import { initialUsers, initialCases, initialAppeals, initialCollegeRules, DEFAULT_AVATAR } from './data/mockData';
import { supabase } from './supabaseClient';

// Simpan ke localStorage tanpa menjatuhkan aplikasi jika storan telefon penuh
function safeLocalSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('localStorage penuh, data hanya disimpan di awan:', err);
  }
}

function AppInner() {
  const { addToast } = useToast();

  const [theme, setTheme] = useState(() => localStorage.getItem('jum_theme') || 'dark');

  const DATA_VERSION = 'v8_student_profile_edit_ic';

  const assignSequentialCaseIds = (casesList) => {
    if (!Array.isArray(casesList) || casesList.length === 0) return [];
    const chronological = [...casesList].sort((a, b) => {
      const tA = new Date(a.timestamp || a.date || 0).getTime();
      const tB = new Date(b.timestamp || b.date || 0).getTime();
      return tA - tB;
    });

    const idMap = new Map();
    chronological.forEach((c, idx) => {
      const seqId = `CASE-${String(idx + 1).padStart(3, '0')}`;
      idMap.set(c, seqId);
    });

    return casesList.map(c => ({
      ...c,
      id: idMap.get(c) || c.id,
    }));
  };

  const sanitizeUsers = (list) =>
    (list || []).map(u => ({
      ...u,
      avatar: (!u.avatar || u.avatar.includes('images.unsplash.com')) ? DEFAULT_AVATAR : u.avatar,
      status: (u.role === 'lecturer' && u.status === 'pending') ? 'approved' : u.status,
    }));

  const [users, setUsers] = useState(() => {
    const savedVer = localStorage.getItem('jum_data_version');
    if (savedVer !== DATA_VERSION) {
      localStorage.setItem('jum_data_version', DATA_VERSION);
      localStorage.setItem('jum_users', JSON.stringify(initialUsers));
      localStorage.setItem('jum_cases', JSON.stringify(initialCases));
      localStorage.setItem('jum_appeals', JSON.stringify(initialAppeals));
      return sanitizeUsers(initialUsers);
    }
    const saved = localStorage.getItem('jum_users');
    return saved ? sanitizeUsers(JSON.parse(saved)) : sanitizeUsers(initialUsers);
  });

  const [cases, setCases] = useState(() => {
    const savedVer = localStorage.getItem('jum_data_version');
    if (savedVer !== DATA_VERSION) return initialCases;
    const saved = localStorage.getItem('jum_cases');
    const loaded = saved ? JSON.parse(saved) : initialCases;
    return assignSequentialCaseIds(loaded);
  });

  const [appeals, setAppeals] = useState(() => {
    const savedVer = localStorage.getItem('jum_data_version');
    if (savedVer !== DATA_VERSION) return initialAppeals;
    const saved = localStorage.getItem('jum_appeals');
    return saved ? JSON.parse(saved) : initialAppeals;
  });

  const [rules] = useState(initialCollegeRules);

  // Wajib masuk page login dahulu secara default
  const [currentRole, setCurrentRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ── Active tab (lifted from AdminDashboard → App) ──
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Modals ──
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [isReportCaseOpen, setIsReportCaseOpen] = useState(false);
  const [isAppealOpen, setIsAppealOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [showPortal, setShowPortal] = useState(true);

  // ── Supabase Cloud Sync (data dikongsi antara laptop & telefon) ──
  // Setiap rekod disimpan dalam jadual app_users / app_cases / app_appeals (id + data JSON)
  const CLOUD_TABLES = { users: 'app_users', cases: 'app_cases', appeals: 'app_appeals' };
  const cloudReadyRef = useRef(false);
  const cloudErrorShownRef = useRef(false);
  const syncedRef = useRef({ users: new Map(), cases: new Map(), appeals: new Map() });
  const latestRef = useRef({ users, cases, appeals });
  latestRef.current = { users, cases, appeals };

  const toRowMap = (list) => new Map((list || []).map(r => [r.id, JSON.stringify(r)]));

  const fromCloudRows = (rows) => (rows || []).map(r => ({ ...r.data, id: r.id }));

  const hasPendingLocalChanges = () => {
    const cur = latestRef.current;
    return ['users', 'cases', 'appeals'].some(key => {
      const now = toRowMap(cur[key]);
      const old = syncedRef.current[key];
      if (now.size !== old.size) return true;
      for (const [id, json] of now) if (old.get(id) !== json) return true;
      return false;
    });
  };

  const reportCloudError = (err) => {
    console.error('Supabase sync error:', err);
    if (!cloudErrorShownRef.current) {
      cloudErrorShownRef.current = true;
      addToast({ type: 'warning', title: 'Simpanan Awan Gagal', message: 'Data belum dapat disimpan ke Supabase. Semak jadual app_users / app_cases / app_appeals.' });
    }
  };

  const pullFromCloud = async () => {
    try {
      const [uRes, cRes, aRes] = await Promise.all([
        supabase.from(CLOUD_TABLES.users).select('id,data'),
        supabase.from(CLOUD_TABLES.cases).select('id,data'),
        supabase.from(CLOUD_TABLES.appeals).select('id,data'),
      ]);
      if (uRes.error || cRes.error || aRes.error) {
        reportCloudError(uRes.error || cRes.error || aRes.error);
        return false;
      }

      let dbUsers = fromCloudRows(uRes.data);
      let dbCases = fromCloudRows(cRes.data);
      let dbAppeals = fromCloudRows(aRes.data);

      // Sekali sahaja bagi setiap peranti: hantar data tempatan yang belum ada di awan
      if (!localStorage.getItem('jum_cloud_seeded_v2')) {
        const local = latestRef.current;
        const missing = (localList, dbList) => {
          const ids = new Set(dbList.map(r => r.id));
          return (localList || []).filter(r => r && r.id && !ids.has(r.id));
        };
        const toPush = {
          users: missing(local.users.length ? local.users : initialUsers, dbUsers),
          cases: missing(local.cases, dbCases),
          appeals: missing(local.appeals, dbAppeals),
        };
        for (const key of ['users', 'cases', 'appeals']) {
          if (toPush[key].length === 0) continue;
          const { error } = await supabase
            .from(CLOUD_TABLES[key])
            .upsert(toPush[key].map(r => ({ id: r.id, data: r })));
          if (error) { reportCloudError(error); return false; }
        }
        dbUsers = [...dbUsers, ...toPush.users];
        dbCases = [...dbCases, ...toPush.cases];
        dbAppeals = [...dbAppeals, ...toPush.appeals];
        localStorage.setItem('jum_cloud_seeded_v2', '1');
      }

      const nextUsers = sanitizeUsers(dbUsers.length ? dbUsers : initialUsers);
      const nextCases = [...dbCases].sort((a, b) => new Date(b.timestamp || b.date || 0) - new Date(a.timestamp || a.date || 0));
      const nextAppeals = dbAppeals;

      syncedRef.current = {
        users: toRowMap(nextUsers),
        cases: toRowMap(nextCases),
        appeals: toRowMap(nextAppeals),
      };
      setUsers(nextUsers);
      setCases(nextCases);
      setAppeals(nextAppeals);
      cloudReadyRef.current = true;
      return true;
    } catch (err) {
      console.warn('Supabase offline, guna data tempatan:', err);
      return false;
    }
  };

  const pushLocalChanges = async () => {
    if (!cloudReadyRef.current) return;
    const cur = latestRef.current;
    for (const key of ['users', 'cases', 'appeals']) {
      const now = toRowMap(cur[key]);
      const old = syncedRef.current[key];
      const changed = (cur[key] || []).filter(r => r && r.id && old.get(r.id) !== now.get(r.id));
      const removedIds = [...old.keys()].filter(id => !now.has(id));

      if (changed.length > 0) {
        const { error } = await supabase
          .from(CLOUD_TABLES[key])
          .upsert(changed.map(r => ({ id: r.id, data: r })));
        if (error) { reportCloudError(error); continue; }
        changed.forEach(r => old.set(r.id, now.get(r.id)));
      }
      if (removedIds.length > 0) {
        const { error } = await supabase.from(CLOUD_TABLES[key]).delete().in('id', removedIds);
        if (error) { reportCloudError(error); continue; }
        removedIds.forEach(id => old.delete(id));
      }
    }
  };

  // Tarik data dari awan semasa buka, kemudian segar semula setiap 15 saat & bila kembali ke tab/aplikasi
  useEffect(() => {
    pullFromCloud();
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      if (hasPendingLocalChanges()) return;
      pullFromCloud();
    };
    const timer = setInterval(refresh, 15000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  // Simpan perubahan tempatan ke awan secara automatik
  useEffect(() => { pushLocalChanges(); }, [users, cases, appeals]);

  // LocalStorage sync
  useEffect(() => {
    setUsers(prev => sanitizeUsers(prev));
    setCases(prev => {
      const normalized = assignSequentialCaseIds(prev);
      const isDiff = normalized.some((c, i) => c.id !== prev[i]?.id);
      return isDiff ? normalized : prev;
    });
    setCurrentUser(prev =>
      prev && (!prev.avatar || prev.avatar.includes('images.unsplash.com'))
        ? { ...prev, avatar: DEFAULT_AVATAR }
        : prev
    );
  }, []);
  useEffect(() => { safeLocalSet('jum_users', users); }, [users]);
  useEffect(() => { safeLocalSet('jum_cases', cases); }, [cases]);
  useEffect(() => { safeLocalSet('jum_appeals', appeals); }, [appeals]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jum_theme', theme);

    // Sync theme ke portal iframe
    const iframe = document.getElementById('kkts-portal-iframe');
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({ type: 'SET_THEME', theme }, '*');
        if (typeof iframe.contentWindow.applyTheme === 'function') {
          iframe.contentWindow.applyTheme(theme);
        }
      } catch (err) {}
    }
  }, [theme]);

  // ── Handlers ──
  const handleSwitchRole = (role) => {
    setCurrentRole(role);
    if (role === 'admin') {
      setCurrentUser(users.find(u => u.role === 'admin') || null);
      setAdminActiveTab('dashboard');
    } else if (role === 'lecturer') {
      setCurrentUser(users.find(u => u.role === 'lecturer' && u.status === 'approved') || null);
      setAdminActiveTab('lecturer-home');
    } else {
      setCurrentUser(users.find(u => u.role === 'student') || null);
    }
  };

  const handleLogin = ({ email, password, matrixNo, role }) => {
    const inputId = (email || matrixNo || '').trim().toLowerCase();
    const inputPass = (password || '').trim();

    if (!inputId || !inputPass) {
      return { success: false, message: 'Sila masukkan Emel dan Kata Laluan!' };
    }

    // 1. Semak akaun Admin
    const adminFound = users.find(u => u.role === 'admin' && u.email?.toLowerCase() === inputId && u.password === inputPass);
    if (adminFound) {
      setCurrentUser(adminFound);
      setCurrentRole('admin');
      setAdminActiveTab('dashboard');
      addToast({ type: 'success', title: 'Log Masuk Admin', message: `Selamat datang, ${adminFound.name}!` });
      return { success: true };
    }

    // 2. Semak akaun Pensyarah / Staf
    const lecturerFound = users.find(u => u.role === 'lecturer' && u.email?.toLowerCase() === inputId && u.password === inputPass);
    if (lecturerFound) {
      if (lecturerFound.status === 'pending') {
        return { success: false, message: 'Akaun staf ini masih menunggu pengesahan Admin.' };
      }
      setCurrentUser(lecturerFound);
      setCurrentRole('lecturer');
      setAdminActiveTab('lecturer-home');
      addToast({ type: 'success', title: 'Log Masuk Pensyarah', message: `Selamat datang, ${lecturerFound.name}!` });
      return { success: true };
    }

    // 3. Semak akaun Pelajar (boleh guna No. Matrik ATAU Emel)
    const studentFound = users.find(u => u.role === 'student' && 
      (u.matrixNo?.toLowerCase() === inputId || u.email?.toLowerCase() === inputId) && 
      u.password === inputPass
    );
    if (studentFound) {
      setCurrentUser(studentFound);
      setCurrentRole('student');
      addToast({ type: 'success', title: 'Log Masuk Pelajar', message: `Selamat datang, ${studentFound.name}!` });
      return { success: true };
    }

    return { success: false, message: 'Emel / No. Matrik atau Kata Laluan tidak sah!' };
  };

  const handleRegisterLecturer = ({ name, email, password, department }) => {
    if (users.find(u => u.email === email)) return { success: false, message: 'Emel ini telah didaftarkan.' };
    setUsers(prev => [...prev, { id: `staff-${Date.now()}`, role: 'lecturer', name, email, password, department, gender: 'Lelaki', status: 'pending', avatar: DEFAULT_AVATAR }]);
    addToast({ type: 'info', title: 'Permohonan Dihantar', message: `${name} — menunggu kelulusan Admin.` });
    return { success: true };
  };

  const handleRegisterStudent = ({ matrixNo, icNo, password, name, gender, course, courseCode, semester, intakeYear }) => {
    if (users.find(u => u.matrixNo?.trim().toUpperCase() === matrixNo?.trim().toUpperCase())) {
      return { success: false, message: 'Sila masukkan kad matrik baharu' };
    }
    const newStudent = {
      id: `stud-${Date.now()}`,
      role: 'student',
      matrixNo,
      icNo: icNo || '',
      password,
      name,
      gender: gender || 'Lelaki',
      course,
      courseCode: courseCode || 'STM',
      semester,
      intakeYear: intakeYear || '2026',
      tahunMasuk: intakeYear || '2026',
      meritPoints: 0,
      demeritPoints: 0,
      status: 'Baik',
      avatar: DEFAULT_AVATAR
    };
    setUsers(prev => [...prev, newStudent]);
    addToast({ type: 'success', title: 'Akaun Pelajar Dicipta', message: `${name} (${matrixNo}) berjaya didaftarkan.` });
    return { success: true };
  };

  const handleApproveStaff = (staffId) => {
    const s = users.find(u => u.id === staffId);
    setUsers(prev => prev.map(u => u.id === staffId ? { ...u, status: 'approved' } : u));
    addToast({ type: 'success', title: 'Staf Diluluskan', message: `${s?.name} kini aktif.` });
  };

  const handleRejectStaff = (staffId) => {
    const s = users.find(u => u.id === staffId);
    setUsers(prev => prev.filter(u => u.id !== staffId));
    addToast({ type: 'danger', title: 'Permohonan Ditolak', message: `Permohonan ${s?.name} dipadam.` });
  };

  const handleSubmitCase = async (caseData) => {
    const maxCaseNum = cases.reduce((m, c) => { const n = parseInt(String(c.id || '').replace(/\D/g, ''), 10); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const nextNum = maxCaseNum + 1;
    const formattedId = `CASE-${String(nextNum).padStart(3, '0')}`;
    const newCase = {
      id: formattedId,
      ...caseData,
      status: 'Dalam Siasatan',
      timestamp: caseData.timestamp || new Date().toISOString(),
    };

    setCases(prev => [newCase, ...prev]);

    setUsers(prev => prev.map(u => {
      if (u.matrixNo === caseData.studentMatrix) {
        const nd = u.demeritPoints + (caseData.demeritPoints || 0);
        const updated = { ...u, demeritPoints: nd, status: nd >= 50 ? 'Tatatertib' : nd >= 30 ? 'Amaran' : 'Baik' };
        return updated;
      }
      return u;
    }));

    addToast({ type: 'warning', title: 'Kes Dilaporkan', message: `Status: Dalam Siasatan` });
  };

  const handleUpdateCaseStatus = (caseId, newStatus) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
    addToast({ type: 'info', title: 'Status Dikemas Kini', message: `${caseId} → ${newStatus}` });
  };

  const handleSubmitAppeal = async (appealData) => {
    const newAppeal = { id: `APP-${Date.now()}`, ...appealData, status: 'Pending' };
    setAppeals(prev => [newAppeal, ...prev]);
    addToast({ type: 'info', title: 'Rayuan Dihantar', message: 'Menunggu semakan Admin.' });
  };

  const handleApproveAppeal = (appealId) => {
    const app = appeals.find(a => a.id === appealId);
    if (!app) return;
    setAppeals(prev => prev.map(a => a.id === appealId ? { ...a, status: 'Approved' } : a));

    setUsers(prev => prev.map(u => {
      if (u.matrixNo === app.studentMatrix) {
        const rd = Math.max(0, u.demeritPoints - 15);
        const updated = { ...u, demeritPoints: rd, status: rd < 30 ? 'Baik' : 'Amaran' };
        return updated;
      }
      return u;
    }));
    addToast({ type: 'success', title: 'Rayuan Diluluskan', message: `${app.studentName} — Rayuan tatatertib berjaya diluluskan.` });
  };

  const handleRejectAppeal = (appealId) => {
    const app = appeals.find(a => a.id === appealId);
    setAppeals(prev => prev.map(a => a.id === appealId ? { ...a, status: 'Rejected' } : a));
    addToast({ type: 'danger', title: 'Rayuan Ditolak', message: `Rayuan ${app?.studentName} ditolak.` });
  };

  const handleResetData = () => {
    setUsers(initialUsers); setCases(initialCases); setAppeals(initialAppeals);
    localStorage.setItem('jum_users', JSON.stringify(initialUsers));
    localStorage.setItem('jum_cases', JSON.stringify(initialCases));
    localStorage.setItem('jum_appeals', JSON.stringify(initialAppeals));
    setCurrentUser(initialUsers[0]); setCurrentRole('admin');
    setAdminActiveTab('dashboard'); setIsResetConfirmOpen(false);
    addToast({ type: 'warning', title: 'Data Direset', message: 'Semua data kembali ke asal.' });
  };

  const handleUpdateStudent = (updatedStudent) => {
    setUsers(prev => prev.map(u => u.id === updatedStudent.id ? updatedStudent : u));
    addToast({ type: 'success', title: 'Kemas Kini Akaun Pelajar', message: `Maklumat ${updatedStudent.name} (${updatedStudent.matrixNo}) berjaya disimpan.` });
  };

  const handleDeleteStudent = (studentId) => {
    const s = users.find(u => u.id === studentId);
    if (!s) return;
    const targetMatrix = s.matrixNo?.trim().toUpperCase();

    // 1. Padam rekod pelajar daripada users
    setUsers(prev => prev.filter(u => u.id !== studentId));

    // 2. Padam semua kes kesalahan pelajar ini daripada database kes
    if (targetMatrix) {
      setCases(prev => prev.filter(c => c.studentMatrix?.trim().toUpperCase() !== targetMatrix));
      setAppeals(prev => prev.filter(a => a.studentMatrix?.trim().toUpperCase() !== targetMatrix));
    }

    addToast({
      type: 'danger',
      title: 'Akaun & Rekod Kes Dipadam',
      message: `Akaun ${s.name} (${s.matrixNo}) dan semua rekod kes berkaitan telah dipadam.`
    });
  };

  const handleCreateStaff = (staffData) => {
    if (users.find(u => u.email.toLowerCase() === staffData.email.toLowerCase())) {
      return { success: false, message: 'Emel ini telah didaftarkan!' };
    }
    const newStaff = {
      id: `staff-${Date.now()}`,
      role: 'lecturer',
      status: 'approved',
      gender: staffData.gender || 'Lelaki',
      avatar: staffData.avatar || DEFAULT_AVATAR,
      ...staffData,
    };
    setUsers(prev => [...prev, newStaff]);
    addToast({
      type: 'success',
      title: 'Akaun Staf Dicipta',
      message: `Akaun ${newStaff.name} (${newStaff.staffType === 'lecturer' ? 'Pensyarah' : 'Staf'}) berjaya didaftarkan.`
    });
    return { success: true };
  };

  const handleDeleteStaff = (staffId) => {
    const s = users.find(u => u.id === staffId);
    setUsers(prev => prev.filter(u => u.id !== staffId));
    addToast({ type: 'danger', title: 'Akaun Staf Dipadam', message: `Akaun ${s?.name || ''} telah dipadam.` });
  };

  const handleUpdateStaff = (updatedStaff) => {
    setUsers(prev => prev.map(u => u.id === updatedStaff.id ? updatedStaff : u));
    addToast({ type: 'success', title: 'Kemas Kini Akaun Staf', message: `Maklumat ${updatedStaff.name} berjaya disimpan.` });
  };

  const handleUpdateUserProfile = (updatedUser) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addToast({ type: 'success', title: 'Profil Dikemas Kini', message: 'Maklumat profil anda telah berjaya disimpan.' });
  };

  const handleUpdateStudentProfile = (updatedStudent) => {
    const oldMatrix = currentUser?.matrixNo?.trim().toUpperCase();
    const newMatrix = updatedStudent.matrixNo?.trim().toUpperCase();

    setCurrentUser(updatedStudent);
    setUsers(prev => prev.map(u => u.id === updatedStudent.id ? updatedStudent : u));

    if (oldMatrix && newMatrix && oldMatrix !== newMatrix) {
      setCases(prev => prev.map(c => c.studentMatrix?.trim().toUpperCase() === oldMatrix ? {
        ...c,
        studentMatrix: newMatrix,
        studentName: updatedStudent.name,
        courseCode: updatedStudent.courseCode,
      } : c));
      setAppeals(prev => prev.map(a => a.studentMatrix?.trim().toUpperCase() === oldMatrix ? {
        ...a,
        studentMatrix: newMatrix,
        studentName: updatedStudent.name,
      } : a));
    }

    addToast({ type: 'success', title: 'Profil Pelajar Dikemas Kini', message: 'Maklumat profil anda telah berjaya disimpan.' });
  };

  const studentUsers = users.filter(u => u.role === 'student');
  const pendingStaffCount = users.filter(u => u.role === 'lecturer' && u.status === 'pending').length;
  const pendingAppealsCount = appeals.filter(a => a.status === 'Pending').length;

  const handleAdminTabChange = (tab) => {
    setAdminActiveTab(tab);
  };

  // Halaman depan: Portal Disiplin & Buku Peraturan Digital KKTS (sebelum login)
  const scrollPortalSection = (sectionId) => {
    const iframeEl = document.getElementById('kkts-portal-iframe');
    const iframeWin = iframeEl?.contentWindow;
    const iframeDoc = iframeEl?.contentDocument || iframeWin?.document;
    if (!iframeDoc || !iframeWin) return;
    if (sectionId === 'hero') {
      iframeWin.scrollTo({ top: 0, behavior: 'smooth' });
      if (typeof iframeWin.replayHeroIntroAnimation === 'function') {
        iframeWin.replayHeroIntroAnimation();
      }
    } else {
      const target = iframeDoc.getElementById(sectionId);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!currentUser && showPortal) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.65rem 1.5rem',
            background: theme === 'light' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(11, 19, 43, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            zIndex: 50,
          }}
        >
          {/* Kiri: Logo KK Tawau + Disiplin KK Tawau + Portal Digital + Kolej Komuniti Tawau, Sabah • Akta 174 */}
          <div
            onClick={() => scrollPortalSection('hero')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', minWidth: 0 }}
          >
            <img src="/kk_tawau_logo_transparent.png?v=2" alt="Logo KK Tawau" style={{ height: 38, objectFit: 'contain' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Disiplin KK Tawau
                </strong>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '9999px',
                    background: 'rgba(6, 182, 212, 0.16)',
                    color: '#0891b2',
                    border: '1px solid rgba(6, 182, 212, 0.45)',
                  }}
                >
                  PORTAL DIGITAL
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '1px' }}>
                Kolej Komuniti Tawau, Sabah • Akta 174
              </div>
            </div>
          </div>

          {/* Tengah (Gambar 2): Pautan Navigasi */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: theme === 'light' ? 'rgba(241, 245, 249, 0.95)' : 'rgba(15, 23, 42, 0.75)',
              padding: '0.35rem 0.5rem',
              borderRadius: '9999px',
              border: theme === 'light' ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(51, 65, 85, 0.65)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Utama', id: 'hero' },
              { label: 'Matriks Denda', id: 'ringkasan' },
              { label: 'Kod Rupa Diri', id: 'etika' },
              { label: 'Carta Akta 174', id: 'prosiding' },
              { label: 'E-Buku Teks', id: 'ebook' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollPortalSection(item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme === 'light' ? '#334155' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '0.4rem 0.9rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'light' ? '#e2e8f0' : '#1e293b';
                  e.currentTarget.style.color = theme === 'light' ? '#0f172a' : '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme === 'light' ? '#334155' : '#cbd5e1';
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Kanan: Buku Peraturan + Butang Tukar Warna (Bulan / Matahari) + Login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => scrollPortalSection('ringkasan')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(6, 182, 212, 0.25)',
              }}
            >
              <span>📖</span>
              <span>Buku Peraturan</span>
            </button>

            {/* Butang Tukar Warna (Bulan / Matahari) macam di page login */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}
              style={{
                width: '38px',
                height: '38px',
                padding: 0,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={theme === 'dark' ? 'Tukar ke Mod Terang' : 'Tukar ke Mod Gelap'}
            >
              {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#3b82f6" />}
            </button>

            <button className="btn btn-primary" onClick={() => setShowPortal(false)} style={{ fontWeight: 700, borderRadius: '12px', padding: '0.5rem 1.1rem' }}>
              🔐 Login
            </button>
          </div>
        </div>
        <iframe
          id="kkts-portal-iframe"
          src="/buku-peraturan-digital.html"
          title="Disiplin KK Tawau"
          onLoad={(e) => {
            try {
              e.target.contentWindow.postMessage({ type: 'SET_THEME', theme }, '*');
              if (typeof e.target.contentWindow.applyTheme === 'function') {
                e.target.contentWindow.applyTheme(theme);
              }
            } catch (err) {}
          }}
          style={{ flex: 1, width: '100%', border: 'none', background: 'var(--bg-primary)' }}
        />
      </div>
    );
  }

  // If user is NOT logged in, show standalone LoginPage (Gambar 1 style)
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onRegisterLecturer={handleRegisterLecturer}
          onOpenRules={() => setIsRulesOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}
        />
        <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} rules={rules} />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="app-shell">
      {/* ── Top Header Bar Junction (Fixed across top:0) ── */}
      <TopHeader
        currentUser={currentUser}
        currentRole={currentRole}
        onLogout={() => { setCurrentUser(null); addToast({ type: 'info', title: 'Log Keluar', message: 'Anda telah log keluar.' }); }}
        theme={theme}
        onToggleTheme={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenAdminProfile={() => setAdminActiveTab('admin-profile')}
        onToggleMobileSidebar={() => setMobileMenuOpen(prev => !prev)}
        mobileOpen={mobileMenuOpen}
      />

      <div className="app-body-junction">
        {/* ── Left Sidebar (Fixed top:64px) ── */}
        <Sidebar
          currentUser={currentUser}
          currentRole={currentRole}
          activeTab={adminActiveTab}
          onChangeTab={handleAdminTabChange}
          onSwitchRole={handleSwitchRole}
          pendingStaffCount={pendingStaffCount}
          pendingAppealsCount={pendingAppealsCount}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* ── Main Content Area ── */}
        <div className="app-main-junction">
          <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '1.5rem 1.5rem 3rem' }}>

            {currentRole === 'admin' && (
              <AdminDashboard
                currentUser={currentUser}
                users={users}
                cases={cases}
                appeals={appeals}
                activeTab={adminActiveTab}
                onChangeTab={handleAdminTabChange}
                onApproveStaff={handleApproveStaff}
                onRejectStaff={handleRejectStaff}
                onCreateStaff={handleCreateStaff}
                onDeleteStaff={handleDeleteStaff}
                onDeleteStudent={handleDeleteStudent}
                onOpenCreateStudent={() => setIsCreateStudentOpen(true)}
                onOpenReportCase={() => setIsReportCaseOpen(true)}
                onApproveAppeal={handleApproveAppeal}
                onRejectAppeal={handleRejectAppeal}
                onUpdateCaseStatus={handleUpdateCaseStatus}
                onUpdateUserProfile={handleUpdateUserProfile}
                onUpdateStudent={handleUpdateStudent}
                onUpdateStaff={handleUpdateStaff}
                onResetData={() => setIsResetConfirmOpen(true)}
              />
            )}

            {currentRole === 'lecturer' && (
              <LecturerDashboard
                currentUser={currentUser}
                cases={cases}
                students={studentUsers}
                activeTab={adminActiveTab}
                onChangeTab={handleAdminTabChange}
                onOpenReportCase={() => setIsReportCaseOpen(true)}
              />
            )}

            {currentRole === 'student' && (
              <StudentDashboard
                currentStudent={currentUser?.role === 'student' ? currentUser : studentUsers[0]}
                cases={cases}
                appeals={appeals}
                onOpenAppeal={() => setIsAppealOpen(true)}
                onOpenRules={() => setIsRulesOpen(true)}
                onUpdateProfile={handleUpdateStudentProfile}
              />
            )}
          </main>


          <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            © 2026 <strong>Disiplin kk Tawau</strong> — Sistem Pengurusan Disiplin Kolej (Akta 174 HEP)
          </footer>
        </div>
      </div>

      {/* ── Modals ── */}
      <RegisterStudentModal isOpen={isCreateStudentOpen} onClose={() => setIsCreateStudentOpen(false)} onRegisterStudent={handleRegisterStudent} />
      <ReportCaseModal isOpen={isReportCaseOpen} onClose={() => setIsReportCaseOpen(false)} students={studentUsers} currentUser={currentUser} onSubmitCase={handleSubmitCase} />
      <AppealModal isOpen={isAppealOpen} onClose={() => setIsAppealOpen(false)} studentCases={cases.filter(c => c.studentMatrix === (currentUser?.matrixNo || studentUsers[0]?.matrixNo))} currentStudent={currentUser?.role === 'student' ? currentUser : studentUsers[0]} onSubmitAppeal={handleSubmitAppeal} />
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} rules={rules} />

      {/* ── Reset Confirm ── */}
      {isResetConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsResetConfirmOpen(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Reset Semua Data?</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Semua rekod akan dikembalikan ke keadaan asal. Tindakan ini <strong>tidak boleh diundur</strong>.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsResetConfirmOpen(false)}>Batal</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleResetData}>Ya, Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
