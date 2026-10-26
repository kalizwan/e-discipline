import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UserCheck, AlertTriangle, Plus, Search, FileText, CheckCircle2,
  History, Filter, Eye, Camera, X, LayoutDashboard, BarChart3,
  Users, TrendingUp, Calendar, GraduationCap, ArrowRight
} from 'lucide-react';
import { COURSE_CODES } from '../data/mockData';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
const MONTHS_FULL  = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

// ─────────────────────────────────────────────────────────────
// Chart Tooltip Component (Paparan Kes & Bilangan Pelajar Bila Mouse Pergi Carta)
// ─────────────────────────────────────────────────────────────
function ChartTooltip({ tooltip, students = [] }) {
  if (!tooltip) return null;
  const { x, y, label, cases = [] } = tooltip;

  const winW = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const tooltipW = 290;

  // Smart Positioning
  let leftPos = (x || 0) + 14;
  if (leftPos + tooltipW > winW - 20) {
    leftPos = Math.max(10, (x || 0) - tooltipW - 14);
  }

  let topPos = Math.max(10, (y || 0) - 10);
  if (topPos + 280 > winH - 20) {
    topPos = Math.max(10, winH - 300);
  }

  const offenderMatrices = [...new Set(cases.map(c => c.studentMatrix))];
  const uniqueStudentsCount = offenderMatrices.length;

  const tooltipElement = (
    <div
      className="chart-tooltip"
      style={{
        position: 'fixed',
        left: `${leftPos}px`,
        top: `${topPos}px`,
        pointerEvents: 'none',
        zIndex: 999999,
        width: `${tooltipW}px`,
        maxHeight: '65vh',
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
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <span className="badge badge-info" style={{ fontSize: '0.72rem', fontWeight: 800 }}>{cases.length} kes</span>
          <span className="badge badge-warning" style={{ fontSize: '0.72rem', fontWeight: 800 }}>👥 {uniqueStudentsCount} pelajar</span>
        </div>
      </div>
      {cases.length === 0 ? (
        <div className="chart-tooltip-empty" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.4rem 0' }}>
          Tiada rekod kes dilaporkan
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Bilangan Pelajar Terlibat: <strong style={{ color: 'var(--primary)' }}>{uniqueStudentsCount} orang</strong> ({cases.length} kes)
          </div>
          {cases.map((c, i) => {
            const stu = (students || []).find(s => s.matrixNo === c.studentMatrix);
            const code = c.courseCode || stu?.courseCode || '—';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', padding: '0.35rem 0', borderBottom: i < cases.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                    <span className={`badge course-badge-${code}`} style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem' }}>
                      {code}
                    </span>
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
                  <span>{c.studentMatrix}</span>
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
// Course Breakdown Card (Memaparkan Peratus & Jumlah Pelajar)
// ─────────────────────────────────────────────────────────────
function LecturerCourseCard({ code, cases, students, onSelectStudentMatrix }) {
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
      border: `1px solid ${info.color}35`,
      overflow: 'hidden',
      borderTop: `4px solid ${info.color}`,
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    }}>
      <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: info.color }}>{code}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>{info.fullName}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
            👥 {courseStudents.length} Pelajar ({pctOffenders}% ada rekod kes)
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
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Jantina Terbanyak Kes</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            L:{genderCount.Lelaki} / P:{genderCount.Perempuan}
          </div>
        </div>
        <div style={{ flex: 1, padding: '0.65rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)' }}>{dendaText}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>Denda Lazim</div>
        </div>
      </div>

      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Pelajar Paling Banyak Kes
        </div>
        {topViolators.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Tiada rekod kesalahan</div>
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
                title="Klik untuk semak rekod pelajar ini"
              >
                {v.count} Kes <ArrowRight size={10} style={{ marginLeft: 2 }} />
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Monthly Bar Chart Component for Lecturer (Dengan Tooltip Mouse Hover)
// ─────────────────────────────────────────────────────────────
function LecturerMonthlyBarChart({ cases = [], students = [], selectedYear }) {
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
// Main Lecturer Dashboard
// ─────────────────────────────────────────────────────────────
export default function LecturerDashboard({
  currentUser,
  cases = [],
  students = [],
  activeTab = 'lecturer-home',
  onChangeTab,
  onOpenReportCase
}) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [searchMatrix, setSearchMatrix] = useState('');
  const [viewingEvidence, setViewingEvidence] = useState(null);
  const [chartYear, setChartYear] = useState(() => Math.max(2026, new Date().getFullYear()));

  // Keep internal tab in sync with parent activeTab from Sidebar
  useEffect(() => {
    if (activeTab === 'lecturer-dashboard' || activeTab === 'lecturer-home') {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const switchTab = (tabId) => {
    setCurrentTab(tabId);
    if (onChangeTab) onChangeTab(tabId);
  };

  // Live filter: apabila pensyarah tekan 'h', semua berkaitan 'h' akan keluar (nama, matrik, kursus, IC)
  const cleanQuery = searchMatrix.trim().toLowerCase();
  const matchingStudents = cleanQuery
    ? students.filter(s =>
        s.name?.toLowerCase().includes(cleanQuery) ||
        s.matrixNo?.toLowerCase().includes(cleanQuery) ||
        (s.icNo && s.icNo.toLowerCase().includes(cleanQuery)) ||
        (s.courseCode && s.courseCode.toLowerCase().includes(cleanQuery)) ||
        (s.course && s.course.toLowerCase().includes(cleanQuery))
      )
    : [];

  // Cases reported by current lecturer
  const myReports = cases.filter(c => c.reportedBy === (currentUser ? currentUser.name : ''));

  // Calculate stats for Dashboard
  const offenderMatricesAll = new Set(cases.map(c => c.studentMatrix));
  const cleanStudentsCount = students.filter(s => !offenderMatricesAll.has(s.matrixNo)).length;
  const cleanPct = students.length > 0 ? Math.round((cleanStudentsCount / students.length) * 100) : 100;

  const handleSelectFromRanking = (matrix) => {
    setSearchMatrix(matrix);
    switchTab('lecturer-home');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(37,99,235,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>👨‍🏫 Portal Staf & Pensyarah</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Selamat Datang, {currentUser ? currentUser.name : 'Pensyarah'}!
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Lapor kesalahan tatatertib pelajar dan semak rekod disiplin pelajar Kolej Komuniti Tawau.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenReportCase} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
          <Plus size={18} /> + Lapor Kes Kesalahan Pelajar
        </button>
      </div>

      {/* Top Tab Pill Navigation (Boleh tukar antara Portal Semakan & Dashboard Ringkasan) */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        <button
          type="button"
          className={`btn btn-sm ${currentTab === 'lecturer-home' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchTab('lecturer-home')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
        >
          <Search size={14} /> Semak Rekod Pelajar
        </button>
        <button
          type="button"
          className={`btn btn-sm ${currentTab === 'lecturer-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchTab('lecturer-dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
        >
          <BarChart3 size={14} /> Dashboard Analitik & Ringkasan Kursus
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* TAB 1: SEMAK REKOD DISIPLIN PELAJAR (LIVE SEARCH 'H')    */}
      {/* ═════════════════════════════════════════════════════════ */}
      {currentTab === 'lecturer-home' && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Laporan Dihantar Oleh Saya</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{myReports.length}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jumlah Rekod Dalam Database</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>{cases.length}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jumlah Pelajar Kolej</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{students.length}</div>
            </div>
          </div>

          {/* Student Lookup Tool — Live Substring Search (Macam Admin) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search color="var(--primary)" size={19} /> Semak Rekod Disiplin Pelajar
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Carian automatik secara langsung — taip huruf atau no. matrik (contoh: "h", "Farhan", atau "S01").
                </p>
              </div>
              {searchMatrix && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSearchMatrix('')}
                  style={{ fontSize: '0.78rem' }}
                >
                  Kosongkan Carian
                </button>
              )}
            </div>

            {/* Input Carian Langsung */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Taip huruf atau perkataan (cth: 'h', nama, no. matrik, kursus)..."
                value={searchMatrix}
                onChange={(e) => setSearchMatrix(e.target.value)}
                style={{ paddingLeft: '2.6rem', fontSize: '0.92rem', fontWeight: 600 }}
              />
            </div>

            {/* JIKA ADA CARIAN & ADA HASIL BERKAITAN (SEMUA YANG BERKAITAN KELUAR) */}
            {cleanQuery && matchingStudents.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🎯 Dijumpai {matchingStudents.length} Pelajar berkaitan carian <span style={{ color: 'var(--text-main)' }}>"{searchMatrix}"</span>:
                </div>

                {matchingStudents.map(student => {
                  const studentCases = cases.filter(c => c.studentMatrix === student.matrixNo);
                  const courseInfo = COURSE_CODES[student.courseCode];
                  const deriveYear = (m) => {
                    if (!m) return '2026';
                    const match = m.match(/[A-Z]+(\d{2})F/i);
                    return match ? `20${match[1]}` : '2026';
                  };
                  const studentIntakeYear = student.intakeYear || student.tahunMasuk || deriveYear(student.matrixNo);

                  return (
                    <div
                      key={student.id || student.matrixNo}
                      style={{
                        background: 'var(--bg-secondary)',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${courseInfo?.color || 'var(--primary)'}`,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                        transition: 'transform 0.15s',
                      }}
                    >
                      {/* Header Kad Pelajar */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{student.name}</h4>
                            <span
                              style={{
                                background: 'rgba(37, 99, 235, 0.15)',
                                color: 'var(--primary)',
                                border: '1px solid var(--primary)',
                                padding: '0.2rem 0.65rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 800
                              }}
                            >
                              📅 Tahun Masuk: {studentIntakeYear}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                            <span>No. Matrik: <strong style={{ color: 'var(--primary)' }}>{student.matrixNo}</strong></span>
                            <span>🪪 IC: <strong>{student.icNo || '—'}</strong></span>
                            <span>Jantina: <strong>{student.gender || 'Lelaki'}</strong></span>
                            <span>📚 <strong>{student.courseCode}</strong> — {courseInfo?.fullName || student.course}</span>
                            <span>({student.semester})</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className={`badge ${studentCases.length > 0 ? 'badge-warning' : 'badge-success'}`} style={{ fontWeight: 800 }}>
                            {studentCases.length} Kes Kesalahan
                          </span>
                          <span className={`badge ${student.status === 'Baik' ? 'badge-success' : student.status === 'Amaran' ? 'badge-warning' : 'badge-danger'}`}>
                            Status: {student.status}
                          </span>
                        </div>
                      </div>

                      {/* Sejarah Rekod Disiplin Pelajar */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Sejarah Rekod Disiplin:
                        </div>

                        {studentCases.length === 0 ? (
                          <div style={{ fontSize: '0.85rem', color: 'var(--success)', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CheckCircle2 size={16} /> Pelajar ini bersih daripada sebarang rekod kesalahan tatatertib.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {studentCases.map((c, idx) => (
                              <div
                                key={c.id}
                                style={{
                                  background: 'var(--bg-primary)',
                                  padding: '0.85rem 1rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.85rem',
                                  border: '1px solid var(--border-color)'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <span>
                                    <strong>[Kes #{idx + 1}]</strong> <span style={{ color: 'var(--primary)' }}>{c.id}</span> — {c.category}
                                  </span>
                                  <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.8rem' }}>
                                    ⚠️ Denda: {c.denda || 'Jumpa Pensyarah Disiplin di Bilik'}
                                  </span>
                                </div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{c.description}</p>

                                {/* 📸 Lampiran Gambar Bukti Kes */}
                                {c.evidenceImage && (
                                  <div style={{
                                    margin: '0.5rem 0',
                                    padding: '0.5rem 0.75rem',
                                    background: 'rgba(37, 99, 235, 0.08)',
                                    border: '1px solid rgba(37, 99, 235, 0.25)',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <img
                                        src={c.evidenceImage}
                                        alt="Bukti kes"
                                        onClick={() => setViewingEvidence(c)}
                                        style={{
                                          width: '42px',
                                          height: '42px',
                                          objectFit: 'cover',
                                          borderRadius: '6px',
                                          border: '1.5px solid var(--primary)',
                                          cursor: 'pointer'
                                        }}
                                        title="Klik untuk buka gambar bukti"
                                      />
                                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                        📸 Lampiran Gambar Bukti Kes
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-xs"
                                      onClick={() => setViewingEvidence(c)}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                                    >
                                      <Eye size={12} /> Buka Gambar Bukti
                                    </button>
                                  </div>
                                )}

                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.3rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                                  <span>Dilapor oleh: <strong>{c.reportedBy}</strong></span>
                                  <span>Tarikh: <strong>{c.date}</strong> {c.incidentTime ? `• 🕒 ${c.incidentTime}` : ''}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* JIKA ADA CARIAN TAPI TIADA HASIL */}
            {cleanQuery && matchingStudents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1.5rem', color: 'var(--danger)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <AlertTriangle size={36} style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Tiada Pelajar Dijumpai</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Tiada rekod pelajar dijumpai yang mempunyai huruf/perkataan <strong style={{ color: 'var(--danger)' }}>"{searchMatrix}"</strong>.
                </p>
              </div>
            )}

            {/* JIKA TIADA CARIAN (TIDAK MEMAPARKAN SEMUA BUAT MACAM DALAM BUTIRAN AKAUN PELAJAR) */}
            {!cleanQuery && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <Search size={36} style={{ marginBottom: '0.6rem', opacity: 0.6, color: 'var(--primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Semakan Rekod Disiplin Pelajar
                </h4>
                <p style={{ fontSize: '0.85rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
                  Sila taip huruf atau nama pelajar pada kotak carian di atas (contohnya taip <strong style={{ color: 'var(--primary)' }}>"h"</strong> untuk melihat semua pelajar yang mempunyai huruf "h").
                </p>
                <div style={{ fontSize: '0.75rem', marginTop: '0.75rem', opacity: 0.8 }}>
                  🔒 Sistem tidak memaparkan semua senarai pelajar serentak seperti dalam butiran akaun pelajar.
                </div>
              </div>
            )}
          </div>

          {/* Database Cases Shared Table */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Senarai Rekod Kesalahan Disiplin Keseluruhan ({cases.length})
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>ID Kes</th>
                    <th style={{ padding: '0.75rem' }}>No. Matrik & Pelajar</th>
                    <th style={{ padding: '0.75rem' }}>Kursus</th>
                    <th style={{ padding: '0.75rem' }}>Kategori Kesalahan</th>
                    <th style={{ padding: '0.75rem' }}>Denda Dikenakan</th>
                    <th style={{ padding: '0.75rem' }}>Dilaporkan Oleh</th>
                    <th style={{ padding: '0.75rem' }}>Tarikh</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Tiada rekod kes kesalahan disiplin dalam database.
                      </td>
                    </tr>
                  ) : (
                    cases.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{c.id}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{c.studentName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.studentMatrix}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge course-badge-${c.courseCode || 'STM'}`} style={{ fontSize: '0.7rem' }}>
                            {c.courseCode || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{c.category}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.82rem' }}>
                            {c.denda || 'Jumpa Pensyarah Disiplin di Bilik'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{c.reportedBy}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div>{c.date}</div>
                          {c.incidentTime && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🕒 {c.incidentTime}</div>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* TAB 2: DASHBOARD ANALITIK & RINGKASAN KURSUS             */}
      {/* (MEMAPARKAN PERATUS & JUMLAH PELAJAR MACAM BUTIRAN AKAUN) */}
      {/* ═════════════════════════════════════════════════════════ */}
      {currentTab === 'lecturer-dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jumlah Pelajar Kolej</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{students.length} Orang</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Berdaftar di KK Tawau</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jumlah Kes Tatatertib</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>{cases.length} Kes</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Rekod rasmi keseluruhan</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Kadar Rekod Bersih</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{cleanPct}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{cleanStudentsCount} daripada {students.length} pelajar bersih</div>
            </div>
          </div>

          {/* Ranking & Ringkasan Kursus (Memaparkan Peratus & Jumlah Pelajar) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} color="var(--primary)" /> Dashboard Ringkasan & Ranking Kesalahan Kursus
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Memaparkan jumlah pelajar, peratusan rekod kes, dan pecahan kesalahan bagi setiap program pengajian.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
              {Object.keys(COURSE_CODES).map(code => (
                <LecturerCourseCard
                  key={code}
                  code={code}
                  cases={cases}
                  students={students}
                  onSelectStudentMatrix={handleSelectFromRanking}
                />
              ))}
            </div>
          </div>

          {/* Carta Kes Kesalahan Bulanan */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color="var(--primary)" /> Carta Kes Kesalahan Bulanan {chartYear}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Trend rekod kesalahan bulanan bagi setiap program pengajian di Kolej Komuniti Tawau.
                </p>
              </div>

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
                  style={{ width: 'auto', fontSize: '0.82rem', padding: '0.3rem 0.65rem' }}
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
              </div>
            </div>

            <LecturerMonthlyBarChart cases={cases} students={students} selectedYear={chartYear} />
          </div>

        </div>
      )}

      {/* Lightbox / Modal Buka Gambar Bukti Kes untuk Pensyarah */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <Camera color="var(--primary)" size={20} /> Gambar Bukti Kesalahan Disiplin
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <strong style={{ color: 'var(--primary)' }}>{viewingEvidence.id}</strong> — {viewingEvidence.category}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Pelajar: <strong>{viewingEvidence.studentName} ({viewingEvidence.studentMatrix})</strong>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setViewingEvidence(null)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

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
                style={{ maxWidth: '100%', maxHeight: '52vh', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
              />
            </div>

            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem' }}>
              <div>
                <div>📅 Tarikh: <strong>{viewingEvidence.date}</strong> {viewingEvidence.incidentTime ? `• 🕒 ${viewingEvidence.incidentTime}` : ''} · Pelapor: <strong>{viewingEvidence.reportedBy}</strong></div>
                {viewingEvidence.evidence && viewingEvidence.evidence !== 'Tiada lampiran khas.' && (
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                    📝 Catatan: <em>{viewingEvidence.evidence}</em>
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

    </div>
  );
}
