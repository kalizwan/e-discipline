import React, { useState } from 'react';
import { X, GraduationCap, Key, User, AlertCircle, CheckCircle2, CreditCard, Calendar } from 'lucide-react';

export default function RegisterStudentModal({ isOpen, onClose, onRegisterStudent }) {
  const [matrixNo, setMatrixNo] = useState('');
  const [icNo, setIcNo] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Lelaki');
  const [course, setCourse] = useState('Sijil Teknologi Maklumat');
  const [courseCode, setCourseCode] = useState('STM');
  const [semester, setSemester] = useState('Semester 1');
  const [intakeYear, setIntakeYear] = useState('2026');

  const handleCourseChange = (val) => {
    setCourse(val);
    if (val.includes('Elektrik')) setCourseCode('SKE');
    else if (val.includes('Teknologi Maklumat')) setCourseCode('STM');
    else if (val.includes('Automotif')) setCourseCode('SAU');
    else if (val.includes('Kulinari')) setCourseCode('SKU');
  };

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const successTimerRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (successTimerRef.current) clearTimeout(successTimerRef.current);

    if (!matrixNo || !password || !name) {
      setErrorMsg('Sila lengkapi semua maklumat wajib (No Matrik, Password, Nama).');
      return;
    }

    const res = onRegisterStudent({ matrixNo, icNo, password, name, gender, course, courseCode, semester, intakeYear });

    if (res.success) {
      setSuccessMsg(`Akaun Pelajar ${name} (No Matrik: ${matrixNo}) BERJAYA DICIPTA!`);
      setMatrixNo('');
      setIcNo('');
      setPassword('');
      setName('');
      setGender('Lelaki');
      setIntakeYear('2026');

      // Muncul sementara waktu: hilang automatik selepas 4 saat
      successTimerRef.current = setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap color="var(--primary)" /> Cipta Akaun Pelajar Baharu
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Format Matrik Kolej Komuniti Tawau: S01 + KURSUS + TAHUN + F + NO (cth: S01STM25F001)</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>No. Matrik Pelajar *</label>
              <div style={{ position: 'relative' }}>
                <GraduationCap size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="S01STM25F001"
                  style={{ paddingLeft: '2.2rem', fontWeight: 700 }}
                  value={matrixNo}
                  onChange={(e) => setMatrixNo(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Kata Laluan (Password) *</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="pass123"
                  style={{ paddingLeft: '2.2rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Nama Penuh Pelajar *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Muhammad Ali Bin Ahmad"
                  style={{ paddingLeft: '2.2rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>No. Kad Pengenalan (IC) *</label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="040218-12-5431"
                  style={{ paddingLeft: '2.2rem' }}
                  value={icNo}
                  onChange={(e) => setIcNo(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Jantina Pelajar *</label>
              <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="Lelaki">👨 Lelaki</option>
                <option value="Perempuan">👩 Perempuan</option>
              </select>
            </div>

            <div className="form-group">
              <label>Semester (Maksimum 4 Semester)</label>
              <select className="form-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
                {['Semester 1','Semester 2','Semester 3','Semester 4 (Latihan Industri)'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Program / Kursus</label>
              <select className="form-select" value={course} onChange={(e) => handleCourseChange(e.target.value)}>
                <option value="Sijil Teknologi Maklumat">STM — Sijil Teknologi Maklumat</option>
                <option value="Sijil Kemahiran Elektrik">SKE — Sijil Kemahiran Elektrik</option>
                <option value="Sijil Kemahiran Automotif">SAU — Sijil Kemahiran Automotif</option>
                <option value="Sijil Kulinari">SKU — Sijil Kulinari</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tahun Pelajar Masuk *</label>
              <div style={{ position: 'relative' }}>
                <select 
                  className="form-select" 
                  value={intakeYear} 
                  onChange={(e) => setIntakeYear(e.target.value)}
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Tutup
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Simpan & Cipta Akaun
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
