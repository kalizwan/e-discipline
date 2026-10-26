import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UserPlus, CheckCircle2, XCircle, AlertTriangle, FileText, CheckCheck,
  BarChart3, GraduationCap, UserCheck, Plus, Search, Eye, EyeOff,
  Printer, RefreshCw, TrendingUp, Calendar, Users, User, UserCog,
  Camera, Save, CreditCard, Clock, Building2, MapPin, Upload, X, Edit3,
  Trash2, Briefcase
} from 'lucide-react';
import { COURSE_CODES, DEFAULT_AVATAR } from '../data/mockData';
import { compressImageFile } from '../imageUtils';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const MONTHS_SHORT = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogos','Sep','Okt','Nov','Dis'];
const MONTHS_FULL  = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
}

function CourseBadge({ code }) {
  return (
    <span className={`badge course-badge-${code}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
      {code}
    </span>
  );
}

// Helper: Get student's case count by matrix number
function getStudentCaseCount(cases, studentMatrix) {
  return cases.filter(c => c.studentMatrix === studentMatrix).length;
}

// Helper: Get offense number for a specific case (e.g. Kes #1, Kes #2)
function getCaseOccurrenceNumber(cases, targetCase) {
  const studentCases = cases
    .filter(c => c.studentMatrix === targetCase.studentMatrix)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const idx = studentCases.findIndex(c => c.id === targetCase.id);
  return idx >= 0 ? idx + 1 : 1;
}

function ChartTooltip({ tooltip, students = [] }) {
  if (!tooltip) return null;
  const { x, y, label, cases = [] } = tooltip;

  const winW = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const tooltipW = 280;
  
  // Smart Positioning: automatically flip/move to the left side of cursor if near right edge
  let leftPos = (x || 0) + 14;
  if (leftPos + tooltipW > winW - 20) {
    leftPos = Math.max(10, (x || 0) - tooltipW - 14);
  }

  let topPos = Math.max(10, (y || 0) - 10);
  if (topPos + 260 > winH - 20) {
    topPos = Math.max(10, winH - 280);
  }

  const tooltipElement = (
    <div
      className="chart-tooltip"
      style={{
        position: 'fixed',
        left: `${leftPos}px`,
        top: `${topPos}px`,
        pointerEvents: 'none',
        zIndex: 999999,
        width: '280px',
        maxHeight: '60vh',
        overflowY: 'auto',
        background: 'var(--bg-secondary)',
        border: '1.5px solid var(--primary)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem',
        boxShadow: '0 14px 35px rgba(0,0,0,0.7)',
        transition: 'left 0.05s ease, top 0.05s ease',
      }}
    >
      <div className="chart-tooltip-header" style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
        <span>📅 {label}</span>
        <span className="badge badge-info" style={{ fontSize: '0.72rem', fontWeight: 800 }}>{cases.length} kes</span>
      </div>
      {cases.length === 0 ? (
        <div className="chart-tooltip-empty" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.4rem 0' }}>
          Tiada rekod kes dilaporkan
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {cases.map((c, i) => {
            const stu = (students || []).find(s => s.matrixNo === c.studentMatrix);
            const code = c.courseCode || stu?.courseCode || '—';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', padding: '0.35rem 0', borderBottom: i < cases.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                    <CourseBadge code={code} />
                    <span style={{ fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.studentName}
                    </span>
                  </div>
                  <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                    {c.id}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>{c.category}</span>
                  <span>{fmtDate(c.date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(tooltipElement, document.body) : tooltipElement;
}

// ─────────────────────────────────────────────────────────────
// Monthly Bar Chart
// ─────────────────────────────────────────────────────────────
function MonthlyBarChart({ cases, students, selectedYear }) {
  const [tooltip, setTooltip] = useState(null);

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthCases = cases.filter(c => {
      const d = new Date(c.date);
      const caseYear = c.fineYear || c.year || d.getFullYear();
      return caseYear === selectedYear && d.getMonth() === i;
    });
    return { month: i, cases: monthCases, count: monthCases.length };
  });

  const maxCount = Math.max(...monthlyData.map(d => d.count), 1);
  const SVG_H = 180;
  const barW = 28;
  const gap  = 12;
  const totalW = 12 * (barW + gap);

  const updateTooltip = (e, data) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      label: `${MONTHS_FULL[data.month]} ${selectedYear}`,
      cases: data.cases,
    });
  };

  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setTooltip(null)}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', paddingBottom: '0.5rem' }}>
        <svg
          width="100%"
          minWidth="480px"
          viewBox={`0 0 ${totalW} ${SVG_H + 30}`}
          style={{ overflow: 'visible', minWidth: '480px' }}
        >
          {[0.25, 0.5, 0.75, 1].map((frac, i) => (
            <line
              key={i}
              x1={0} y1={SVG_H - frac * SVG_H}
              x2={totalW} y2={SVG_H - frac * SVG_H}
              stroke="var(--border-color)"
              strokeDasharray="4 4"
              strokeWidth={1}
              style={{ opacity: 0.7 }}
            />
          ))}

          {monthlyData.map((d, i) => {
            const barH = Math.max((d.count / maxCount) * SVG_H, d.count > 0 ? 4 : 0);
            const x = i * (barW + gap);
            const y = SVG_H - barH;

            const courseGroups = {};
            d.cases.forEach(c => { courseGroups[c.courseCode] = (courseGroups[c.courseCode]||0)+1; });
            const dominantCourse = Object.entries(courseGroups).sort((a,b)=>b[1]-a[1])[0]?.[0];
            const barColor = dominantCourse ? COURSE_CODES[dominantCourse]?.color : 'var(--primary)';

            return (
              <g
                key={i}
                onMouseEnter={(e) => updateTooltip(e, d)}
                onMouseMove={(e) => updateTooltip(e, d)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x} y={y}
                  width={barW} height={barH || 2}
                  fill={barH > 0 ? barColor : 'var(--border-color)'}
                  rx={4}
                  style={{ opacity: 0.9, transition: 'opacity 0.15s' }}
                />
                <rect
                  x={x} y={0}
                  width={barW} height={SVG_H}
                  fill="transparent"
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                />
                {d.count > 0 && (
                  <text
                    x={x + barW/2} y={y - 4}
                    textAnchor="middle"
                    fill="var(--text-main)"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {d.count}
                  </text>
                )}
                <text
                  x={x + barW/2} y={SVG_H + 16}
                  textAnchor="middle"
                  fill="var(--text-main)"
                  fontSize="10"
                  fontWeight="600"
                  style={{ opacity: 0.85 }}
                >
                  {MONTHS_SHORT[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <ChartTooltip tooltip={tooltip} students={students} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dynamic Yearly Range Generator
// ─────────────────────────────────────────────────────────────
function getDynamicYearlyRange() {
  const currentYear = new Date().getFullYear();
  if (currentYear <= 2026) {
    return [2026, 2027];
  }
  if (currentYear === 2027) {
    return [2026, 2027, 2028];
  }
  // Untuk tahun 2028 dan seterusnya: sistem bertukar automatik
  // cth 2028: [2027, 2028, 2029]
  // cth 2029: [2028, 2029, 2030]
  return [currentYear - 1, currentYear, currentYear + 1];
}

// ─────────────────────────────────────────────────────────────
// Yearly Bar Chart
// ─────────────────────────────────────────────────────────────
function YearlyBarChart({ cases = [], students = [], selectedYear }) {
  const [tooltip, setTooltip] = useState(null);

  const years = getDynamicYearlyRange();

  const yearlyData = years.map(yr => {
    const yrCases = (cases || []).filter(c => {
      const d = new Date(c.date);
      const caseYear = c.fineYear || c.year || d.getFullYear();
      return caseYear === yr;
    });
    return { year: yr, cases: yrCases, count: yrCases.length };
  });

  const maxCount = Math.max(...yearlyData.map(d => d.count), 1);
  const SVG_H = 140;
  const barW  = 70;
  const gap   = 40;
  const totalW = Math.max(360, years.length * (barW + gap) + gap);
  const startOffset = Math.max(25, (totalW - (years.length * barW + (years.length - 1) * gap)) / 2);

  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setTooltip(null)}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', paddingBottom: '0.5rem' }}>
        <svg
          width="100%"
          viewBox={`0 0 ${totalW} ${SVG_H + 30}`}
          style={{ overflow: 'visible', minWidth: '360px' }}
        >
          {[0.25, 0.5, 0.75, 1].map((frac, i) => (
            <line
              key={i}
              x1={0} y1={SVG_H - frac * SVG_H}
              x2={totalW} y2={SVG_H - frac * SVG_H}
              stroke="var(--border-color)"
              strokeDasharray="4 4"
              strokeWidth={1}
              style={{ opacity: 0.7 }}
            />
          ))}

          {yearlyData.map((d, i) => {
            const barH = Math.max((d.count / maxCount) * SVG_H, d.count > 0 ? 4 : 0);
            const x = startOffset + i * (barW + gap);
            const y = SVG_H - barH;
            const isSelected = d.year === selectedYear;

            const courseGroups = {};
            d.cases.forEach(c => { courseGroups[c.courseCode] = (courseGroups[c.courseCode] || 0) + 1; });
            const dominantCourse = Object.entries(courseGroups).sort((a,b) => b[1] - a[1])[0]?.[0];
            const dominantColor = dominantCourse ? COURSE_CODES[dominantCourse]?.color : 'var(--primary)';
            const barColor = d.count > 0 ? (isSelected ? dominantColor : 'rgba(37,99,235,0.75)') : 'var(--border-color)';
            const updateTooltip = (e) => {
              setTooltip({ x: e.clientX, y: e.clientY, label: `Tahun ${d.year}`, cases: d.cases });
            };

            return (
              <g
                key={i}
                style={{ cursor: 'pointer' }}
                onMouseEnter={updateTooltip}
                onMouseMove={updateTooltip}
              >
                <rect
                  x={x} y={y}
                  width={barW} height={barH || 2}
                  fill={barColor}
                  rx={6}
                  style={{ transition: 'all 0.2s', opacity: d.count > 0 ? 0.95 : 0.4 }}
                />
                <rect
                  x={x} y={0}
                  width={barW} height={SVG_H}
                  fill="transparent"
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                />
                {d.count > 0 && (
                  <text x={x+barW/2} y={y-6} textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="700">
                    {d.count}
                  </text>
                )}
                <text x={x+barW/2} y={SVG_H+16} textAnchor="middle" fill={isSelected ? 'var(--primary)' : 'var(--text-main)'} fontSize="12" fontWeight={isSelected ? '800' : '600'} style={{ opacity: isSelected ? 1 : 0.85 }}>
                  {d.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ChartTooltip tooltip={tooltip} students={students} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal Popup: Senarai Kes Pelajar (Bila tekan lencana X KES)
// ─────────────────────────────────────────────────────────────
function StudentCasesDetailModal({ studentMatrix, students, cases, onClose }) {
  const [viewingEvidence, setViewingEvidence] = useState(null);
  if (!studentMatrix) return null;
  const student = students.find(s => s.matrixNo === studentMatrix) || { name: 'Pelajar', matrixNo: studentMatrix };
  const studentCases = cases.filter(c => c.studentMatrix === studentMatrix);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content glass-panel" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle color="var(--danger)" size={20} /> Senarai Rekod Kes kesalahan Pelajar
              </h3>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.3rem' }}>
                {student.name} (<span style={{ color: 'var(--primary)' }}>{student.matrixNo}</span>)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {student.course || student.courseCode || ''} · {student.semester || ''}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose} aria-label="Tutup">
              <X size={16} />
            </button>
          </div>

          {studentCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--success)' }}>
              <CheckCheck size={36} style={{ marginBottom: '0.5rem' }} />
              <p>Tiada rekod kes kesalahan. Rekod bersih!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.3rem' }}>
              {studentCases.map((c, i) => (
                <div key={c.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-warning" style={{ fontWeight: 800 }}>Kes #{i + 1}</span>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{c.id}</strong>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.category}</span>
                    </div>
                    <span className={`badge ${c.status === 'Selesai' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{c.description}</p>

                  {/* 📸 Lampiran Gambar Bukti Kes jika ada di-upload oleh admin / staf */}
                  {c.evidenceImage ? (
                    <div style={{
                      margin: '0.65rem 0',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(37, 99, 235, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                        <div
                          onClick={() => setViewingEvidence(c)}
                          style={{
                            position: 'relative',
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid var(--primary)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                            background: '#0b132b',
                          }}
                          title="Klik untuk buka gambar bukti kes"
                        >
                          <img
                            src={c.evidenceImage}
                            alt="Bukti kes"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Camera size={14} color="var(--primary)" />
                            <span>Gambar Bukti Kesalahan</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {c.evidence && c.evidence !== 'Tiada lampiran khas.' ? c.evidence : 'Klik untuk periksa bukti visual'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => setViewingEvidence(c)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, padding: '0.35rem 0.75rem' }}
                      >
                        <Eye size={13} /> Buka Gambar Bukti
                      </button>
                    </div>
                  ) : (
                    c.evidence && c.evidence !== 'Tiada lampiran khas.' && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.4rem 0', fontStyle: 'italic' }}>
                        📝 Catatan Bukti: {c.evidence}
                      </div>
                    )
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>⚠️ Denda: {c.denda || 'Perlu jumpa Pensyarah Disiplin di Bilik'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>📅 {fmtDate(c.date)} {c.incidentTime ? `• 🕒 ${c.incidentTime}` : ''} · Pelapor: {c.reportedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
          </div>
        </div>
      </div>

      {/* Lightbox / Modal Buka Gambar Bukti Kes */}
      {viewingEvidence && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 10000, background: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(8px)' }}
          onClick={() => setViewingEvidence(null)}
        >
          <div 
            className="modal-content glass-panel" 
            style={{ maxWidth: '720px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.25rem', border: '1px solid var(--primary)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <Camera color="var(--primary)" size={20} /> Gambar Bukti Kesalahan Disiplin
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <strong style={{ color: 'var(--primary)' }}>{viewingEvidence.id}</strong> — {viewingEvidence.category}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Pelajar: <strong>{student.name} ({student.matrixNo})</strong> · {student.course} ({student.semester})
                </div>
              </div>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setViewingEvidence(null)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            {/* Gambar Bukti Penuh */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: '#090d16', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden', 
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              minHeight: '260px',
              maxHeight: '55vh'
            }}>
              <img 
                src={viewingEvidence.evidenceImage} 
                alt="Gambar Bukti Kesalahan"
                style={{ maxWidth: '100%', maxHeight: '52vh', objectFit: 'contain', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              />
            </div>

            {/* Info Butiran Bukti & Actions */}
            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem' }}>
              <div>
                <div>📅 Tarikh: <strong>{fmtDate(viewingEvidence.date)}</strong> {viewingEvidence.incidentTime ? `• 🕒 ${viewingEvidence.incidentTime}` : ''} · Pelapor: <strong>{viewingEvidence.reportedBy}</strong></div>
                {viewingEvidence.evidence && viewingEvidence.evidence !== 'Tiada lampiran khas.' && (
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                    📝 Catatan Tambahan: <em>{viewingEvidence.evidence}</em>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setViewingEvidence(null)}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Course Breakdown Card — Jantina & Denda
// ─────────────────────────────────────────────────────────────
function CourseCard({ code, cases, students, onSelectStudentMatrix }) {
  const info = COURSE_CODES[code] || { color: '#888', fullName: code };
  const courseCases = cases.filter(c => c.courseCode === code);
  const courseStudents = students.filter(s => s.courseCode === code);

  const genderCount = { Lelaki: 0, Perempuan: 0 };
  const offenderMatrices = [...new Set(courseCases.map(c => c.studentMatrix))];
  offenderMatrices.forEach(matrix => {
    const stu = students.find(s => s.matrixNo === matrix);
    if (!stu) return;
    const nameLower = stu.name.toLowerCase();
    if (nameLower.includes('binti') || nameLower.includes('nurul') || nameLower.includes('siti') || nameLower.includes('ain') || nameLower.includes('noor') || nameLower.includes('nur')) {
      genderCount.Perempuan++;
    } else {
      genderCount.Lelaki++;
    }
  });
  const dominantGender = genderCount.Lelaki >= genderCount.Perempuan ? 'Lelaki' : 'Perempuan';
  const dominantGenderCount = dominantGender === 'Lelaki' ? genderCount.Lelaki : genderCount.Perempuan;

  let dendaText = 'Amaran Lisan';
  if (courseCases.length >= 5) dendaText = 'Perlu Jumpa Pensyarah Disiplin di Bilik';
  else if (courseCases.length >= 3) dendaText = 'Surat Amaran Kedua';
  else if (courseCases.length > 0) dendaText = 'Surat Amaran Pertama';

  const violatorMap = {};
  courseCases.forEach(c => {
    if (!violatorMap[c.studentMatrix]) violatorMap[c.studentMatrix] = { matrix: c.studentMatrix, name: c.studentName, count: 0 };
    violatorMap[c.studentMatrix].count++;
  });
  const topViolators = Object.values(violatorMap).sort((a,b) => b.count - a.count).slice(0, 3);

  const offenderCount = offenderMatrices.length;
  const pctOffenders = courseStudents.length > 0 ? Math.round((offenderCount / courseStudents.length) * 100) : 0;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${info.color}30`,
      overflow: 'hidden',
      borderTop: `3px solid ${info.color}`,
    }}>
      <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: info.color }}>{code}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{info.fullName}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
            👥 {courseStudents.length} Pelajar ({pctOffenders}% rekod kes)
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{courseCases.length}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kes kesalahan</div>
        </div>
      </div>

      <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ flex: 1, padding: '0.65rem 1rem', textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: dominantGender === 'Lelaki' ? 'var(--primary)' : '#ec4899' }}>
            {dominantGender === 'Lelaki' ? '👨' : '👩'} {dominantGenderCount}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Jantina Paling Ramai Kes</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            L:{genderCount.Lelaki} / P:{genderCount.Perempuan}
          </div>
        </div>
        <div style={{ flex: 1, padding: '0.65rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)' }}>{dendaText}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>Denda Dikenakan</div>
        </div>
      </div>

      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Paling Banyak Kes
        </div>
        {topViolators.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Tiada rekod</div>
        ) : (
          topViolators.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: i < topViolators.length-1 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: i === 0 ? info.color : 'var(--bg-primary)', color: i === 0 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                  {i+1}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{v.name.split(' ').slice(0,2).join(' ')}</span>
              </div>
              <span
                className="badge badge-warning"
                style={{ fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                onClick={() => onSelectStudentMatrix(v.matrix)}
                title="Klik untuk lihat senarai kes"
              >
                {v.count} Kes
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Print Warning Letter
// ─────────────────────────────────────────────────────────────
function PrintWarningLetter({ caseItem, student, onClose }) {
  const letterRef = useRef(null);

  const handlePrint = () => {
    if (!letterRef.current) {
      window.print();
      return;
    }

    const printContent = letterRef.current.innerHTML;
    let iframe = document.getElementById('surat-amaran-print-frame');
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = 'surat-amaran-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ms">
      <head>
        <meta charset="UTF-8" />
        <title>Surat Amaran Disiplin - ${caseItem?.id || ''}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 18mm 18mm 18mm 18mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.8;
          }
          .print-sheet {
            width: 100%;
            max-width: 680px;
            margin: 0 auto;
            padding: 8px 4px;
            background: #ffffff;
            color: #000000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            border: 1px solid #000000;
          }
          tr {
            border-bottom: 1px solid #000000;
          }
          td {
            padding: 0.45rem 0.75rem;
            vertical-align: top;
            border-bottom: 1px solid #000000;
          }
          td:first-child {
            font-weight: bold;
            width: 35%;
            background-color: #f5f5f5 !important;
            border-right: 1px solid #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="print-sheet">
          ${printContent}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  return (
    <div className="modal-overlay print-modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel print-modal-content" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="section-title"><Printer size={18} /> Pratonton Surat Amaran</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}><Printer size={14} /> Cetak / PDF</button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Tutup</button>
          </div>
        </div>
        <div ref={letterRef} className="print-area" style={{ background:'#fff', color:'#000', padding:'2rem', borderRadius:'var(--radius-md)', border:'2px solid var(--border-color)', fontFamily:'Times New Roman,serif', fontSize:'0.9rem', lineHeight:'1.8' }}>
          <div style={{ textAlign:'center', borderBottom:'3px double #000', paddingBottom:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'1.4rem', fontWeight:'bold' }}>🎓 KOLEJ KOMUNITI TAWAU</div>
            <div style={{ fontSize:'0.85rem' }}>Jabatan Hal Ehwal Pelajar & Disiplin</div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
            <strong>Ruj: JUM/{caseItem?.id}/{new Date().getFullYear()}</strong>
            <strong>Tarikh: {new Date().toLocaleDateString('ms-MY',{day:'numeric',month:'long',year:'numeric'})}</strong>
          </div>
          <p style={{ margin: '0 0 1rem 0' }}><strong>Kepada,</strong><br/><strong>{student?.name || '—'}</strong><br/>No. Matrik: {caseItem?.studentMatrix} | Kursus: {student?.courseCode || '—'}<br/>{student?.course}, {student?.semester}</p>
          <div style={{ textAlign:'center', fontWeight:'bold', fontSize:'1.1rem', margin:'1rem 0', textDecoration:'underline' }}>SURAT AMARAN DISIPLIN</div>
          <table style={{ width:'100%', borderCollapse:'collapse', margin:'1rem 0', border:'1px solid #000' }}>
            <tbody>
              {[
                ['ID Kes', caseItem?.id],
                ['Kategori', caseItem?.category],
                ['Keterangan', caseItem?.description],
                ['Tahun Denda & Tarikh', `${caseItem?.fineYear || caseItem?.year || new Date().getFullYear()} (${caseItem?.date || '-'})`],
                ['Waktu / Jam Rekod', caseItem?.incidentTime || 'Ditetapkan Sistem'],
                ['Denda', caseItem?.denda || 'Jumpa Pensyarah Disiplin di Bilik'],
                ['Dilaporkan Oleh', caseItem?.reportedBy]
              ].map(([k,v],i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #000' }}>
                  <td style={{ padding:'0.4rem 0.75rem', fontWeight:'bold', width:'35%', background:'#f5f5f5' }}>{k}</td>
                  <td style={{ padding:'0.4rem 0.75rem' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: '1rem 0' }}>Anda <strong>dikehendaki hadir</strong> ke bilik Pensyarah Disiplin di Kolej Komuniti Tawau dalam tempoh <strong>3 hari bekerja</strong>. Anda mempunyai hak untuk membuat rayuan dalam tempoh <strong>7 hari bekerja</strong>.</p>
          <div style={{ marginTop:'3rem' }}>
            Yang benar,<br/>
            <div style={{ marginTop:'2.5rem', borderTop:'1px solid #000', paddingTop:'0.25rem', display:'inline-block', minWidth:'200px' }}>
              <strong>Pegawai Disiplin Kolej</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal Edit Akaun Pelajar
// ─────────────────────────────────────────────────────────────
function EditStudentModal({ student, isOpen, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const [name, setName] = useState('');
  const [matrixNo, setMatrixNo] = useState('');
  const [icNo, setIcNo] = useState('');
  const [password, setPassword] = useState('123456');
  const [gender, setGender] = useState('Lelaki');
  const [courseCode, setCourseCode] = useState('STM');
  const [semester, setSemester] = useState('Semester 1');
  const [status, setStatus] = useState('Baik');
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
      setPassword(student.password || '123456');
      setGender(student.gender || 'Lelaki');
      setCourseCode(student.courseCode || 'STM');
      setSemester(student.semester || 'Semester 1');
      setStatus(student.status || 'Baik');
      setIntakeYear(student.intakeYear || student.tahunMasuk || deriveYear(student.matrixNo));
      setSesi(student.sesi || 'Sesi I (Julai - Disember)');
      setPhone(student.phone || '014-5589123');
      setEmail(student.email || `${(student.matrixNo || 'pelajar').toLowerCase()}@kolej.edu.my`);
      setAvatar(student.avatar || DEFAULT_AVATAR);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImageFile(file, 320, 0.82).then(setAvatar).catch(() => {});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const courseFullName = COURSE_CODES[courseCode]?.fullName || student.course;
    onSave({
      ...student,
      name,
      matrixNo,
      icNo,
      password,
      gender,
      courseCode,
      course: courseFullName,
      semester,
      status,
      intakeYear,
      tahunMasuk: intakeYear,
      sesi,
      phone,
      email,
      avatar,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '3.5rem', background: 'rgba(11, 19, 43, 0.72)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '620px', width: '92%', marginBottom: '3rem', border: '1.5px solid var(--primary)', boxShadow: '0 20px 45px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 className="section-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={18} color="var(--primary)" /> Kemas Kini Akaun Pelajar
          </h3>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar photo preview & change */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={avatar}
                alt={name}
                style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm btn-icon"
                style={{ position: 'absolute', bottom: 0, right: 0, borderRadius: '50%', width: 34, height: 34, padding: 0 }}
                onClick={() => fileInputRef.current?.click()}
                title="Tukar Gambar Profil"
              >
                <Camera size={14} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Klik ikon kamera untuk muat naik gambar baharu</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Nama Penuh Pelajar:</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>No. Kad Matrik (KK Tawau):</label>
              <input type="text" className="form-input" value={matrixNo} onChange={e => setMatrixNo(e.target.value.toUpperCase())} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>No. Kad Pengenalan (IC):</label>
              <input type="text" className="form-input" placeholder="Contoh: 040218-12-5431" value={icNo} onChange={e => setIcNo(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Jantina:</label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="Lelaki">👨 Lelaki</option>
                <option value="Perempuan">👩 Perempuan</option>
              </select>
            </div>

            {/* Tahun Bila Masuk */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.3rem', display: 'block' }}>
                📅 Tahun Mula Masuk / Kemasukan:
              </label>
              <input
                type="number"
                min="2015"
                max="2035"
                className="form-input"
                placeholder="Cth: 2026"
                value={intakeYear}
                onChange={e => setIntakeYear(e.target.value)}
                required
              />
            </div>

            {/* Sesi Kemasukan */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>🎓 Sesi Kemasukan:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Cth: Sesi I (Julai - Disember) / Sesi II 2024 / Jun 2024"
                value={sesi}
                onChange={e => setSesi(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>📞 No. Telefon Pelajar:</label>
              <input type="text" className="form-input" placeholder="Cth: 014-5589123" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>✉️ Emel Pelajar:</label>
              <input type="email" className="form-input" placeholder="Cth: pelajar@kolej.edu.my" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Kata Laluan (Password):</label>
              <input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Program / Kursus:</label>
              <select className="form-select" value={courseCode} onChange={e => setCourseCode(e.target.value)}>
                {Object.entries(COURSE_CODES).map(([code, info]) => (
                  <option key={code} value={code}>{code} — {info.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Semester (Maksimum 4):</label>
              <select className="form-select" value={semester} onChange={e => setSemester(e.target.value)}>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Semester 3">Semester 3</option>
                <option value="Semester 4 (Latihan Industri)">Semester 4 (Latihan Industri)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Status Disiplin Pelajar:</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Baik">🟢 Baik (Rekod Bersih)</option>
                <option value="Amaran">🟡 Amaran (Denda Berjaga-jaga)</option>
                <option value="Tatatertib">🔴 Tatatertib (Tindakan Khas)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary"><Save size={15} /> Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal: Cipta Akaun Staf / Pensyarah (Admin Create Staff Modal)
// ─────────────────────────────────────────────────────────────
function CreateStaffModal({ isOpen, onClose, onCreateStaff }) {
  const [name, setName] = useState('');
  const [icNo, setIcNo] = useState('');
  const [gender, setGender] = useState('Lelaki');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('staf123');
  const [joinYear, setJoinYear] = useState('2026');
  const [serviceYears, setServiceYears] = useState('1 Tahun (2026 - Kini)');
  const [staffType, setStaffType] = useState('lecturer'); // 'lecturer' atau 'staff'
  const [teachingField, setTeachingField] = useState('SKE');
  const [duty, setDuty] = useState('Pegawai Hal Ehwal Pelajar & Disiplin');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleJoinYearChange = (yr) => {
    setJoinYear(yr);
    const yNum = parseInt(yr, 10);
    const curYear = new Date().getFullYear();
    if (!isNaN(yNum) && yNum > 1980) {
      const diff = Math.max(1, curYear - yNum + 1);
      setServiceYears(`${diff} Tahun (${yNum} - Kini)`);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFile(file, 320, 0.82).then(setAvatar).catch(() => {});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const department = staffType === 'lecturer'
      ? `Jabatan ${COURSE_CODES[teachingField]?.fullName || teachingField}`
      : duty;

    const res = onCreateStaff({
      name,
      icNo,
      gender,
      email,
      password,
      joinYear,
      tahunMasuk: joinYear,
      serviceYears,
      serviceDuration: serviceYears,
      staffType,
      teachingField: staffType === 'lecturer' ? teachingField : null,
      duty: staffType === 'staff' ? duty : `Pensyarah ${teachingField} (${COURSE_CODES[teachingField]?.fullName || ''})`,
      department,
      avatar,
    });

    if (res?.success) {
      setName('');
      setIcNo('');
      setGender('Lelaki');
      setEmail('');
      setPassword('staf123');
      setJoinYear('2026');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '560px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 className="section-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} color="var(--primary)" /> Cipta Akaun Staf / Pensyarah
          </h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={avatar}
                alt="Profil Staf"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
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
                title="Pilih foto profil dari album/peranti"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              📷 Klik ikon kamera untuk pilih gambar profil dari album
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            {/* Nama */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Nama Penuh Staf / Pensyarah:</label>
              <input type="text" className="form-input" placeholder="Cth: Ts. Mohd Syafiq Bin Abdullah" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            {/* Jantina */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Jantina:</label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="Lelaki">👨 Lelaki</option>
                <option value="Perempuan">👩 Perempuan</option>
              </select>
            </div>

            {/* Kad Pengenalan */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>No. Kad Pengenalan:</label>
              <input type="text" className="form-input" placeholder="Cth: 880512-12-5544" value={icNo} onChange={e => setIcNo(e.target.value)} required />
            </div>

            {/* Tahun Bila Masuk / Mula Berkhidmat */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                📅 Tahun Mula Berkhidmat / Masuk:
              </label>
              <input
                type="number"
                min="1990"
                max="2035"
                className="form-input"
                placeholder="Cth: 2026"
                value={joinYear}
                onChange={e => handleJoinYearChange(e.target.value)}
                required
              />
            </div>

            {/* Berapa tahun di KK Tawau */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Tempoh Berkhidmat di KK Tawau:</label>
              <input type="text" className="form-input" placeholder="Cth: 1 Tahun (2026 - Kini)" value={serviceYears} onChange={e => setServiceYears(e.target.value)} required />
            </div>

            {/* Emel */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Emel Log Masuk:</label>
              <input type="email" className="form-input" placeholder="Cth: syafiq@kolej.edu.my" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {/* Password */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Kata Laluan (Password):</label>
              <input type="text" className="form-input" placeholder="Kata laluan staf" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {/* Jenis Tugas */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block', color: 'var(--primary)' }}>
                Tugas Dalam Kolej Komuniti Tawau:
              </label>
              <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="staffType"
                    checked={staffType === 'lecturer'}
                    onChange={() => setStaffType('lecturer')}
                  />
                  👨‍🏫 Mengajar (Pensyarah Kursus)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="staffType"
                    checked={staffType === 'staff'}
                    onChange={() => setStaffType('staff')}
                  />
                  💼 Staf Biasa (Pentadbiran / Pengurusan)
                </label>
              </div>
            </div>

            {/* Jika Mengajar: Pilihan Bidang SAU, STM, SKE, SKU */}
            {staffType === 'lecturer' ? (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                  Bidang Mengajar:
                </label>
                <select className="form-select" value={teachingField} onChange={e => setTeachingField(e.target.value)}>
                  <option value="SAU">SAU — Sijil Kemahiran Automotif</option>
                  <option value="STM">STM — Sijil Teknologi Maklumat</option>
                  <option value="SKE">SKE — Sijil Kemahiran Elektrik</option>
                  <option value="SKU">SKU — Sijil Kulinari</option>
                </select>
              </div>
            ) : (
              /* Jika Staf Biasa: Taip Tugas */
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                  Tugas / Jawatan Dalam Kolej Komuniti Tawau:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cth: Pegawai Hal Ehwal Pelajar / Pembantu Tadbir / Juruteknik"
                  value={duty}
                  onChange={e => setDuty(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary"><Save size={15} /> Daftar & Aktifkan Akaun Staf</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal Edit Akaun Staf / Pensyarah
// ─────────────────────────────────────────────────────────────
function EditStaffModal({ staff, isOpen, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const [name, setName] = useState('');
  const [icNo, setIcNo] = useState('');
  const [gender, setGender] = useState('Lelaki');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('staff123');
  const [joinYear, setJoinYear] = useState('2026');
  const [serviceYears, setServiceYears] = useState('');
  const [staffType, setStaffType] = useState('lecturer');
  const [teachingField, setTeachingField] = useState('SKE');
  const [duty, setDuty] = useState('');
  const [department, setDepartment] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setIcNo(staff.icNo || '');
      setGender(staff.gender || 'Lelaki');
      setEmail(staff.email || '');
      setPassword(staff.password || 'staff123');
      setJoinYear(staff.joinYear || staff.tahunMasuk || '2026');
      setServiceYears(staff.serviceYears || staff.serviceDuration || '1 Tahun (2026 - Kini)');
      const isLec = staff.teachingField ? true : (staff.duty?.toLowerCase().includes('pensyarah') || staff.department?.toLowerCase().includes('jabatan'));
      setStaffType(staff.staffType || (isLec ? 'lecturer' : 'staff'));
      setTeachingField(staff.teachingField || 'SKE');
      setDuty(staff.duty || staff.department || 'Pegawai Kolej Komuniti Tawau');
      setDepartment(staff.department || '');
      setAvatar(staff.avatar || DEFAULT_AVATAR);
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

  const handleJoinYearChange = (yr) => {
    setJoinYear(yr);
    const yNum = parseInt(yr, 10);
    const curYear = new Date().getFullYear();
    if (!isNaN(yNum) && yNum > 1980) {
      const diff = Math.max(1, curYear - yNum + 1);
      setServiceYears(`${diff} Tahun (${yNum} - Kini)`);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFile(file, 320, 0.82).then(setAvatar).catch(() => {});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dept = staffType === 'lecturer'
      ? `Jabatan ${COURSE_CODES[teachingField]?.fullName || teachingField}`
      : (department || duty);

    onSave({
      ...staff,
      name,
      icNo,
      gender,
      email,
      password,
      joinYear,
      tahunMasuk: joinYear,
      serviceYears,
      serviceDuration: serviceYears,
      staffType,
      teachingField: staffType === 'lecturer' ? teachingField : null,
      duty: staffType === 'staff' ? duty : `Pensyarah ${teachingField} (${COURSE_CODES[teachingField]?.fullName || ''})`,
      department: dept,
      avatar,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '560px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 className="section-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={18} color="var(--primary)" /> Kemas Kini Akaun Staf / Pensyarah
          </h3>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={avatar}
                alt={name}
                style={{
                  width: 85,
                  height: 85,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                }}
                title="Tukar gambar profil"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Klik ikon kamera untuk muat naik gambar profil baharu
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Nama Penuh Staf / Pensyarah:</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Jantina:</label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="Lelaki">👨 Lelaki</option>
                <option value="Perempuan">👩 Perempuan</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>No. Kad Pengenalan:</label>
              <input type="text" className="form-input" value={icNo} onChange={e => setIcNo(e.target.value)} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                📅 Tahun Mula Berkhidmat / Masuk:
              </label>
              <input
                type="number"
                min="1990"
                max="2035"
                className="form-input"
                value={joinYear}
                onChange={e => handleJoinYearChange(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Tempoh Berkhidmat di KK Tawau:</label>
              <input type="text" className="form-input" value={serviceYears} onChange={e => setServiceYears(e.target.value)} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Emel Log Masuk:</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>Kata Laluan (Password):</label>
              <input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block', color: 'var(--primary)' }}>
                Tugas Dalam Kolej Komuniti Tawau:
              </label>
              <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="editStaffType"
                    checked={staffType === 'lecturer'}
                    onChange={() => setStaffType('lecturer')}
                  />
                  👨‍🏫 Mengajar (Pensyarah Kursus)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="editStaffType"
                    checked={staffType === 'staff'}
                    onChange={() => setStaffType('staff')}
                  />
                  💼 Staf Biasa (Pentadbiran / Pengurusan)
                </label>
              </div>
            </div>

            {staffType === 'lecturer' ? (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                  Bidang Mengajar:
                </label>
                <select className="form-select" value={teachingField} onChange={e => setTeachingField(e.target.value)}>
                  <option value="SAU">SAU — Sijil Kemahiran Automotif</option>
                  <option value="STM">STM — Sijil Teknologi Maklumat</option>
                  <option value="SKE">SKE — Sijil Kemahiran Elektrik</option>
                  <option value="SKU">SKU — Sijil Kulinari</option>
                </select>
              </div>
            ) : (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                  Tugas / Jawatan Dalam Kolej Komuniti Tawau:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={duty}
                  onChange={e => setDuty(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary"><Save size={15} /> Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal: Profil Lengkap Akaun Staf / Pensyarah (Admin View)
// ─────────────────────────────────────────────────────────────
function StaffProfileModal({ staff, cases = [], isOpen, onClose, onEditStaff, onDeleteStaff }) {
  if (!isOpen || !staff) return null;

  const reportedCases = cases.filter(c => c.reportedBy?.toLowerCase() === staff.name?.toLowerCase());
  const isLec = staff.teachingField || staff.staffType === 'lecturer' || staff.duty?.toLowerCase().includes('pensyarah');
  const courseInfo = staff.teachingField ? COURSE_CODES[staff.teachingField] : null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '640px', width: '94%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} color="var(--primary)" />
            <h3 className="section-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              Profil Akaun Staf & Pensyarah
            </h3>
          </div>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Profil Header Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.25rem'
        }}>
          <img
            src={staff.avatar || DEFAULT_AVATAR}
            alt={staff.name}
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--primary)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{staff.name}</h2>
              <span className="badge badge-success">🟢 Aktif</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                {isLec ? '👨‍🏫 Pensyarah Kursus' : '💼 Staf Pentadbiran'}
              </span>
              <span style={{
                background: staff.gender === 'Perempuan' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                color: staff.gender === 'Perempuan' ? '#f472b6' : '#60a5fa',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: '1px solid currentColor'
              }}>
                {staff.gender === 'Perempuan' ? '👩 Perempuan' : '👨 Lelaki'}
              </span>
              {courseInfo && (
                <span style={{ background: courseInfo.color, color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700 }}>
                  📚 {staff.teachingField} — {courseInfo.fullName}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Emel: <strong style={{ color: 'var(--text-main)' }}>{staff.email}</strong>
            </div>
          </div>
        </div>

        {/* Butiran Lengkap Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
              <CreditCard size={14} color="var(--primary)" /> No. Kad Pengenalan
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {staff.icNo || '—'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
              <Calendar size={14} color="var(--primary)" /> Tahun Mula Masuk
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {staff.joinYear || staff.tahunMasuk || '2026'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
              <Clock size={14} color="var(--warning)" /> Tempoh Berkhidmat
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {staff.serviceYears || staff.serviceDuration || '—'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
              <Briefcase size={14} color="var(--success)" /> Tugas / Jabatan di KK Tawau
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {staff.duty || staff.department || 'Pensyarah Kolej Komuniti Tawau'}
            </div>
          </div>
        </div>

        {/* Laporan Kes Yang Pernah Dibuat Oleh Staf Ini */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} color="var(--primary)" /> Rekod Kes Dilaporkan Oleh Staf Ini ({reportedCases.length})
          </h4>
          {reportedCases.length === 0 ? (
            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
              Tiada laporan kes disiplin yang didaftarkan di bawah nama staf ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {reportedCases.map(c => (
                <div key={c.id} style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <div>
                    <strong>[{c.id}]</strong> {c.studentName} ({c.studentMatrix}) — <span style={{ color: 'var(--primary)' }}>{c.category}</span>
                  </div>
                  <span className={`badge ${c.status === 'Selesai' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tindakan Butang: Edit & Padam */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Tutup
          </button>
          {onEditStaff && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onEditStaff(staff);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Edit3 size={15} /> Edit Akaun Staf
            </button>
          )}
          {onDeleteStaff && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                onClose();
                onDeleteStaff(staff);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Trash2 size={15} /> Padam Akaun
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Single Student Account Detailed Card & History
// ─────────────────────────────────────────────────────────────
function SingleStudentAccountView({ student, cases, appeals, onPrintCase, onUpdateStudent, onDeleteStudent }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(true);
  const studentCases = cases.filter(c => c.studentMatrix === student.matrixNo);
  const studentAppeals = appeals.filter(a => a.studentMatrix === student.matrixNo);
  const courseInfo = COURSE_CODES[student.courseCode];

  const deriveYear = (m) => {
    if (!m) return '2026';
    const match = m.match(/[A-Z]+(\d{2})F/i);
    return match ? `20${match[1]}` : '2026';
  };
  const intakeYearVal = student.intakeYear || student.tahunMasuk || deriveYear(student.matrixNo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
      {/* Modal Edit Pelajar */}
      <EditStudentModal
        student={student}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onUpdateStudent}
      />

      {/* Card Profil Utama (Boleh ditekan & diubah suai) */}
      <div
        className="glass-panel"
        onClick={() => setIsEditModalOpen(true)}
        style={{
          padding: '1.5rem',
          borderLeft: `5px solid ${courseInfo?.color || 'var(--primary)'}`,
          cursor: 'pointer',
          position: 'relative',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        title="Klik untuk mengemaskini maklumat akaun pelajar ini"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            ✏️ Klik kad profil ini atau butang Edit untuk ubah suai maklumat
          </div>

          {/* Butang Tindakan & Info Berdekatan Button Edit */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Lencana Tahun Masuk Muncul Tepat Berdekatan Button Edit */}
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
              📅 Tahun Masuk: {intakeYearVal}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullDetails(prev => !prev);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              title="Papar atau sembunyikan butiran penuh pelajar"
            >
              <Eye size={14} /> {showFullDetails ? 'Tutup Butiran' : 'Butiran Penuh'}
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, boxShadow: '0 2px 10px rgba(37,99,235,0.35)' }}
            >
              <Edit3 size={14} /> Edit Akaun Pelajar
            </button>

            {onDeleteStudent && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={(e) => { e.stopPropagation(); onDeleteStudent(student); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                title="Padam akaun pelajar ini"
              >
                <Trash2 size={14} /> Padam Pelajar
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <img
            src={student.avatar || DEFAULT_AVATAR}
            alt={student.name}
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              objectFit: 'cover',
              border: `3px solid ${courseInfo?.color || 'var(--primary)'}`,
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.3rem' }}>
              {student.name}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
              <span className="badge badge-info" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                🪪 NO. MATRIK: {student.matrixNo}
              </span>
              <span className="badge" style={{ fontSize: '0.78rem', fontWeight: 800, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                💳 NO. IC: {student.icNo || '—'}
              </span>
              <span style={{
                background: 'rgba(37, 99, 235, 0.18)',
                color: 'var(--primary)',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 800,
                border: '1px solid var(--primary)'
              }}>
                📅 TAHUN MASUK: {intakeYearVal}
              </span>
              <span style={{
                background: student.gender === 'Perempuan' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                color: student.gender === 'Perempuan' ? '#f472b6' : '#60a5fa',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid currentColor'
              }}>
                {student.gender === 'Perempuan' ? '👩 Perempuan' : '👨 Lelaki'}
              </span>
              <span style={{ background: courseInfo?.color || 'var(--accent)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                📚 {student.courseCode} — {courseInfo?.fullName || student.course}
              </span>
              <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}>
                {student.semester} (Kolej Komuniti Tawau)
              </span>
            </div>

            {/* BUTIRAN PENUH (FULL DETAILS) AKAUN PELAJAR */}
            {showFullDetails && (
              <div
                style={{
                  background: 'rgba(11, 19, 43, 0.55)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  marginBottom: '1rem',
                  marginTop: '0.5rem',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <FileText size={14} /> Full Details Akaun Pelajar
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>📅 Tahun Bila Masuk</div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                      {intakeYearVal}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>🎓 Sesi Kemasukan</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                      {student.sesi || 'Sesi I (Julai - Disember)'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>📞 No. Telefon Pelajar</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                      {student.phone || '014-5589123'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>✉️ Emel Pelajar</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', wordBreak: 'break-all' }}>
                      {student.email || `${(student.matrixNo || 'pelajar').toLowerCase()}@kolej.edu.my`}
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
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS DISIPLIN</div>
                <span className={`badge ${student.status === 'Baik' ? 'badge-success' : student.status === 'Amaran' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem', marginTop: '3px' }}>
                  {student.status}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>JUMLAH KES</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: studentCases.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {studentCases.length} Kes Kesalahan
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS AKAUN</div>
                <span className="badge badge-success" style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem', marginTop: '3px' }}>
                  🟢 AKAUN AKTIF
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Senarai Rekod Kes kesalahan Pelajar */}
      <div className="glass-panel section-panel">
        <div className="section-header">
          <h3 className="section-title">
            <AlertTriangle size={18} color="var(--danger)" /> Rekod Kes Kesalahan Pelajar ({studentCases.length})
          </h3>
        </div>

        {studentCases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--success)' }}>
            <CheckCheck size={36} style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Rekod Berkelakuan Baik & Bersih!</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Pelajar ini tidak mempunyai sebarang rekod kes kesalahan disiplin di Kolej Komuniti Tawau.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {studentCases.map((c, idx) => (
              <div
                key={c.id}
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `4px solid ${c.status === 'Selesai' ? 'var(--success)' : 'var(--warning)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-warning" style={{ fontWeight: 800 }}>Kes #{idx + 1}</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{c.id}</strong>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${c.status === 'Selesai' ? 'badge-success' : 'badge-warning'}`}>
                      {c.status}
                    </span>
                    <button className="btn btn-secondary btn-xs" onClick={() => onPrintCase(c)}>
                      <Printer size={12} /> Surat Amaran
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                  {c.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>⚠️ Denda Dikenakan:</span>
                    <div style={{ color: 'var(--warning)', fontWeight: 700, marginTop: '2px' }}>
                      {c.denda || 'Perlu jumpa Pensyarah Disiplin di Bilik'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>📅 Tarikh Kejadian:</span>
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>{fmtDate(c.date)}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>👨‍🏫 Dilaporkan Oleh:</span>
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>{c.reportedBy}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rekod Rayuan Pelajar (Jika ada) */}
      {studentAppeals.length > 0 && (
        <div className="glass-panel section-panel">
          <h3 className="section-title" style={{ marginBottom: '1rem' }}>
            <FileText size={18} color="var(--info)" /> Rekod Rayuan Pelajar ({studentAppeals.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {studentAppeals.map(app => (
              <div key={app.id} style={{ background: 'var(--bg-secondary)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="badge badge-info">{app.id}</span>
                  <span className={`badge ${app.status === 'Approved' ? 'badge-success' : app.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                    {app.status === 'Pending' ? 'Menunggu' : app.status === 'Approved' ? 'Diluluskan' : 'Ditolak'}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{app.reason}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page: Butiran Akaun Pelajar (Full Student Account Details Page)
// ─────────────────────────────────────────────────────────────
function StudentAccountDetailsPage({ students, cases, appeals, onPrintCase, onUpdateStudent, onDeleteStudent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [studentChartYear, setStudentChartYear] = useState(() => Math.max(2026, new Date().getFullYear()));

  const cleanQuery = searchQuery.trim().toLowerCase();

  const matchingStudents = cleanQuery
    ? students.filter(s =>
        s.name.toLowerCase().includes(cleanQuery) ||
        s.matrixNo.toLowerCase().includes(cleanQuery) ||
        (s.courseCode || '').toLowerCase().includes(cleanQuery) ||
        (s.course || '').toLowerCase().includes(cleanQuery)
      )
    : [];

  return (
    <div className="page-content">

      {/* Header Banner */}
      <div className="glass-panel page-header" style={{ background: 'linear-gradient(135deg, rgba(11,19,43,0.95), rgba(37,99,235,0.2))' }}>
        <div className="page-header-info">
          <span className="badge badge-info" style={{ marginBottom: '0.4rem' }}>🎓 Portal Pentadbiran</span>
          <h2 className="page-title">Butiran Akaun Pelajar</h2>
          <p className="page-subtitle">Paparan lengkap akaun pelajar, maklumat akademik, dan sejarah rekod disiplin Kolej Komuniti Tawau.</p>
        </div>
      </div>

      {/* Carian No. Matrik / Nama (Live Substring Search) */}
      <div className="glass-panel section-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block', fontWeight: 700 }}>
              🔍 Cari No. Matrik / Nama:
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="S01*****F*** / Nama"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontSize: '0.9rem', fontWeight: 600 }}
              />
            </div>
          </div>
          {searchQuery && (
            <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
              Kosongkan Carian
            </button>
          )}
        </div>
      </div>

      {/* JIKA ADA CARIAN & WUJUD HASIL BERKAITAN */}
      {cleanQuery && matchingStudents.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
            🎯 Dijumpai {matchingStudents.length} Akaun Pelajar berkaitan dengan carian <span style={{ color: 'var(--text-main)' }}>"{searchQuery}"</span>:
          </div>

          {matchingStudents.map(student => (
            <SingleStudentAccountView
              key={student.id}
              student={student}
              cases={cases}
              appeals={appeals}
              onPrintCase={onPrintCase}
              onUpdateStudent={onUpdateStudent}
              onDeleteStudent={onDeleteStudent}
            />
          ))}
        </div>
      )}

      {/* JIKA ADA CARIAN TAPI TIADA HASIL */}
      {cleanQuery && matchingStudents.length === 0 && (
        <div className="glass-panel section-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--danger)', marginBottom: '1.5rem' }}>
          <AlertTriangle size={42} style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.3rem' }}>Tiada Pelajar Dijumpai</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tiada akaun pelajar dijumpai yang mempunyai perkataan/huruf <strong style={{ color: 'var(--danger)' }}>"{searchQuery}"</strong>.
          </p>
        </div>
      )}

      {/* DASHBOARD RINGKASAN & CARTA KESALAHAN (DIPAPARKAN DENGAN SENTIASA DI BAHAGIAN BAWAH) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
        {/* Ranking Kesalahan Ikut Kursus */}
        <div>
          <h3 className="section-title" style={{ marginBottom: '1rem' }}>
            <Users size={18} color="var(--accent)" /> Dashboard Ringkasan & Ranking Kesalahan Kursus
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {Object.keys(COURSE_CODES).map(code => (
              <CourseCard
                key={code}
                code={code}
                cases={cases}
                students={students}
                onSelectStudentMatrix={m => setSearchQuery(m)}
              />
            ))}
          </div>
        </div>

        {/* Carta Kes Bulanan */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.6rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>📊 Carta Kes kesalahan Bulanan {studentChartYear}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {Object.entries(COURSE_CODES).map(([code, info]) => (
                  <span key={code} style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.72rem', fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: info.color, display: 'inline-block' }} />
                    {code}
                  </span>
                ))}
              </div>
              <select
                className="form-select"
                style={{ width: 'auto', fontSize: '0.82rem', padding: '0.25rem 0.6rem' }}
                value={studentChartYear}
                onChange={e => setStudentChartYear(Number(e.target.value))}
              >
                {(() => {
                  const cur = new Date().getFullYear();
                  const yrs = [];
                  for (let y = 2026; y <= Math.max(2026, cur); y++) {
                    yrs.push(y);
                  }
                  return yrs.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ));
                })()}
              </select>
            </div>
          </div>
          <MonthlyBarChart cases={cases} students={students} selectedYear={studentChartYear} />
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Akaun Admin — Profile Page
// ─────────────────────────────────────────────────────────────
function AdminProfileTab({ currentUser, onUpdateUserProfile }) {
  const fileInputRef = useRef(null);

  const [name, setName] = useState(currentUser?.name || '');
  const [icNo, setIcNo] = useState(currentUser?.icNo || '820315-12-5431');
  const [gender, setGender] = useState(currentUser?.gender || 'Lelaki');
  const [joinYear, setJoinYear] = useState(currentUser?.joinYear || currentUser?.tahunMasuk || '2021');
  const [serviceDuration, setServiceDuration] = useState(currentUser?.serviceDuration || '5 Tahun 4 Bulan (Sejak Mac 2021)');
  const [department, setDepartment] = useState(currentUser?.department || 'Jabatan Hal Ehwal Pelajar & Disiplin');
  const [email, setEmail] = useState(currentUser?.email || 'admin@kolej.edu.my');
  const [avatar, setAvatar] = useState(
    !currentUser?.avatar || currentUser.avatar.includes('images.unsplash.com')
      ? DEFAULT_AVATAR
      : currentUser.avatar
  );

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setIcNo(currentUser.icNo || '820315-12-5431');
      setGender(currentUser.gender || 'Lelaki');
      setJoinYear(currentUser.joinYear || currentUser.tahunMasuk || '2021');
      setServiceDuration(currentUser.serviceDuration || '5 Tahun 4 Bulan (Sejak Mac 2021)');
      setDepartment(currentUser.department || 'Jabatan Hal Ehwal Pelajar & Disiplin');
      setEmail(currentUser.email || 'admin@kolej.edu.my');
      setAvatar(
        !currentUser.avatar || currentUser.avatar.includes('images.unsplash.com')
          ? DEFAULT_AVATAR
          : currentUser.avatar
      );
    }
  }, [currentUser]);

  const handleJoinYearChange = (yr) => {
    setJoinYear(yr);
    const yNum = parseInt(yr, 10);
    const curYear = new Date().getFullYear();
    if (!isNaN(yNum) && yNum > 1980) {
      const diff = Math.max(1, curYear - yNum + 1);
      setServiceDuration(`${diff} Tahun (Sejak ${yNum})`);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImageFile(file, 320, 0.82).then(setAvatar).catch(() => {});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateUserProfile({
      ...currentUser,
      name,
      icNo,
      gender,
      joinYear,
      tahunMasuk: joinYear,
      serviceDuration,
      department,
      email,
      avatar,
    });
  };

  return (
    <div className="glass-panel section-panel">
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h3 className="section-title"><UserCog size={22} color="var(--primary)" /> Profil Akaun Admin / Pensyarah Disiplin</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          Semak dan kemas kini maklumat peribadi, kad pengenalan, gambar profil, dan tempoh perkhidmatan di Kolej Komuniti Tawau.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '2rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <img
                src={avatar}
                alt="Gambar Profil"
                style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 6px 18px var(--primary-glow)' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm btn-icon"
                style={{ position: 'absolute', bottom: '0', right: '0', borderRadius: '50%', width: 34, height: 34, padding: 0 }}
                onClick={() => fileInputRef.current?.click()}
                title="Pilih gambar dari album"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: '1rem', fontSize: '0.78rem' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Tukar Profil dari Album / Peranti
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{name || 'Nama Admin'}</h3>
            <span className="badge badge-info" style={{ marginBottom: '0.75rem' }}>🛡️ Pentadbir Disiplin</span>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={14} color="var(--primary)" />
                <span>Kolej Komuniti Tawau</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem' }}>{gender === 'Perempuan' ? '👩' : '👨'}</span>
                <span><strong>Jantina:</strong> {gender}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} color="var(--primary)" />
                <span><strong>Tahun Masuk:</strong> {joinYear || '2021'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} color="var(--warning)" />
                <span><strong>Tempoh:</strong> {serviceDuration || '5 Tahun'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={14} color="var(--success)" />
                <span><strong>IC:</strong> {icNo || '—'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label><User size={15} style={{ display: 'inline', marginRight: '6px' }} /> Nama Penuh Admin / Pensyarah *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label><CreditCard size={15} style={{ display: 'inline', marginRight: '6px' }} /> No. Kad Pengenalan (IC) *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 820315-12-5431"
                value={icNo}
                onChange={e => setIcNo(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Jantina</label>
              <select
                className="form-select"
                value={gender}
                onChange={e => setGender(e.target.value)}
              >
                <option value="Lelaki">👨 Lelaki</option>
                <option value="Perempuan">👩 Perempuan</option>
              </select>
            </div>

            <div className="form-group">
              <label><Calendar size={15} style={{ display: 'inline', marginRight: '6px' }} /> Tahun Mula Berkhidmat / Masuk *</label>
              <input
                type="number"
                min="1990"
                max="2035"
                className="form-input"
                placeholder="Contoh: 2021"
                value={joinYear}
                onChange={e => handleJoinYearChange(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label><Clock size={15} style={{ display: 'inline', marginRight: '6px' }} /> Jangka Masa Bertugas di Kolej Komuniti Tawau *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 5 Tahun 4 Bulan (Sejak Mac 2021)"
                value={serviceDuration}
                onChange={e => setServiceDuration(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label><Building2 size={15} style={{ display: 'inline', marginRight: '6px' }} /> Jabatan / Jawatan</label>
              <input
                type="text"
                className="form-input"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Emel Rasmi Admin</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ paddingTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                <Save size={16} /> Simpan Maklumat Profil Admin
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN AdminDashboard
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard({
  currentUser,
  users, cases, appeals,
  activeTab, onChangeTab,
  onApproveStaff, onRejectStaff,
  onCreateStaff, onDeleteStaff, onDeleteStudent,
  onOpenCreateStudent, onOpenReportCase,
  onApproveAppeal, onRejectAppeal,
  onUpdateCaseStatus, onUpdateUserProfile, onUpdateStudent, onUpdateStaff, onResetData,
}) {
  const [caseSearch, setCaseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [revealedPasswords, setRevealedPasswords] = useState(new Set());
  const [printCase, setPrintCase] = useState(null);
  const [chartYear, setChartYear] = useState(() => Math.max(2026, new Date().getFullYear()));
  const [chartView, setChartView] = useState('monthly');
  const [selectedStudentForCases, setSelectedStudentForCases] = useState(null);

  // Modals for Staff & Delete
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [selectedStaffProfile, setSelectedStaffProfile] = useState(null);
  const [staffToEdit, setStaffToEdit] = useState(null);

  const togglePasswordReveal = (id) => {
    setRevealedPasswords(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const pendingStaff   = users.filter(u => u.role === 'lecturer' && u.status === 'pending');
  const approvedStaff  = users.filter(u => u.role === 'lecturer' && u.status === 'approved');
  const students       = users.filter(u => u.role === 'student');
  const pendingAppeals = appeals.filter(a => a.status === 'Pending');

  // Filter: hanya kes dan rayuan bagi akaun pelajar yang wujud dalam sistem (Aktif)
  const activeStudentMatrixSet = new Set(students.map(s => s.matrixNo?.trim().toUpperCase()));
  const activeCases   = cases.filter(c => activeStudentMatrixSet.has(c.studentMatrix?.trim().toUpperCase()));
  const activeAppeals = appeals.filter(a => activeStudentMatrixSet.has(a.studentMatrix?.trim().toUpperCase()));

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.matrixNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.icNo && s.icNo.toLowerCase().includes(studentSearch.toLowerCase())) ||
    (s.courseCode || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredCases = activeCases.filter(c => {
    const ok = c.studentName.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.studentMatrix.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.id.toLowerCase().includes(caseSearch.toLowerCase()) ||
      (c.courseCode || '').toLowerCase().includes(caseSearch.toLowerCase());
    const st = statusFilter === 'Semua' || c.status === statusFilter;
    return ok && st;
  });

  // Ranking Pelajar Paling Banyak Kes: IKUT KEPUTUSAN AKAUN PELAJAR
  const offenderMap = {};
  students.forEach(s => {
    const sMatrix = s.matrixNo?.trim().toUpperCase();
    const studentCasesList = activeCases.filter(c => c.studentMatrix?.trim().toUpperCase() === sMatrix);
    if (studentCasesList.length > 0) {
      const sortedCases = [...studentCasesList].sort((a, b) => new Date(b.date) - new Date(a.date));
      const demerit = s.demeritPoints ?? studentCasesList.reduce((acc, c) => acc + (c.demeritPoints || 0), 0);
      const discStatus = s.status || (demerit >= 50 ? 'Tatatertib' : demerit >= 30 ? 'Amaran' : 'Baik');
      offenderMap[sMatrix] = {
        name: s.name,
        matrix: s.matrixNo,
        courseCode: s.courseCode,
        count: studentCasesList.length,
        latestDenda: sortedCases[0]?.denda || 'Perlu jumpa Pensyarah Disiplin di Bilik',
        status: discStatus
      };
    }
  });
  const topOffenders = Object.values(offenderMap).sort((a,b) => b.count - a.count);

  return (
    <div className="page-content">
      {printCase && <PrintWarningLetter caseItem={printCase} student={students.find(s => s.matrixNo === printCase.studentMatrix)} onClose={() => setPrintCase(null)} />}
      
      {/* Student Cases Detail Popup Modal */}
      {selectedStudentForCases && (
        <StudentCasesDetailModal
          studentMatrix={selectedStudentForCases}
          students={students}
          cases={activeCases}
          onClose={() => setSelectedStudentForCases(null)}
        />
      )}

      {/* ─── TAB: DASHBOARD ─── */}
      {activeTab === 'dashboard' && (
        <div className="page-content">

          {/* Welcome banner */}
          <div className="glass-panel page-header" style={{ background: 'linear-gradient(135deg, rgba(11,19,43,0.95), rgba(37,99,235,0.25))' }}>
            <div className="page-header-info">
              <span className="badge badge-info" style={{ marginBottom: '0.4rem' }}>🛡️ Admin Dashboard</span>
              <h2 className="page-title">Dashboard Analitik Disiplin</h2>
              <p className="page-subtitle">Ringkasan kes, trend bulanan/tahunan & statistik kursus secara real-time di Kolej Komuniti Tawau.</p>
            </div>
            <div className="page-header-actions">
              <button className="btn btn-primary btn-sm" onClick={onOpenReportCase}><Plus size={14} /> Lapor Kes</button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="stats-grid">
            {[
              { label: 'Jumlah Pelajar', value: students.length, icon: <GraduationCap size={20}/>, color: 'var(--primary)', bg: 'var(--primary-glow)', sub: 'Berdaftar aktif' },
              { label: 'Kes Kesalahan', value: activeCases.length, icon: <AlertTriangle size={20}/>, color: 'var(--danger)', bg: 'var(--danger-bg)', sub: `${activeCases.filter(c=>c.status==='Dalam Siasatan').length} dalam siasatan` },
              { label: 'Rayuan Pending', value: activeAppeals.filter(a => a.status === 'Pending').length, icon: <FileText size={20}/>, color: 'var(--info)', bg: 'var(--info-bg)', sub: 'Perlu tindakan' },
            ].map((k, i) => (
              <div key={i} className="glass-panel stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">{k.label}</span>
                  <div className="stat-card-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
                </div>
                <div className="stat-card-value" style={{ color: k.color }}>{k.value}</div>
                <span className="stat-card-sub">{k.sub}</span>
              </div>
            ))}
          </div>

          {/* ── Chart Section ── */}
          <div className="glass-panel section-panel">
            <div className="section-header">
              <h3 className="section-title"><TrendingUp size={18} color="var(--primary)" /> Trend Kes Disiplin</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }}>
                  <button className={`btn btn-xs ${chartView === 'monthly' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setChartView('monthly')}>
                    <Calendar size={12} /> Bulanan
                  </button>
                  <button className={`btn btn-xs ${chartView === 'yearly' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setChartView('yearly')}>
                    <BarChart3 size={12} /> Tahunan
                  </button>
                </div>
                {chartView === 'monthly' && (
                  <select
                    className="form-select"
                    style={{ width:'auto', fontSize:'0.82rem', padding:'0.35rem 0.75rem' }}
                    value={chartYear}
                    onChange={e => setChartYear(Number(e.target.value))}
                  >
                    {(() => {
                      const cur = new Date().getFullYear();
                      const yrs = [];
                      for (let y = 2026; y <= Math.max(2026, cur); y++) {
                        yrs.push(y);
                      }
                      return yrs.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ));
                    })()}
                  </select>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {Object.entries(COURSE_CODES).map(([code, info]) => (
                  <span key={code} style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.75rem', fontWeight: 600 }}>
                    <span style={{ width:10, height:10, borderRadius:2, background:info.color, display:'inline-block' }}/>
                    {code}
                  </span>
                ))}
              </div>
            </div>

            {chartView === 'monthly' ? (
              <MonthlyBarChart cases={activeCases} students={students} selectedYear={chartYear} />
            ) : (
              <YearlyBarChart cases={activeCases} students={students} selectedYear={chartYear} />
            )}
          </div>

          {/* ── Course Breakdown: SKE / STM / SAU / SKU ── */}
          <div>
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>
              <Users size={18} color="var(--accent)" /> Ranking Kesalahan Ikut Kursus
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {Object.keys(COURSE_CODES).map(code => (
                <CourseCard
                  key={code}
                  code={code}
                  cases={activeCases}
                  students={students}
                  onSelectStudentMatrix={m => setSelectedStudentForCases(m)}
                />
              ))}
            </div>
          </div>

          {/* ── Top Offenders Table ── */}
          <div className="glass-panel section-panel">
            <div className="section-header">
              <h3 className="section-title"><AlertTriangle size={18} color="var(--danger)" /> Pelajar Paling Banyak Kes (Semua Kursus)</h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama Pelajar</th>
                    <th>No. Matrik</th>
                    <th>Kursus</th>
                    <th>Bilangan Kes</th>
                    <th>Denda Dikenakan</th>
                    <th>Status Disiplin</th>
                  </tr>
                </thead>
                <tbody>
                  {topOffenders.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Tiada rekod kes.</td></tr>
                  ) : (
                    topOffenders.map((o, i) => {
                      return (
                        <tr key={o.matrix}>
                          <td style={{ fontWeight: 800, color: i === 0 ? 'var(--danger)' : i === 1 ? 'var(--warning)' : 'var(--text-muted)' }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i+1}
                          </td>
                          <td style={{ fontWeight: 600 }}>{o.name}</td>
                          <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{o.matrix}</td>
                          <td><CourseBadge code={o.courseCode || '—'} /></td>
                          <td>
                            <span
                              className="badge badge-warning"
                              style={{ fontWeight: 800, cursor: 'pointer' }}
                              onClick={() => setSelectedStudentForCases(o.matrix)}
                              title="Klik untuk lihat senarai kes"
                            >
                              {o.count} Kes
                            </span>
                          </td>
                          <td>
                            <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.8rem' }}>
                              {o.latestDenda}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${o.status === 'Baik' ? 'badge-success' : o.status === 'Amaran' ? 'badge-warning' : 'badge-danger'}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB: PENGESAHAN STAF ─── */}
      {activeTab === 'staff-requests' && (
        <div className="glass-panel section-panel">
          <div className="section-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck color="var(--primary)" size={20} /> Pengurusan & Pengesahan Staf
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Senarai permohonan staf, pengurusan akaun pensyarah dan staf Kolej Komuniti Tawau.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setIsCreateStaffOpen(true)}>
              <UserPlus size={15} /> + Cipta Akaun Staf / Pensyarah
            </button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              👨‍🏫 Senarai Pensyarah & Staf Berdaftar ({approvedStaff.length})
            </h4>
          </div>

          {approvedStaff.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Users size={36} color="var(--text-muted)" />
              <p>Tiada rekod staf atau pensyarah aktif.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {approvedStaff.map(s => (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '1.15rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img
                      src={s.avatar || DEFAULT_AVATAR}
                      alt={s.name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--primary)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                      {s.icNo && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                          🪪 {s.icNo}
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {s.gender === 'Perempuan' ? '👩 Perempuan' : '👨 Lelaki'}
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ flexShrink: 0, fontSize: '0.7rem' }}>Aktif</span>
                  </div>

                  <div style={{ background: 'var(--bg-primary)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '3px solid var(--accent)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Tugas / Bidang: </span>
                      <strong style={{ color: 'var(--text-main)' }}>{s.duty || s.department || 'Pensyarah'}</strong>
                    </div>
                    {(s.joinYear || s.tahunMasuk) && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Tahun Mula Masuk: </span>
                        <strong>{s.joinYear || s.tahunMasuk}</strong>
                      </div>
                    )}
                    {s.serviceYears && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Tempoh Berkhidmat: </span>
                        <strong>{s.serviceYears}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => setSelectedStaffProfile(s)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem' }}
                      title="Buka & semak profil lengkap staf ini"
                    >
                      <Eye size={12} /> Semak Profil
                    </button>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => setStaffToEdit(s)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem' }}
                        title="Edit maklumat akaun staf ini"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => setStaffToDelete(s)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem' }}
                        title="Padam akaun staf ini"
                      >
                        <Trash2 size={12} /> Padam
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: AKAUN PELAJAR ─── */}
      {activeTab === 'students' && (
        <div className="glass-panel section-panel">
          <div className="section-header">
            <div>
              <h3 className="section-title">🎓 Akaun Pelajar</h3>
              <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>Password disorok — klik 👁 untuk dedahkan. Klik lencana kes untuk lihat senarai kesalahan.</p>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <div className="search-wrapper">
                <Search size={14} className="search-icon"/>
                <input type="text" className="form-input search-input" placeholder="Cari nama / matrik / kursus..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)}/>
              </div>
              <button className="btn btn-primary" onClick={onOpenCreateStudent}><GraduationCap size={15}/> + Cipta</button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>No. Matrik</th><th>No. IC</th><th>Password</th><th>Nama</th><th>Jantina</th><th>Kursus</th><th>Sem</th><th>Bilangan Kes</th><th>Status</th><th style={{ textAlign: 'center' }}>Tindakan</th></tr></thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Tiada pelajar dijumpai.</td></tr>
                ) : filteredStudents.map(s => {
                  const count = getStudentCaseCount(cases, s.matrixNo);
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight:700, color:'var(--primary)' }}>{s.matrixNo}</td>
                      <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600 }}>{s.icNo || '—'}</td>
                      <td>
                        <div className="password-cell">
                          <span className={revealedPasswords.has(s.id) ? 'password-revealed' : 'password-masked'}>
                            {revealedPasswords.has(s.id) ? s.password : '•'.repeat(Math.min(s.password?.length||8,10))}
                          </span>
                          <button className="btn btn-ghost btn-xs" onClick={() => togglePasswordReveal(s.id)}>
                            {revealedPasswords.has(s.id) ? <EyeOff size={13}/> : <Eye size={13}/>}
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight:600 }}>{s.name}</td>
                      <td>
                        <span className="badge" style={{
                          fontSize: '0.75rem',
                          background: s.gender === 'Perempuan' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: s.gender === 'Perempuan' ? '#f472b6' : '#60a5fa'
                        }}>
                          {s.gender === 'Perempuan' ? '👩 P' : '👨 L'}
                        </span>
                      </td>
                      <td><CourseBadge code={s.courseCode || '—'}/></td>
                      <td style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{s.semester}</td>
                      <td>
                        {count > 0 ? (
                          <span
                            className="badge badge-warning"
                            style={{ fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => setSelectedStudentForCases(s.matrixNo)}
                            title="Klik untuk lihat senarai kes"
                          >
                            {count} Kes
                          </span>
                        ) : (
                          <span className="badge badge-success">Bersih (0 Kes)</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${s.status==='Baik'?'badge-success':s.status==='Amaran'?'badge-warning':'badge-danger'}`}>{s.status}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => setStudentToDelete(s)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem' }}
                          title="Padam akaun pelajar ini"
                        >
                          <Trash2 size={12} /> Padam
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: DATABASE KES ─── */}
      {activeTab === 'cases' && (
        <div className="glass-panel section-panel">
          <div className="section-header">
            <h3 className="section-title">⚠️ Database Rekod Kes</h3>
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <select className="form-select" style={{ width:'auto', fontSize:'0.82rem', padding:'0.35rem 0.75rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="Semua">Semua Status</option>
                <option value="Dalam Siasatan">Dalam Siasatan</option>
                <option value="Selesai">Selesai</option>
              </select>
              <div className="search-wrapper">
                <Search size={14} className="search-icon"/>
                <input type="text" className="form-input search-input" placeholder="Cari ID / Nama / Kursus..." value={caseSearch} onChange={e => setCaseSearch(e.target.value)}/>
              </div>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>ID Kes</th><th>Pelajar</th><th>Kursus</th><th>Kategori</th><th>Bilangan Kes</th><th>Denda Dikenakan</th><th>Tarikh</th><th>Status</th><th style={{ textAlign:'right' }}>Tindakan</th></tr></thead>
              <tbody>
                {filteredCases.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Tiada rekod.</td></tr>
                ) : filteredCases.map(c => {
                  const occNum = getCaseOccurrenceNumber(activeCases, c);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight:700, color:'var(--primary)', fontSize:'0.8rem' }}>{c.id}</td>
                      <td>
                        <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{c.studentName}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{c.studentMatrix}</div>
                      </td>
                      <td><CourseBadge code={c.courseCode || '—'}/></td>
                      <td style={{ fontSize:'0.8rem', maxWidth:140 }} title={c.category}>{c.category.length>28?c.category.slice(0,26)+'…':c.category}</td>
                      <td>
                        <span
                          className="badge badge-warning"
                          style={{ fontWeight: 800, cursor: 'pointer' }}
                          onClick={() => setSelectedStudentForCases(c.studentMatrix)}
                          title="Klik untuk lihat senarai kes"
                        >
                          Kes #{occNum}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600 }}>
                        {c.denda || 'Jumpa Pensyarah Disiplin di Bilik'}
                      </td>
                      <td style={{ fontSize:'0.8rem' }}>
                        <div>{fmtDate(c.date)}</div>
                        {c.incidentTime && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'1px' }}>🕒 {c.incidentTime}</div>}
                      </td>
                      <td>
                        <span className={`badge ${c.status==='Selesai'?'badge-success':c.status==='Dalam Siasatan'?'badge-warning':'badge-info'}`}>{c.status}</span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:'0.3rem', justifyContent:'flex-end' }}>
                          {c.status==='Dalam Siasatan'&&<button className="btn btn-success btn-xs" onClick={() => onUpdateCaseStatus(c.id,'Selesai')}><CheckCircle2 size={11}/> Selesai</button>}
                          <button className="btn btn-secondary btn-xs" onClick={() => setPrintCase(c)}><Printer size={11}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.75rem', flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{filteredCases.length}/{activeCases.length} rekod</span>
            <span className="badge badge-warning">{activeCases.filter(c=>c.status==='Dalam Siasatan').length} Siasatan</span>
            <span className="badge badge-success">{activeCases.filter(c=>c.status==='Selesai').length} Selesai</span>
          </div>
        </div>
      )}

      {/* ─── TAB: RAYUAN ─── */}
      {activeTab === 'appeals' && (
        <div className="glass-panel section-panel">
          <h3 className="section-title" style={{ marginBottom:'1.25rem' }}>📑 Permohonan Rayuan Tatatertib</h3>
          {activeAppeals.length === 0 ? (
            <div className="empty-state"><FileText size={36}/><p>Tiada rayuan dikemukakan.</p></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {activeAppeals.map(app => (
                <div key={app.id} style={{ background:'var(--bg-secondary)', padding:'1.25rem', borderRadius:'var(--radius-md)', border:'1px solid var(--border-color)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem', flexWrap:'wrap', gap:'0.5rem' }}>
                    <div><span className="badge badge-info" style={{ marginRight:'0.5rem' }}>{app.id}</span><strong>{app.studentName} ({app.studentMatrix})</strong></div>
                    <span className={`badge ${app.status==='Approved'?'badge-success':app.status==='Rejected'?'badge-danger':'badge-warning'}`}>
                      {app.status==='Pending'?'Menunggu':app.status==='Approved'?'Diluluskan':'Ditolak'}
                    </span>
                  </div>
                  <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}><strong>Kes:</strong> {app.offenseCategory} ({app.caseId})</p>
                  <div style={{ background:'var(--bg-primary)', padding:'0.75rem 1rem', borderRadius:'var(--radius-sm)', fontSize:'0.85rem', fontStyle:'italic', marginBottom:'1rem', borderLeft:'3px solid var(--primary)' }}>"{app.reason}"</div>
                  {app.status==='Pending'?(
                    <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                      <button className="btn btn-success btn-sm" onClick={() => onApproveAppeal(app.id)}><CheckCircle2 size={15}/> Lulus</button>
                      <button className="btn btn-danger btn-sm" onClick={() => onRejectAppeal(app.id)}><XCircle size={15}/> Tolak</button>
                    </div>
                  ):(
                    <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', textAlign:'right' }}>Keputusan muktamad telah dibuat.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: BUTIRAN AKAUN PELAJAR ─── */}
      {activeTab === 'analytics' && (
        <StudentAccountDetailsPage
          students={students}
          cases={activeCases}
          appeals={activeAppeals}
          onPrintCase={c => setPrintCase(c)}
          onUpdateStudent={onUpdateStudent}
          onDeleteStudent={s => setStudentToDelete(s)}
        />
      )}

      {/* ─── TAB: AKAUN ADMIN ─── */}
      {activeTab === 'admin-profile' && (
        <AdminProfileTab currentUser={currentUser} onUpdateUserProfile={onUpdateUserProfile} />
      )}

      {/* ─── MODAL: CIPTA AKAUN STAF / PENSYARAH ─── */}
      <CreateStaffModal
        isOpen={isCreateStaffOpen}
        onClose={() => setIsCreateStaffOpen(false)}
        onCreateStaff={onCreateStaff}
      />

      {/* ─── MODAL: PROFIL LENGKAP AKAUN STAF ─── */}
      <StaffProfileModal
        staff={selectedStaffProfile}
        cases={activeCases}
        isOpen={!!selectedStaffProfile}
        onClose={() => setSelectedStaffProfile(null)}
        onEditStaff={s => setStaffToEdit(s)}
        onDeleteStaff={s => setStaffToDelete(s)}
      />

      {/* ─── MODAL: EDIT AKAUN STAF ─── */}
      <EditStaffModal
        staff={staffToEdit}
        isOpen={!!staffToEdit}
        onClose={() => setStaffToEdit(null)}
        onSave={onUpdateStaff}
      />

      {/* ─── MODAL PENGESAHAN: PADAM AKAUN PELAJAR ─── */}
      {studentToDelete && (
        <div className="modal-overlay" onClick={() => setStudentToDelete(null)} style={{ zIndex: 10001 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '440px', textAlign: 'center', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>🗑️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--danger)' }}>
              Padam Akaun Pelajar?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Adakah anda pasti mahu memadam akaun pelajar <strong style={{ color: 'var(--text-main)' }}>{studentToDelete.name}</strong> ({studentToDelete.matrixNo})?<br/>
              Tindakan ini tidak boleh diundur dan akaun ini akan dikeluarkan daripada pangkalan data.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStudentToDelete(null)}>
                Batal
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={() => {
                  onDeleteStudent(studentToDelete.id);
                  setStudentToDelete(null);
                }}
              >
                Ya, Padam Akaun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL PENGESAHAN: PADAM AKAUN STAF ─── */}
      {staffToDelete && (
        <div className="modal-overlay" onClick={() => setStaffToDelete(null)} style={{ zIndex: 10001 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '440px', textAlign: 'center', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>🗑️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--danger)' }}>
              Padam Akaun Staf?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Adakah anda pasti mahu memadam akaun staf / pensyarah <strong style={{ color: 'var(--text-main)' }}>{staffToDelete.name}</strong>?<br/>
              Akaun staf ini tidak lagi dapat mengakses portal kolej komuniti tawau.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStaffToDelete(null)}>
                Batal
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={() => {
                  onDeleteStaff(staffToDelete.id);
                  setStaffToDelete(null);
                }}
              >
                Ya, Padam Akaun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
