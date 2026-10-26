import React, { useState, useRef, useEffect } from 'react';
import { compressImageFile } from '../imageUtils';
import { 
  X, AlertTriangle, CheckCircle2, Camera, Trash2, MapPin, 
  Search, Clock, Calendar, Lock, User, ChevronDown, Check 
} from 'lucide-react';
import { useToast } from './ToastContext';

// Denda berdasarkan tahap keseriusan
const DENDA_OPTIONS = {
  'Rendah': 'Amaran Lisan — Jumpa Pensyarah Disiplin di Bilik',
  'Sederhana': 'Surat Amaran Bertulis — Jumpa Pensyarah Disiplin di Bilik',
  'Tinggi': 'Surat Amaran Rasmi + Perjumpaan Wajib Pensyarah Disiplin di Bilik',
};

export default function ReportCaseModal({ isOpen, onClose, students = [], currentUser, onSubmitCase }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [selectedMatrix, setSelectedMatrix] = useState('');
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [category, setCategory] = useState('Etika Berpakaian & Kad Matrik');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Rendah');
  const [demeritPoints, setDemeritPoints] = useState(10);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceImage, setEvidenceImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Waktu & Tahun Sistem (Live Real-time & Auto-stamped oleh sistem)
  const [systemDateTime, setSystemDateTime] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      fullDate: now.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
      dateIso: now.toISOString().split('T')[0],
      timeString: now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    };
  });

  // Kemaskini jam & waktu setiap 1 saat secara automatik
  useEffect(() => {
    if (!isOpen) return;
    const tick = () => {
      const now = new Date();
      setSystemDateTime({
        year: now.getFullYear(),
        fullDate: now.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
        dateIso: now.toISOString().split('T')[0],
        timeString: now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedStudent = students.find(s => s.matrixNo === selectedMatrix) || students[0];

  // Inisialisasi pelajar semasa modal dibuka
  useEffect(() => {
    if (isOpen) {
      if (!selectedMatrix && students && students.length > 0) {
        setSelectedMatrix(students[0].matrixNo);
      }
      // Mulakan input carian sebagai kosong supaya placeholder kelabu "Nama ( Kad Matrik )" terpapar
      setStudentSearchInput('');
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter senarai pelajar mengikut apa yang ditaip (Nama atau No. Matrik atau Kursus)
  const filteredStudents = students.filter(s => {
    if (!studentSearchInput.trim()) return true;
    const q = studentSearchInput.toLowerCase().trim();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.matrixNo && s.matrixNo.toLowerCase().includes(q)) ||
      (s.courseCode && s.courseCode.toLowerCase().includes(q)) ||
      (s.course && s.course.toLowerCase().includes(q))
    );
  });

  const handleSelectStudent = (student) => {
    setSelectedMatrix(student.matrixNo);
    // Kosongkan semula input supaya placeholder kelabu kekal dan tidak tersekat
    setStudentSearchInput('');
    setIsDropdownOpen(false);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: 'warning', title: 'Fail Terlalu Besar', message: 'Sila pilih gambar kurang dari 5MB.' });
      return;
    }
    compressImageFile(file, 1280, 0.8).then(setEvidenceImage).catch(() => {});
  };

  const handleRemoveImage = () => {
    setEvidenceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    const firstStu = students[0];
    setSelectedMatrix(firstStu?.matrixNo || '');
    setStudentSearchInput('');
    setIsDropdownOpen(false);
    setCategory('Etika Berpakaian & Kad Matrik');
    setDescription('');
    setSeverity('Rendah');
    setDemeritPoints(10);
    setEvidenceNote('');
    setEvidenceImage(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const studentObj = students.find(s => s.matrixNo === selectedMatrix);
    if (!studentObj) {
      addToast({ type: 'warning', title: 'Pelajar Tidak Sah', message: 'Sila pilih pelajar yang sah daripada senarai nama atau no. matrik.' });
      return;
    }
    if (!description.trim()) {
      addToast({ type: 'warning', title: 'Keterangan Diperlukan', message: 'Sila isi keterangan kejadian.' });
      return;
    }

    setIsSubmitting(true);

    onSubmitCase({
      type: 'demerit',
      studentMatrix: selectedMatrix,
      studentName: studentObj.name,
      courseCode: studentObj.courseCode,
      category,
      description,
      severity,
      demeritPoints: Number(demeritPoints),
      meritPoints: 0,
      denda: DENDA_OPTIONS[severity],
      reportedBy: currentUser ? currentUser.name : 'Pensyarah Kolej',
      year: systemDateTime.year,
      fineYear: systemDateTime.year,
      date: systemDateTime.dateIso,
      fullDate: systemDateTime.fullDate,
      incidentTime: systemDateTime.timeString,
      timestamp: new Date().toISOString(),
      evidence: evidenceNote || 'Tiada lampiran khas.',
      evidenceImage: evidenceImage || null,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      resetForm();
      onClose();
    }, 600);
  };

  const dendaText = DENDA_OPTIONS[severity];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              <AlertTriangle color="var(--danger)" size={20} /> Laporan Kes Kesalahan Disiplin
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Status awal: <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Dalam Siasatan</span>
            </p>
          </div>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* 1. Pilih Pelajar (Cari mengikut Nama atau No. Kad Matrik) */}
          <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Pilih Pelajar (Taip Nama atau No. Matrik) *</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {filteredStudents.length} pelajar dijumpai
              </span>
            </label>

            {/* Input Carian Interaktif */}
            <div style={{ position: 'relative' }}>
              <style>{`
                .student-search-input::placeholder {
                  color: #94a3b8 !important;
                  opacity: 1 !important;
                  font-weight: 500;
                  transition: opacity 0.15s ease, color 0.15s ease;
                }
                .student-search-input:focus::placeholder {
                  color: transparent !important;
                  opacity: 0 !important;
                }
              `}</style>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="form-input student-search-input"
                placeholder="nama ( kad matrik )"
                value={studentSearchInput}
                onChange={(e) => {
                  setStudentSearchInput(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsDropdownOpen(true);
                }}
                style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem', fontWeight: 600 }}
              />
              {studentSearchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentSearchInput('');
                    setIsDropdownOpen(true);
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Kosongkan carian"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown Menu Mengandungi Senarai Nama & Kad Matrik */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 28px -5px rgba(0, 0, 0, 0.45)',
                  maxHeight: '230px',
                  overflowY: 'auto',
                  zIndex: 9999,
                }}
              >
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => {
                    const isSelected = s.matrixNo === selectedMatrix;
                    return (
                      <div
                        key={s.matrixNo}
                        onClick={() => handleSelectStudent(s)}
                        style={{
                          padding: '0.65rem 0.9rem',
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--primary-glow)' : 'transparent',
                          transition: 'background 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--sidebar-item-hover)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                              {s.name}
                            </strong>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                background: 'rgba(37, 99, 235, 0.15)',
                                color: 'var(--primary)',
                                border: '1px solid rgba(37, 99, 235, 0.3)',
                              }}
                            >
                              {s.matrixNo}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            📚 {s.course} ({s.courseCode || '—'}) · {s.semester}
                          </div>
                        </div>
                        {isSelected && <Check size={16} color="var(--primary)" style={{ flexShrink: 0 }} />}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Tiada pelajar sepadan dengan <em>"{studentSearchInput}"</em>. Sila taip nama atau no. matrik lain.
                  </div>
                )}
              </div>
            )}

            {/* Paparan Kad Pelajar Terpilih */}
            {selectedStudent && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    🎓 {selectedStudent.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '1px' }}>
                    <span>No. Matrik: <strong style={{ color: 'var(--primary)' }}>{selectedStudent.matrixNo}</strong></span>
                    <span>·</span>
                    <span>{selectedStudent.course}</span>
                    <span>·</span>
                    <span>{selectedStudent.semester}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => {
                    setStudentSearchInput('');
                    setIsDropdownOpen(true);
                  }}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                >
                  Tukar Pelajar
                </button>
              </div>
            )}
          </div>

          {/* 2. Kategori Kesalahan */}
          <div className="form-group">
            <label>Kategori Kesalahan</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="Etika Berpakaian & Kad Matrik">Etika Berpakaian & Kad Matrik</option>
              <option value="Kehadiran / Ketidakhadiran Kuliah">Kehadiran / Ketidakhadiran Kuliah</option>
              <option value="Merokok / Vape">Merokok / Vape / Pod</option>
              <option value="Vandalisme / Kerosakan Harta Kolej">Vandalisme / Kerosakan Harta Kolej</option>
              <option value="Peradaban & Tatatertib Kolej">Peradaban & Tatatertib Kolej</option>
              <option value="Kesalahan Akademik / Plagiat">Kesalahan Akademik / Plagiat</option>
              <option value="Gangguan & Buli">Gangguan & Buli</option>
              <option value="Penggunaan Telefon Tanpa Izin">Penggunaan Telefon Tanpa Izin</option>
            </select>
          </div>

          {/* 3. Tahap Keseriusan Kesalahan */}
          <div className="form-group">
            <label>Tahap Keseriusan Kesalahaan</label>
            <select className="form-select" value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="Rendah">Rendah (Amaran Lisan)</option>
              <option value="Sederhana">Sederhana (Surat Amaran)</option>
              <option value="Tinggi">Tinggi (Tindakan Rasmi)</option>
            </select>
          </div>

          {/* 4. Denda Info Box */}
          <div style={{
            background: 'rgba(217, 119, 6, 0.1)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderLeft: '3px solid var(--warning)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'flex-start',
          }}>
            <MapPin size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                Denda Yang Dikenakan
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 500 }}>
                {dendaText}
              </div>
            </div>
          </div>

          {/* 5. FUNGSI DI ATAS KETERANGAN: TAHUN DENDA & WAKTU KEJADIAN (DIJANA AUTOMATIK OLEH SISTEM) */}
          <div style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderLeft: '3px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>
                <Clock size={16} />
                <span>WAKTU & TAHUN REKOD DENDA (SISTEM)</span>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                <Lock size={11} /> Ditetapkan Automatik oleh Sistem
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} color="var(--primary)" /> Tahun Denda
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {systemDateTime.year}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tahun hukuman dikenakan</div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} color="#059669" /> Tarikh Rasmi
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {systemDateTime.fullDate}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tarikh rekod dikunci</div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} color="#f59e0b" /> Jam & Waktu Tepat
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px', fontFamily: 'monospace' }}>
                  {systemDateTime.timeString}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Waktu nyata sistem</div>
              </div>
            </div>
            
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              * Jam, waktu dan tahun denda dikunci automatik oleh sistem kolej. Admin dan staf tidak perlu memasukkannya secara manual.
            </p>
          </div>

          {/* 6. Description */}
          <div className="form-group">
            <label>Keterangan & Catatan Kejadian *</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Berikan perincian kejadian, tarikh, masa, atau ulasan tambahan..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          {/* 7. Evidence Note */}
          <div className="form-group">
            <label>Catatan Bukti (Opsional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Kenyataan saksi, rekod pengawas..."
              value={evidenceNote}
              onChange={e => setEvidenceNote(e.target.value)}
            />
          </div>

          {/* 8. Image Upload */}
          <div className="form-group">
            <label>📸 Upload Gambar Bukti (Opsional)</label>
            {!evidenceImage ? (
              <label
                className="file-upload-area"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <Camera size={28} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Klik untuk upload atau ambil gambar</span>
                  <span style={{ fontSize: '0.75rem' }}>JPG, PNG, WEBP — Maks 5MB</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={evidenceImage}
                  alt="Bukti gambar"
                  className="file-preview-img"
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
                  onClick={handleRemoveImage}
                >
                  <Trash2 size={14} /> Buang Gambar
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => { resetForm(); onClose(); }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menghantar...' : '📤 Hantar Laporan Kes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
