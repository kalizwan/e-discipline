import React from 'react';
import { X, BookOpen, ShieldCheck, AlertTriangle, UserCheck, ShieldAlert, Car, Gavel } from 'lucide-react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
              <BookOpen color="var(--primary)" size={24} /> BUKU PANDUAN DAN PERATURAN AM PELAJAR
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.25rem' }}>
              KOLEJ KOMUNITI TAWAU (Tertakluk di bawah Akta 174 [Tatatertib Pelajar] 1976)
            </p>
          </div>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Content Body — Full Official Document */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>

          {/* BAHAGIAN 1 */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} /> BAHAGIAN 1: RUPA DIRI & ETIKA PAKAIAN
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>1.1 Kad Matrik Pelajar</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  • Setiap pelajar <strong>wajib memakai dan mempamerkan Kad Matrik pada paras dada</strong> sepanjang berada di dalam kawasan kolej, bilik kuliah, bengkel, makmal, dan semasa menghadiri acara rasmi.<br/>
                  • Pelajar dilarang menggunakan atau meminjam kad matrik milik pelajar lain.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-main)' }}>1.2 Etika Pakaian Pelajar Lelaki</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  • <strong>Baju:</strong> Kemeja berlengan panjang/pendek atau kemeja-T berkolar rasmi kolej. Baju mestilah sentiasa dimasukkan ke dalam seluar (tuck-in) dan dibutangkan dengan sempurna.<br/>
                  • <strong>Seluar:</strong> Seluar slack yang kemas dan berkeadaan baik. Dilarang memakai seluar jeans koyak/bertampal, seluar ketat (skinny), atau seluar trek sukan ke bilik kuliah.<br/>
                  • <strong>Rambut & Rupa Diri:</strong> Rambut mestilah sentiasa pendek, kemas, tidak mencecah kolar baju, dan tidak menutup dahi atau telinga. Dilarang mewarnakan rambut dengan warna selain hitam/warna asal. Dilarang bertindik atau memakai subang.<br/>
                  • <strong>Kasut:</strong> Kasut bertutup penuh bersama stoking. Selipar, sandal, atau terompah dilarang sama sekali.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-main)' }}>1.3 Etika Pakaian Pelajar Perempuan</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  • <strong>Pakaian:</strong> Baju kurung atau pakaian yang sopan, longgar, menutup aurat, tidak jarang, dan tidak menjolok mata.<br/>
                  • <strong>Tudung:</strong> Bagi pelajar beragama Islam, tudung hendaklah dipakai dengan kemas dan tidak bercorak keterlaluan.<br/>
                  • <strong>Kasut:</strong> Kasut bertutup penuh. Kasut bertumit tinggi yang runcing tidak dibenarkan di bengkel/makmal atas faktor keselamatan.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-main)' }}>1.4 Keselamatan di Bengkel & Makmal</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  • Wajib memakai pakaian keselamatan (Personal Protective Equipment - PPE) seperti baju bengkel (overall / workshop jacket) dan kasut keselamatan (safety shoes) semasa sesi amali dijalankan.
                </p>
              </div>
            </div>
          </div>

          {/* BAHAGIAN 2 */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} /> BAHAGIAN 2: KEHADIRAN & DISIPLIN AKADEMIK
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>2.1 Peratusan Kehadiran Minimum</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  • Pelajar <strong>wajib mencapai sekurang-kurangnya 80% kehadiran</strong> bagi setiap kursus/modul yang didaftarkan.<br/>
                  • Pelajar yang gagal mencapai 80% tanpa sebab yang sah akan dihalang daripada menduduki Penilaian Akhir (PA) / Peperiksaan Akhir dan akan diberikan gred F/Gagal.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-main)' }}>2.2 Bukti Ketidakhadiran</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  • Sebarang ketidakhadiran mestilah disokong dengan Sijil Cuti Sakit (MC) rasmi daripada hospital/klinik kerajaan/swasta yang sah atau Surat Kebenaran Rasmi daripada Pengarah/Pegawai Hal Ehwal Pelajar (HEP) dalam tempoh 48 jam.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-main)' }}>2.3 Integriti Akademik</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  • Dilarang meniru, membawa nota tidak dibenarkan, atau berhubung semasa peperiksaan/penilaian.<br/>
                  • Dilarang melakukan plagiarisme atau memalsukan tandatangan pensyarah dan dokumen kolej.
                </p>
              </div>
            </div>
          </div>

          {/* BAHAGIAN 3 */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--danger)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} /> BAHAGIAN 3: TATATERTIB AM & LARANGAN MUTLAK (AKTA 174)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <p>• <strong>Rokok & Vape:</strong> Larangan mutlak merokok, membawa, menyimpan, atau menggunakan rokok tembakau serta rokok elektronik/vape di seluruh kawasan kampus.</p>
              <p>• <strong>Dadah & Bahan Terlarang:</strong> Larangan keras memiliki, mengedar, mengambil, atau berada di bawah pengaruh dadah, ganja, pil khayal, racun, atau sebarang minuman beralkohol.</p>
              <p>• <strong>Perbuatan Tidak Bermoral & Salah Laku Seksual:</strong> Larangan berkelakuan sumbang, berdua-duaan (khalwat), melakukan gangguan seksual (sexual harassment), membawa bahan lucah, atau merakam tanpa kebenaran.</p>
              <p>• <strong>Vandalisme:</strong> Dilarang menconteng, merosakkan, memecahkan, atau menyalahgunakan peralatan bengkel, makmal komputer, bangunan, dan kemudahan kolej.</p>
              <p>• <strong>Pergaduhan & Buli:</strong> Larangan membawa senjata tajam/berbahaya, bergaduh secara fizikal, mengugut, membuli, atau menyertai kumpulan haram/gangsterisme.</p>
              <p>• <strong>Media Sosial & Reputasi Institusi:</strong> Larangan menyebarkan fitnah, berita palsu, atau kenyataan provokasi di media sosial yang boleh menjejaskan imej dan nama baik institusi.</p>
            </div>
          </div>

          {/* BAHAGIAN 4 */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--warning)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--warning)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Car size={18} /> BAHAGIAN 4: KENDERAAN & KESELAMATAN KAMPUS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <p>• Pelajar yang membawa kenderaan ke kampus mestilah memiliki lesen memandu sah, cukai jalan aktif, dan mendaftar untuk mendapatkan pelekat kenderaan kolej.</p>
              <p>• Wajib memakai topi keledar bagi penunggang motosikal dan mematuhi had laju kampus (20–30 km/j).</p>
              <p>• Meletakkan kenderaan di kawasan parkir yang dikhaskan untuk pelajar sahaja.</p>
            </div>
          </div>

          {/* BAHAGIAN 5 */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--success)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gavel size={18} /> BAHAGIAN 5: TINDAKAN & HUKUMAN TATATERTIB
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Mengikut Kaedah-Kaedah Institusi Pelajaran (Tatatertib Pelajar), tindakan berikut boleh dikenakan oleh Pihak Berkuasa Tatatertib Kolej Komuniti Tawau:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <p>1. <strong>Amaran Lisan & Sesi Kaunseling Mandatori</strong> (Kesalahan Ringan).</p>
              <p>2. <strong>Surat Amaran Bertulis</strong> (Amaran Pertama & Amaran Terakhir) yang dihantar kepada ibu bapa/penjaga.</p>
              <p>3. <strong>Denda & Pampasan Ganti Rugi</strong> bagi kerosakan harta benda awam/kolej.</p>
              <p>4. <strong>Penggantungan Pengajian</strong> untuk tempoh satu atau beberapa semester.</p>
              <p>5. <strong>Penyingkiran / Buang Kolej</strong> bagi kesalahan jenayah berat atau perlanggaran tatatertib serius di bawah Akta 174.</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © Jabatan Hal Ehwal Pelajar & Disiplin — Kolej Komuniti Tawau
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
