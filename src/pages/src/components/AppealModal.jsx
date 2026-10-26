import React, { useState } from 'react';
import { X, Send, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function AppealModal({ isOpen, onClose, studentCases, currentStudent, onSubmitAppeal }) {
  const [selectedCaseId, setSelectedCaseId] = useState(studentCases[0]?.id || '');
  const [reason, setReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedCaseId) {
      setErrorMsg('Tiada kes kesalahan dipilih untuk dirayu.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Sila berikan justifikasi atau alasan rayuan anda.');
      return;
    }

    const targetCase = studentCases.find(c => c.id === selectedCaseId);

    onSubmitAppeal({
      caseId: selectedCaseId,
      studentMatrix: currentStudent.matrixNo,
      studentName: currentStudent.name,
      offenseCategory: targetCase ? targetCase.category : 'General',
      reason,
      submissionDate: new Date().toISOString().split('T')[0]
    });

    setSuccessMsg('Rayuan Tatatertib anda berjaya dihantar ke Pentadbir Admin Kolej!');
    setTimeout(() => {
      setSuccessMsg('');
      setReason('');
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send color="var(--primary)" /> Hantar Rayuan Tatatertib
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kemukakan rayuan rasmi kepada Pegawai Disiplin Kolej</p>
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

        {studentCases.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            🎉 Tahniah! Anda tiada rekod kesalahan untuk dirayu.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            <div className="form-group">
              <label>Pilih Rekod Kesalahan Untuk Dirayu</label>
              <select className="form-select" value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
                {studentCases.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.id}] {c.category} - {c.date}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Alasan / Justifikasi Rayuan (Sebab kukuh & bukti penjelas) *</label>
              <textarea 
                className="form-textarea" 
                rows="4" 
                placeholder="Terangkan secara terperinci mengapa anda memohon pelepasan/pembatalan rekod kes ini..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Hantar Permohonan Rayuan
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
