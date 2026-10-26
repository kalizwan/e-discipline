import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap, AlertTriangle, Send, BookOpen, Shield,
  CheckCircle2, Edit3, Camera, Save, X, CreditCard, User, FileText
} from 'lucide-react';
import { COURSE_CODES, DEFAULT_AVATAR } from '../data/mockData';
import { compressImageFile } from '../imageUtils';

// ─────────────────────────────────────────────────────────────
// Modal: Pelajar Edit Profil Sendiri (Ikut Admin Baharu)
// ─────────────────────────────────────────────────────────────
function EditStudentProfileModal({ student, isOpen, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const [name, setName] = useState('');
  const [matrixNo, setMatrixNo] = useState('');
  const [icNo, setIcNo] = useState('');
  const [password, setPassword] = useState('pass123');
  const [gender, setGender] = useState('Lelaki');
  const [courseCode, setCourseCode] = useState('STM');
  const [semester, setSemester] = useState('Semester 1');
  const [intakeYear, setIntakeYear] = useState('2026');
  const [sesi, setSesi] = useState('Sesi I (Julai - Disember)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');

  const deriveYear = (m) => {
    if (!m) return '2026';
    const match = m.match(/[A-Z]+(\d{2})F/i);
    return match ? `20${match[1]}` : '2026';
  };

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setMatrixNo(student.matrixNo || '');
      setIcNo(student.icNo || '');
      setPassword(student.password || 'pass123');
      setGender(student.gender || 'Lelaki');
      setCourseCode(student.courseCode || 'STM');
      setSemester(student.semester || 'Semester 1');
      setIntakeYear(student.intakeYear || student.tahunMasuk || deriveYear(student.matrixNo));
      setSesi(student.sesi || 'Sesi I (Julai - Disember)');
      setPhone(student.phone || '014-5589123');
      setEmail(student.email || `${(student.matrixNo || 'pelajar').toLowerCase()}@kolej.edu.my`);
      setAvatar(student.avatar || DEFAULT_AVATAR);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFile(file, 320, 0.82).then(setAvatar).catch(() => {});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const courseFullName = student.course;
    onSave({
      ...student,
      name,
      matrixNo,
      icNo,
      // Medan berkunci: sentiasa kekalkan nilai asal pelajar (tidak boleh diubah sendiri)
      password: student.password,
      gender,
      courseCode: student.courseCode,
      course: courseFullName,
      semester: student.semester,
      intakeYear: student.intakeYear,
      tahunMasuk: student.tahunMasuk ?? student.intakeYear,
      sesi: student.sesi,
      phone,
      email,
      avatar,
    });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '3.5rem',
        background: 'rgba(11, 19, 43, 0.72)',
        backdropFilter: 'blur(6px)',
        overflowY: 'auto'
      }}
    >
      <div
        className="modal-content glass-panel"
        style={{
          maxWidth: '620px',
          width: '92%',
          marginBottom: '3rem',
          border: '1.5px solid var(--primary)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.6)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 className="section-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={18} color="var(--primary)" /> Kemas Kini Profil Pelajar
          </h3>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar Upload dari Album / Galeri */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={avatar}
                alt={name}
                style={{ width: 92, height: 92, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm btn-icon"
                style={{ position: 'absolute', bottom: 0, right: 0, borderRadius: '50%', width: 34, height: 34, padding: 0 }}
                onClick={() => fileInputRef.current?.click()}
                title="Pilih gambar dari album peranti"
              >
                <Camera size={14} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Klik butang kamera untuk tukar gambar daripada album
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Nama Penuh Pelajar *</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>No. Kad Matrik Pelajar *</label>
              <input type="text" className="form-input" value={matrixNo} onChange={e => setMatrixNo(e.target.value.toUpperCase())} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>No. Kad Pengenalan (IC) *</label>
              <input type="text" className="form-input" placeholder="Contoh: 040218-12-5431" value={icNo} onChange={e => setIcNo(e.target.value)} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Jantina *</label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="Lelaki">👨 Lelaki</option>
                <option value="Perempuan">👩 Perempuan</option>
              </select>
            </div>

            {/* Tahun Mula Masuk */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.3rem', display: 'block' }}>
                📅 Tahun Mula Masuk / Kemasukan 🔒
              </label>
              <input
                type="number"
                min="2015"
                max="2035"
                className="form-input"
                placeholder="Cth: 2026"
                value={intakeYear}
                disabled readOnly style={{ opacity: 0.75, cursor: 'not-allowed', background: 'var(--bg-secondary)' }}
                required
              />
            </div>

            {/* Sesi Kemasukan */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>🎓 Sesi Kemasukan 🔒</label>
              <input
                type="text"
                className="form-input"
                value={sesi}
                disabled
                readOnly
                style={{ opacity: 0.75, cursor: 'not-allowed', background: 'var(--bg-secondary)' }}
              />
            </div>

            {/* No. Telefon Pelajar */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>📞 No. Telefon Pelajar *</label>
              <input type="text" className="form-input" placeholder="Cth: 014-5589123" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            {/* Emel Pelajar */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>✉️ Emel Pelajar *</label>
              <input type="email" className="form-input" placeholder="Cth: pelajar@kolej.edu.my" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Kata Laluan (Password) 🔒</label>
              <input type="text" className="form-input" value={password} disabled readOnly style={{ opacity: 0.75, cursor: 'not-allowed', background: 'var(--bg-secondary)' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Program / Kursus 🔒</label>
              <input
                type="text"
                className="form-input"
                value={`${courseCode} — ${COURSE_CODES[courseCode]?.fullName || student.course || courseCode}`}
                disabled
                readOnly
                style={{ opacity: 0.75, cursor: 'not-allowed', background: 'var(--bg-secondary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Semester (Kolej Komuniti Tawau) 🔒</label>
              <input
                type="text"
                className="form-input"
                value={semester}
                disabled
                readOnly
                style={{ opacity: 0.75, cursor: 'not-allowed', background: 'var(--bg-secondary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Save size={15} /> Simpan Perubahan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN StudentDashboard
// ─────────────────────────────────────────────────────────────
export default function StudentDashboard({ currentStudent, cases, appeals, onOpenAppeal, onOpenRules, onUpdateProfile }) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  if (!currentStudent) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <GraduationCap size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h2>Sila Log Masuk Akaun Student</h2>
        <p style={{ color: 'var(--text-muted)' }}>Gunakan No. Matrik & Password yang dicipta oleh Admin untuk mengakses portal ini.</p>
      </div>
    );
  }

  // Filter personal records
  const myCases = cases.filter(c => c.studentMatrix === currentStudent.matrixNo);
  const myAppeals = appeals.filter(a => a.studentMatrix === currentStudent.matrixNo);
  const courseInfo = COURSE_CODES[currentStudent.courseCode] || { fullName: currentStudent.course, color: 'var(--primary)' };

  const deriveYear = (m) => {
    if (!m) return '2026';
    const match = m.match(/[A-Z]+(\d{2})F/i);
    return match ? `20${match[1]}` : '2026';
  };
  const studentIntakeYear = currentStudent.intakeYear || currentStudent.tahunMasuk || deriveYear(currentStudent.matrixNo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Modal Edit Profil Pelajar */}
      <EditStudentProfileModal
        student={currentStudent}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={(data) => {
          if (onUpdateProfile) onUpdateProfile(data);
        }}
      />

      {/* Student Digital ID Header Card */}
      <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(11,19,43,0.95), rgba(37,99,235,0.25))', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={currentStudent.avatar || DEFAULT_AVATAR}
                alt="Student Avatar"
                style={{ width: '80px', height: '80px', borderRadius: '20px', border: `2px solid ${courseInfo.color || 'var(--primary)'}`, objectFit: 'cover', boxShadow: '0 4px 14px var(--primary-glow)' }}
              />
              <button
                onClick={() => setIsEditProfileOpen(true)}
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                }}
                title="Tukar Gambar Profil Dari Album"
              >
                <Camera size={13} />
              </button>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{currentStudent.name}</h2>
                <span className={`badge ${currentStudent.status === 'Baik' ? 'badge-success' : currentStudent.status === 'Amaran' ? 'badge-warning' : 'badge-danger'}`}>
                  {currentStudent.status}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
                <span>No. Matrik: <strong style={{ color: 'var(--primary)' }}>{currentStudent.matrixNo}</strong></span>
                <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.76rem', fontWeight: 700 }}>
                  🪪 No. IC: {currentStudent.icNo || '—'}
                </span>
                <span
                  style={{
                    background: 'rgba(37, 99, 235, 0.18)',
                    color: 'var(--primary)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    border: '1px solid var(--primary)'
                  }}
                >
                  📅 TAHUN MASUK: {studentIntakeYear}
                </span>
                <span>Jantina: <strong style={{ color: 'var(--text-main)' }}>{currentStudent.gender || 'Lelaki'}</strong></span>
                <span className="badge" style={{ background: courseInfo.color || 'var(--primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                  📚 {currentStudent.courseCode || 'STM'} — {courseInfo.fullName || currentStudent.course}
                </span>
                <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                  {currentStudent.semester}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Lencana Tahun Masuk Muncul Berdekatan Butang Edit */}
            <span
              style={{
                background: 'rgba(37, 99, 235, 0.18)',
                color: 'var(--primary)',
                border: '1.5px solid var(--primary)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 8px rgba(37,99,235,0.2)'
              }}
            >
              📅 Tahun Masuk: {studentIntakeYear}
            </span>

            <button className="btn btn-primary" onClick={() => setIsEditProfileOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Edit3 size={15} /> Edit Profil Pelajar
            </button>
            <button className="btn btn-secondary" onClick={onOpenAppeal}>
              <Send size={15} /> + Hantar Rayuan
            </button>
            <button className="btn btn-secondary" onClick={onOpenRules}>
              <BookOpen size={15} /> Peraturan Kolej
            </button>
          </div>
        </div>

        {/* Kotak Butiran Lengkap (Full Details) Akaun Pelajar */}
        <div
          style={{
            background: 'rgba(11, 19, 43, 0.55)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem',
            marginTop: '0.5rem',
            width: '100%'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <FileText size={14} /> Full Details Akaun Pelajar
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>📅 Tahun Bila Masuk</div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                {studentIntakeYear}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>🎓 Sesi Kemasukan</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                {currentStudent.sesi || 'Sesi I (Julai - Disember)'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>📞 No. Telefon Pelajar</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                {currentStudent.phone || '014-5589123'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>✉️ Emel Pelajar</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', wordBreak: 'break-all' }}>
                {currentStudent.email || `${(currentStudent.matrixNo || 'pelajar').toLowerCase()}@kolej.edu.my`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>🏫 Pusat Pengajian</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                Kolej Komuniti Tawau
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Offense Count Score Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>

        <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card), rgba(220,38,38,0.1))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Jumlah Rekod Kesalahan Akaun Ini</span>
            <AlertTriangle size={24} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--danger)' }}>
            {myCases.length} <span style={{ fontSize: '1rem', fontWeight: 500 }}>Kes</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {myCases.length > 1 ? '⚠️ Amaran! Rekod lebih dari 1 kesalahan. Sila jumpa Pensyarah Disiplin di bilik.' : myCases.length === 1 ? '⚠️ Mempunyai 1 rekod kesalahan.' : 'Rekod bersih.'}
          </p>
        </div>

      </div>

      {/* Sejarah Rekod Kesalahan Pelajar Ini */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield color="var(--primary)" /> Sejarah Rekod Kesalahan Akaun Ini
        </h3>

        {myCases.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={40} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
            <p>Akaun anda bersih! Tiada rekod kesalahan disiplin yang didaftarkan.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>ID Kes</th>
                  <th style={{ padding: '0.75rem' }}>Kategori Kesalahan</th>
                  <th style={{ padding: '0.75rem' }}>Keterangan</th>
                  <th style={{ padding: '0.75rem' }}>Bilangan Kes</th>
                  <th style={{ padding: '0.75rem' }}>Denda Dikenakan</th>
                  <th style={{ padding: '0.75rem' }}>Pelapor</th>
                  <th style={{ padding: '0.75rem' }}>Tarikh</th>
                </tr>
              </thead>
              <tbody>
                {myCases.map((c, idx) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{c.id}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{c.category}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{c.description}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-warning" style={{ fontWeight: 800 }}>
                        Kes #{idx + 1}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>
                      {c.denda || 'Perlu jumpa Pensyarah Disiplin di Bilik'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{c.reportedBy}</td>
                    <td style={{ padding: '0.75rem' }}>{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sejarah Rayuan Pelajar */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Status Permohonan Rayuan Tatatertib Saya</h3>
          <button className="btn btn-primary btn-sm" onClick={onOpenAppeal}>
            + Hantar Rayuan Baharu
          </button>
        </div>

        {myAppeals.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Anda belum pernah menghantar sebarang permohonan rayuan.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myAppeals.map(app => (
              <div key={app.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>RayuanKes: {app.offenseCategory} (ID: {app.caseId})</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Alasan: "{app.reason}"</div>
                </div>

                <span className={`badge ${app.status === 'Approved' ? 'badge-success' : app.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                  {app.status === 'Pending' ? 'Sedang Diproses Admin' : app.status === 'Approved' ? 'Rayuan Diluluskan 🎉' : 'Rayuan Ditolak'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
