import React, { useState } from 'react';
import { X, UserCheck, Shield, GraduationCap, Lock, Mail, Building, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLogin, onRegisterLecturer }) {
  const [tab, setTab] = useState('student'); // 'student' | 'lecturer' | 'admin' | 'register-staff'
  
  // Form States
  const [matrixNo, setMatrixNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Jabatan Sains Komputer & Teknologi');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleStudentLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = onLogin({ role: 'student', matrixNo, password: studentPassword });
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      onClose();
    }
  };

  const handleStaffLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = onLogin({ role: 'lecturer', email: staffEmail, password: staffPassword });
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      onClose();
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = onLogin({ role: 'admin', email: adminEmail, password: adminPassword });
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      onClose();
    }
  };

  const handleStaffRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!regName || !regEmail || !regPassword) {
      setErrorMsg('Sila isi semua maklumat pendaftaran.');
      return;
    }

    const res = onRegisterLecturer({
      name: regName,
      email: regEmail,
      password: regPassword,
      department: regDepartment
    });

    if (res.success) {
      setSuccessMsg('Pendaftaran berjaya! Permohonan anda kini disimpan dengan status "Menunggu Pengesahan Admin".');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Log Masuk / Pendaftaran</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pilih jenis peranan akaun anda</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <button 
            className={`btn btn-sm ${tab === 'student' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none' }}
            onClick={() => { setTab('student'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <GraduationCap size={15} /> Student
          </button>

          <button 
            className={`btn btn-sm ${tab === 'lecturer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none' }}
            onClick={() => { setTab('lecturer'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <UserCheck size={15} /> Staf / Pensyarah
          </button>

          <button 
            className={`btn btn-sm ${tab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none' }}
            onClick={() => { setTab('admin'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <Shield size={15} /> Admin
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* TAB 1: STUDENT LOGIN */}
        {tab === 'student' && (
          <form onSubmit={handleStudentLogin}>
            <div className="form-group">
              <label>No. Matrik Pelajar</label>
              <div style={{ position: 'relative' }}>
                <GraduationCap size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: K20261001"
                  style={{ paddingLeft: '2.5rem' }}
                  value={matrixNo}
                  onChange={(e) => setMatrixNo(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                *No. Matrik dicipta khas oleh Admin Kolej
              </span>
            </div>

            <div className="form-group">
              <label>Kata Laluan (Password)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Masukkan Kata Laluan"
                  style={{ paddingLeft: '2.5rem' }}
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Log Masuk Sebagai Student
            </button>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>Demo Hint:</strong> Guna No Matrik: <code>K20261001</code> & Password: <code>pass123</code>
            </div>
          </form>
        )}

        {/* TAB 2: LECTURER LOGIN */}
        {tab === 'lecturer' && (
          <div>
            <form onSubmit={handleStaffLogin}>
              <div className="form-group">
                <label>Emel Pensyarah / Staf</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="Contoh: noraini@kolej.edu.my"
                    style={{ paddingLeft: '2.5rem' }}
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Kata Laluan</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Masukkan Kata Laluan"
                    style={{ paddingLeft: '2.5rem' }}
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Log Masuk Sebagai Pensyarah
              </button>
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.25rem 0' }} />

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Belum mendaftar sebagai Pensyarah / Staf?</p>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => { setTab('register-staff'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                Daftar Akaun Staf Baharu
              </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>Demo Hint:</strong> Guna Emel: <code>noraini@kolej.edu.my</code> & Password: <code>staff123</code>
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN LOGIN */}
        {tab === 'admin' && (
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label>Emel Pentadbir (Admin)</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="admin@kolej.edu.my"
                  style={{ paddingLeft: '2.5rem' }}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Kata Laluan Admin</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Kata Laluan Admin"
                  style={{ paddingLeft: '2.5rem' }}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '0.5rem' }}>
              Log Masuk Portal Admin
            </button>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>Demo Hint:</strong> Guna Emel: <code>admin@kolej.edu.my</code> & Password: <code>admin123</code>
            </div>
          </form>
        )}

        {/* TAB 4: REGISTER STAFF */}
        {tab === 'register-staff' && (
          <form onSubmit={handleStaffRegister}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Pendaftaran Akaun Staf / Pensyarah Baharu</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={14} /> Pendaftaran memerlukan Pengesahan dari Admin Kolej sebelum log masuk.
            </p>

            <div className="form-group">
              <label>Nama Penuh (Beserta Gelaran)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Dr. / En. / Pn. Nama Penuh"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Emel Rasmi Kolej</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="nama@kolej.edu.my"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Jabatan / Fakulti</label>
              <select className="form-select" value={regDepartment} onChange={(e) => setRegDepartment(e.target.value)}>
                <option value="Jabatan Sains Komputer & Teknologi">Jabatan Sains Komputer & Teknologi</option>
                <option value="Jabatan Kejuruteraan Elektrik">Jabatan Kejuruteraan Elektrik</option>
                <option value="Jabatan Perniagaan & Pengurusan">Jabatan Perniagaan & Pengurusan</option>
                <option value="Jabatan Hal Ehwal Pelajar">Jabatan Hal Ehwal Pelajar</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reka Kata Laluan Anda</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Minimum 6 aksara"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setTab('lecturer')}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Hantar Pendaftaran
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
