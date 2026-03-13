import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Users, CheckSquare, Star, 
  FileText, Trophy, Image as ImageIcon, 
  Lock, Unlock, Plus, Trash2, Edit2, 
  X, Save, Share2, Download, Clock as ClockIcon, Calendar as CalendarIcon, UploadCloud, Search, Menu, BookOpen,
  UserCircle, Bell, Info, Heart, Eye, EyeOff
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// ==========================================================
// KONFIGURASI FIREBASE (Asli milik Anda)
// ==========================================================
const firebaseConfig = {
  apiKey: "AIzaSyCceVwc5SKSxUgeSsxVCmCQXRqp3vMcEtw", 
  authDomain: "absen-mondok.firebaseapp.com", 
  projectId: "absen-mondok", 
  storageBucket: "absen-mondok.firebasestorage.app", 
  messagingSenderId: "794837774862", 
  appId: "1:794837774862:web:b96c51eb078c25c933025f", 
  measurementId: "G-72D7JL421Z"
};

// ==========================================================
// URL LOGO SEKOLAH (Ganti link di bawah dengan link logo Anda)
// ==========================================================
const LOGO_KIRI_URL = "https://i.ibb.co.com/1G7wRhDj/Whats-App-Image-2026-03-02-at-07-55-46.jpg"; 
const LOGO_KANAN_URL = "https://i.ibb.co.com/0RN3dBfM/LOGO-SDIT-AL-HANIF-NO-BOARDER.png"; 

// FIX: Mencegah error saat hot-reload karena inisialisasi ganda
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ==========================================
// KOMPONEN UTAMA (APP)
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('beranda');
  const [isAdmin, setIsAdmin] = useState(true); 
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, ids: [], msg: '' });

  // State untuk Animasi Transisi Mode Admin
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState('');
  
  // State untuk Sidebar Drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Master Data dari Firebase
  const [allData, setAllData] = useState([]);
  
  // State untuk Mode Edit (Lintas Tab)
  const [editItem, setEditItem] = useState(null);

  // Load html2pdf dynamically for export
  useEffect(() => {
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      document.body.appendChild(script);
    }
  }, []);

  // Listener Firebase Realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "mondok_data"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllData(data);
    });
    return () => unsub();
  }, []);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  // Fungsi Global Simpan ke Firebase
  const handleSaveData = async (formData, editId = null) => {
    try {
      if (editId) {
        await updateDoc(doc(db, "mondok_data", editId), formData);
      } else {
        if (!formData.createdAt) formData.createdAt = Date.now();
        await addDoc(collection(db, "mondok_data"), formData);
      }
      return true;
    } catch (error) {
      showToastMsg('Gagal menyimpan data: ' + error.message, 'error');
      return false;
    }
  };

  // Fungsi Global Hapus Data
  const confirmDelete = async () => {
    try {
      await Promise.all(deleteModal.ids.map(id => deleteDoc(doc(db, "mondok_data", id))));
      showToastMsg(`${deleteModal.ids.length} data berhasil dihapus!`, 'success');
    } catch (error) {
      showToastMsg('Gagal menghapus: ' + error.message, 'error');
    }
    setDeleteModal({ show: false, ids: [], msg: '' });
  };

  const triggerDelete = (ids, msg) => {
    setDeleteModal({ show: true, ids: Array.isArray(ids) ? ids : [ids], msg });
  };

  // Reset Mingguan
  const resetPekanan = () => {
    const ids = allData.filter(d => d.type === 'absensi' || d.type === 'penilaian' || d.type === 'quran').map(d => d.id);
    if(ids.length === 0) return showToastMsg('Tidak ada data evaluasi pekan ini.', 'error');
    triggerDelete(ids, "PERINGATAN! Anda akan MENGHAPUS SEMUA NILAI, QURAN & ABSENSI pekan ini. (Data Nama Santri & Kelompok tetap aman). Lanjutkan?");
  };

  const handleAdminLogin = () => {
    if (adminPin === '123456') {
      setShowAdminModal(false);
      setTransitionType('login');
      setIsTransitioning(true);
      // Ubah UI di tengah transisi
      setTimeout(() => {
        setIsAdmin(true);
        setAdminPin('');
      }, 600); 
      // Selesaikan transisi
      setTimeout(() => {
        setIsTransitioning(false);
        showToastMsg('Akses Admin Terbuka', 'success');
      }, 1800);
    } else {
      showToastMsg('PIN Salah!', 'error');
    }
  };

  const handleAdminLogout = () => {
    setTransitionType('logout');
    setIsTransitioning(true);
    // Ubah UI di tengah transisi
    setTimeout(() => {
      setIsAdmin(false);
    }, 600);
    // Selesaikan transisi
    setTimeout(() => {
      setIsTransitioning(false);
      showToastMsg('Kembali ke Mode Pendamping', 'success');
    }, 1800);
  };

  const tabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'asrama', label: 'Santri', icon: Users },
    { id: 'absensi', label: 'Ibadah', icon: CheckSquare },
    { id: 'quran', label: 'Quran/Doa', icon: BookOpen },
    { id: 'penilaian', label: 'Nilai', icon: Star },
    { id: 'rekap', label: 'Rekap', icon: FileText },
    { id: 'total', label: 'Rapor', icon: Trophy },
    { id: 'galeri', label: 'Galeri', icon: ImageIcon },
    { id: 'portal', label: 'Portal Ortu', icon: UserCircle },
    { id: 'info', label: 'Pusat Info', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-6 md:pb-0 flex flex-col">
      {/* Garis Indikator Admin Aktif */}
      {isAdmin && <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] z-[60] animate-pulse"></div>}

      {/* HEADER ATAS: Warna dipergelap ke seri 700 & 800 agar hijau pekat elegan */}
      <header className="bg-gradient-to-r from-emerald-950 via-gray-900 to-teal-950 text-whaite shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex justify-between items-center">
            
            {/* KIRI: Tombol Menu & Logo Kiri */}
            <div className="w-1/3 flex items-center justify-start gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 md:p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                <Menu size={24} /> <span className="hidden md:block font-bold text-sm">Menu</span>
              </button>
              <img src={LOGO_KIRI_URL} alt="Logo Kiri" className="hidden sm:block h-8 md:h-10 object-contain drop-shadow-md rounded-md" />
            </div>
            
            {/* TENGAH: Judul Saja */}
            <div className="w-1/3 flex flex-col items-center justify-center text-center">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight drop-shadow-sm leading-none">SIMONIF</h1>
              <p className="text-emerald-100 text-[10px] md:text-xs font-medium mt-1">SDIT Al Hanif</p>
            </div>

            {/* KANAN: Logo Kanan & Widget Jam Desktop */}
            <div className="w-1/3 flex items-center justify-end gap-3">
              <img src={LOGO_KANAN_URL} alt="Logo Kanan" className="hidden sm:block h-8 md:h-10 object-contain drop-shadow-md rounded-md" />
              <div className="hidden md:block min-w-[140px]">
                 <ClockComponent />
              </div>
            </div>

          </div>
          
          {/* Baris Jam Khusus Tampilan Mobile */}
          <div className="md:hidden mt-3 flex justify-between items-center border-t border-white/20 pt-2">
            <div className="flex items-center gap-2">
              <img src={LOGO_KIRI_URL} alt="Logo Kiri" className="h-6 object-contain rounded-sm" />
              <img src={LOGO_KANAN_URL} alt="Logo Kanan" className="h-6 object-contain rounded-sm" />
            </div>
            <div className="min-w-[120px] text-right">
                <ClockComponent isMobile={true} />
            </div>
          </div>

        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 animate-fade-in pt-6">
        {activeTab === 'beranda' && <BerandaView allData={allData} handleSaveData={handleSaveData} triggerDelete={triggerDelete} isAdmin={isAdmin} showToast={showToastMsg} />}
        {activeTab === 'asrama' && <AsramaView allData={allData} handleSaveData={handleSaveData} triggerDelete={triggerDelete} isAdmin={isAdmin} showToast={showToastMsg} />}
        {activeTab === 'absensi' && <AbsensiView allData={allData} handleSaveData={handleSaveData} editItem={editItem} setEditItem={setEditItem} showToast={showToastMsg} />}
        {activeTab === 'quran' && <QuranView allData={allData} handleSaveData={handleSaveData} editItem={editItem} setEditItem={setEditItem} showToast={showToastMsg} />}
        {activeTab === 'penilaian' && <PenilaianView allData={allData} handleSaveData={handleSaveData} editItem={editItem} setEditItem={setEditItem} showToast={showToastMsg} />}
        {activeTab === 'rekap' && <RekapView allData={allData} setEditItem={setEditItem} setActiveTab={setActiveTab} triggerDelete={triggerDelete} resetPekanan={resetPekanan} isAdmin={isAdmin} />}
        {activeTab === 'total' && <RaporView allData={allData} resetPekanan={resetPekanan} isAdmin={isAdmin} showToast={showToastMsg} />}
        {activeTab === 'galeri' && <GaleriView allData={allData} />}
        {activeTab === 'portal' && <PortalOrtuView allData={allData} handleSaveData={handleSaveData} triggerDelete={triggerDelete} isAdmin={isAdmin} showToast={showToastMsg} />}
        {activeTab === 'info' && <InfoView allData={allData} handleSaveData={handleSaveData} triggerDelete={triggerDelete} isAdmin={isAdmin} showToast={showToastMsg} />}
      </main>

      {/* --- SIDEBAR DRAWER (UTAMA UNTUK SEMUA LAYAR) --- */}
      {/* Latar Belakang Gelap (Overlay) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Panel Drawer */}
      <div className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl z-[90] transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header Drawer: Dipergelap juga agar senada */}
        <div className="bg-gradient-to-br from-emerald-700 to-teal-800 p-6 text-white shrink-0 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden p-1">
              <img src={LOGO_KANAN_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">SIMONIF</h2>
              <p className="text-emerald-100 text-xs">SDIT Al Hanif</p>
            </div>
          </div>
        </div>

        {/* Menu Navigasi Drawer */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => { 
                  setActiveTab(tab.id); 
                  setEditItem(null); 
                  setIsSidebarOpen(false); // Tutup drawer setelah menu dipilih
                }} 
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-800' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-100/50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  <tab.icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                </div>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Footer Drawer (Khusus Area Login Admin) */}
        <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
          <div className="text-[10px] text-center text-gray-400 font-bold uppercase mb-2">Area Keamanan</div>
          <button onClick={() => { setIsSidebarOpen(false); isAdmin ? handleAdminLogout() : setShowAdminModal(true); }} 
            className={`w-full py-3.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all border shadow-sm ${
              isAdmin 
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
            }`}>
            {isAdmin ? <Unlock size={16}/> : <Lock size={16}/>} {isAdmin ? 'Keluar Mode Admin' : 'Login Admin'}
          </button>
        </div>
      </div>

      {/* Modal Transisi Perubahan Mode */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"></div>
          <div className="relative bg-white px-8 py-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm w-full text-center">
            {transitionType === 'login' ? (
              <>
                <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                  <Unlock size={48} className="animate-bounce" />
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-2">Akses Terbuka</h2>
                <p className="text-gray-500 font-medium">Memuat fitur Admin...</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                  <Lock size={48} className="animate-bounce" />
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-2">Sistem Terkunci</h2>
                <p className="text-gray-500 font-medium">Beralih ke mode Pendamping...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Global Modals */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32} /></div>
            <h3 className="text-xl font-bold mb-2">Login Admin</h3>
            <p className="text-gray-500 text-sm mb-6">Masukkan PIN (Default: 123456)</p>
            <input type="password" placeholder="••••••" value={adminPin} onChange={e => setAdminPin(e.target.value)} className="w-full text-center text-2xl tracking-[0.5em] p-4 bg-gray-50 border border-gray-200 rounded-2xl mb-6 focus:ring-4 focus:ring-emerald-100 outline-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowAdminModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">Batal</button>
              <button onClick={handleAdminLogin} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">Masuk</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center border border-gray-100">
            <div className="text-red-500 text-6xl mb-4 animate-pulse">⚠️</div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">Konfirmasi</h3>
            <p className="text-sm text-gray-500 mb-8 px-2">{deleteModal.msg}</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteModal({show:false, ids:[], msg:''})} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all border border-gray-200">Batal</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold hover:-translate-y-0.5 shadow-lg shadow-red-200 transition-all">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] font-bold text-white flex items-center gap-2 animate-slide-down ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? <X size={20}/> : <CheckSquare size={20}/>} <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// VIEWS (Halaman-Halaman)
// ==========================================

function BerandaView({ allData, handleSaveData, triggerDelete, isAdmin, showToast }) {
  const rundown = allData.filter(d => d.type === 'rundown').sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
  const kaldik = allData.filter(d => d.type === 'kaldik').sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
  const jadwalPendamping = allData.filter(d => d.type === 'jadwal_pendamping').sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));

  const [rdModal, setRdModal] = useState(false);
  const [rdForm, setRdForm] = useState({ jam:'', kegiatan:'', deskripsi:'' });
  const [rdEditId, setRdEditId] = useState(null);

  const [kdModal, setKdModal] = useState(false);
  const [kdForm, setKdForm] = useState({ bulan:'', tahun:'', kegiatan:'', deskripsi:'' });
  const [kdEditId, setKdEditId] = useState(null);

  const [jpModal, setJpModal] = useState(false);
  const [jpForm, setJpForm] = useState({ jadwal:'', nama:'', keterangan:'' });
  const [jpEditId, setJpEditId] = useState(null);

  const loadTemplateRd = async () => {
    const tpls = [
      { jam: '15.00', kegiatan: 'Kedatangan Santri', deskripsi: 'Registrasi & penempatan barang' },
      { jam: '15.30', kegiatan: 'Shalat Ashar', deskripsi: 'Berjamaah di masjid & zikir' },
      { jam: '18.00', kegiatan: 'Maghrib & Makan', deskripsi: 'Rangkaian ibadah & makan malam' }
    ];
    for(let i=0; i<tpls.length; i++) await handleSaveData({ type: 'rundown', ...tpls[i], createdAt: Date.now()+i });
    showToast('Template Rundown dimuat!');
  };

  const loadTemplateKd = async () => {
    const tpls = [
      { bulan: 'JUL', tahun: '2026', kegiatan: 'Orientasi', deskripsi: 'Sosialisasi program mondok' },
      { bulan: 'AGS', tahun: '2026', kegiatan: 'Gelombang 1', deskripsi: 'Mondok pekanan kloter pertama' }
    ];
    for(let i=0; i<tpls.length; i++) await handleSaveData({ type: 'kaldik', ...tpls[i], createdAt: Date.now()+i });
    showToast('Template Kaldik dimuat!');
  };

  const saveRd = async (e) => {
    e.preventDefault();
    await handleSaveData({ type: 'rundown', ...rdForm }, rdEditId);
    setRdModal(false); showToast('Jadwal disimpan');
  };

  const saveKd = async (e) => {
    e.preventDefault();
    await handleSaveData({ type: 'kaldik', ...kdForm, bulan: kdForm.bulan.toUpperCase() }, kdEditId);
    setKdModal(false); showToast('Jadwal Mondok disimpan');
  };

  const saveJp = async (e) => {
    e.preventDefault();
    await handleSaveData({ type: 'jadwal_pendamping', ...jpForm }, jpEditId);
    setJpModal(false); showToast('Jadwal Pendamping disimpan');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
        <div className="flex justify-center gap-4 mb-4 relative z-10">
          <img src={LOGO_KIRI_URL} alt="Logo Kiri" className="h-16 md:h-20 object-contain drop-shadow-lg rounded-md" />
          <img src={LOGO_KANAN_URL} alt="Logo Kanan" className="h-16 md:h-20 object-contain drop-shadow-lg rounded-md" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2 relative z-10">Ahlan Wa Sahlan</h2>
        <p className="text-gray-500 text-sm md:text-base relative z-10">Aplikasi SIMONIF (Sistem Monitoring Mondok) SDIT Al Hanif.</p>
      </div>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
        {/* Rundown */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700"><ClockIcon size={24} /></div>
              <h3 className="font-bold text-gray-800 text-lg">Rundown Mondok</h3>
            </div>
            {isAdmin && <button onClick={()=>{setRdForm({jam:'',kegiatan:'',deskripsi:''}); setRdEditId(null); setRdModal(true);}} className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1"><Plus size={16}/> Tambah</button>}
          </div>
          <div className="space-y-4">
            {rundown.length === 0 ? (
              <div className="text-center p-4">
                <span className="text-gray-400 text-sm italic block mb-2">Belum ada jadwal.</span>
                {isAdmin && <button onClick={loadTemplateRd} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md font-bold">⚡ Muat Template</button>}
              </div>
            ) : rundown.map((r, i) => (
              <div key={r.id} className="flex gap-4 items-start group relative">
                <div className="bg-gray-50 border border-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-sm w-20 text-center group-hover:bg-emerald-50 transition-all">{r.jam}</div>
                <div className="flex-1 pr-12">
                  <div className="font-bold text-gray-800 text-sm">{r.kegiatan}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.deskripsi}</div>
                </div>
                {isAdmin && (
                  <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 flex gap-1 bg-white shadow-sm p-1 rounded-lg">
                    <button onClick={()=>{setRdForm(r); setRdEditId(r.id); setRdModal(true)}} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={()=>triggerDelete(r.id, "Hapus jadwal ini?")} className="text-red-500 p-1.5 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Kaldik */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><CalendarIcon size={24} /></div>
              <h3 className="font-bold text-gray-800 text-lg">Jadwal Mondok</h3>
            </div>
            {isAdmin && <button onClick={()=>{setKdForm({bulan:'',tahun:'',kegiatan:'',deskripsi:''}); setKdEditId(null); setKdModal(true);}} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1"><Plus size={16}/> Tambah</button>}
          </div>
          <div className="space-y-3">
            {kaldik.length === 0 ? (
              <div className="text-center p-4">
                <span className="text-gray-400 text-sm italic block mb-2">Belum ada kalender kegiatan.</span>
                {isAdmin && <button onClick={loadTemplateKd} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md font-bold">⚡ Muat Template</button>}
              </div>
            ) : kaldik.map((k, i) => (
              <div key={k.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 relative group">
                <div className="w-14 text-center shrink-0">
                  <div className="text-[10px] font-bold text-red-500">{k.bulan}</div>
                  <div className="text-lg font-black text-gray-800">{k.tahun}</div>
                </div>
                <div className="w-px h-8 bg-gray-200 shrink-0"></div>
                <div className="flex-1 pr-12">
                  <div className="font-bold text-gray-800 text-sm">{k.kegiatan}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{k.deskripsi}</div>
                </div>
                {isAdmin && (
                  <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white shadow-sm p-1 rounded-lg">
                    <button onClick={()=>{setKdForm(k); setKdEditId(k.id); setKdModal(true)}} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={()=>triggerDelete(k.id, "Hapus kaldik ini?")} className="text-red-500 p-1.5 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Jadwal Pendamping Mondok */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600"><Users size={24} /></div>
              <h3 className="font-bold text-gray-800 text-lg">Jadwal Pendamping</h3>
            </div>
            {isAdmin && <button onClick={()=>{setJpForm({jadwal:'',nama:'',keterangan:''}); setJpEditId(null); setJpModal(true);}} className="text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1"><Plus size={16}/> Tambah</button>}
          </div>
          <div className="space-y-4">
            {jadwalPendamping.length === 0 ? (
              <div className="text-center p-4">
                <span className="text-gray-400 text-sm italic block mb-2">Belum ada jadwal pendamping.</span>
              </div>
            ) : jadwalPendamping.map((jp, i) => (
              <div key={jp.id} className="flex gap-4 items-start group relative">
                <div className="bg-gray-50 border border-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-xs w-24 shrink-0 text-center group-hover:bg-purple-50 transition-all">{jp.jadwal}</div>
                <div className="flex-1 pr-12">
                  <div className="font-bold text-gray-800 text-sm">{jp.nama}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{jp.keterangan}</div>
                </div>
                {isAdmin && (
                  <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 flex gap-1 bg-white shadow-sm p-1 rounded-lg">
                    <button onClick={()=>{setJpForm(jp); setJpEditId(jp.id); setJpModal(true)}} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={()=>triggerDelete(jp.id, "Hapus jadwal pendamping ini?")} className="text-red-500 p-1.5 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modals */}
      {rdModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={saveRd} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg mb-2">⏱ Form Rundown</h3>
            <div><label className="text-xs font-bold text-gray-500">Jam (Misal: 15.00)</label><input value={rdForm.jam} onChange={e=>setRdForm({...rdForm, jam:e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50" required/></div>
            <div><label className="text-xs font-bold text-gray-500">Kegiatan</label><input value={rdForm.kegiatan} onChange={e=>setRdForm({...rdForm, kegiatan:e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50" required/></div>
            <div><label className="text-xs font-bold text-gray-500">Deskripsi</label><input value={rdForm.deskripsi} onChange={e=>setRdForm({...rdForm, deskripsi:e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50"/></div>
            <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setRdModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Batal</button><button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold">Simpan</button></div>
          </form>
        </div>
      )}
      {kdModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={saveKd} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg mb-2">📅 Form Jadwal Mondok</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-gray-500">Bulan (3 Huruf)</label><input value={kdForm.bulan} onChange={e=>setKdForm({...kdForm, bulan:e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50" required maxLength="3"/></div>
              <div><label className="text-xs font-bold text-gray-500">Tahun</label><input value={kdForm.tahun} onChange={e=>setKdForm({...kdForm, tahun:e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50" required/></div>
            </div>
            <div><label className="text-xs font-bold text-gray-500">Kegiatan</label><input value={kdForm.kegiatan} onChange={e=>setKdForm({...kdForm, kegiatan:e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50" required/></div>
            <div><label className="text-xs font-bold text-gray-500">Deskripsi</label><input value={kdForm.deskripsi} onChange={e=>setKdForm({...kdForm, deskripsi:e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50"/></div>
            <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setKdModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Batal</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Simpan</button></div>
          </form>
        </div>
      )}
      {jpModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={saveJp} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg mb-2 text-purple-800 flex items-center gap-2"><Users size={20}/> Form Jadwal Pendamping</h3>
            <div><label className="text-xs font-bold text-gray-500">Waktu / Shift</label><input value={jpForm.jadwal} onChange={e=>setJpForm({...jpForm, jadwal:e.target.value})} placeholder="Misal: Sabtu - Ahad" className="w-full p-3 border rounded-xl bg-gray-50 mt-1" required/></div>
            <div><label className="text-xs font-bold text-gray-500">Nama Pendamping</label><input value={jpForm.nama} onChange={e=>setJpForm({...jpForm, nama:e.target.value})} placeholder="Misal: Ust. Ali & Ust. Budi" className="w-full p-3 border rounded-xl bg-gray-50 mt-1" required/></div>
            <div><label className="text-xs font-bold text-gray-500">Keterangan Tambahan</label><input value={jpForm.keterangan} onChange={e=>setJpForm({...jpForm, keterangan:e.target.value})} placeholder="Misal: Gelombang 1 Kelas 6" className="w-full p-3 border rounded-xl bg-gray-50 mt-1"/></div>
            <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setJpModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Batal</button><button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold">Simpan</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

function AsramaView({ allData, handleSaveData, triggerDelete, isAdmin, showToast }) {
  const asrama = allData.filter(d => d.type === 'asrama').sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  const anak = allData.filter(d => d.type === 'anak');
  const [formData, setFormData] = useState({ asrama: '', pembimbing: '', nama: '', nis: '', kelas: '6' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  
  // State untuk melacak data yang sedang diedit
  const [editId, setEditId] = useState(null);
  const [editType, setEditType] = useState(null);

  const autoFill = (val) => {
    setFormData({...formData, asrama: val});
    const match = asrama.find(a => a.nama_asrama.toLowerCase() === val.toLowerCase());
    if(match) setFormData(f => ({...f, pembimbing: match.nama_pembimbing}));
  };

  const handleEdit = (item, type) => {
    setEditId(item.id);
    setEditType(type);
    if (type === 'asrama') {
      setFormData({ asrama: item.nama_asrama, pembimbing: item.nama_pembimbing, nama: '', nis: '', kelas: '6' });
    } else if (type === 'anak') {
      const matchAsrama = asrama.find(a => a.nama_asrama === item.asrama);
      setFormData({ 
        asrama: item.asrama, 
        pembimbing: matchAsrama ? matchAsrama.nama_pembimbing : '', 
        nama: item.nama_anak, 
        nis: item.nis || '', 
        kelas: item.kelas || '6' 
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas agar form terlihat
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditType(null);
    setFormData({ asrama: '', pembimbing: '', nama: '', nis: '', kelas: '6' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.asrama || !formData.pembimbing) return showToast('Lengkapi Kelompok & Pembimbing!', 'error');

    // Jika sedang dalam Mode Edit
    if (editId) {
      if (editType === 'asrama') {
        await handleSaveData({ type: 'asrama', nama_asrama: formData.asrama, nama_pembimbing: formData.pembimbing }, editId);
        showToast('Data Kelompok berhasil diperbarui!');
      } else if (editType === 'anak') {
        if (!formData.nama || !formData.nis) return showToast('Nama & NIS tidak boleh kosong!', 'error');
        await handleSaveData({ type: 'anak', nama_anak: formData.nama, nis: formData.nis, kelas: formData.kelas, asrama: formData.asrama }, editId);
        showToast('Data Santri berhasil diperbarui!');
      }
      cancelEdit();
      return;
    }

    // Jika Tambah Data Baru
    const baseTime = Date.now();
    if (!asrama.find(a => a.nama_asrama.toLowerCase() === formData.asrama.toLowerCase())) {
      await handleSaveData({ type: 'asrama', nama_asrama: formData.asrama, nama_pembimbing: formData.pembimbing, createdAt: baseTime });
    } else {
      const existing = asrama.find(a => a.nama_asrama.toLowerCase() === formData.asrama.toLowerCase());
      if(existing.nama_pembimbing !== formData.pembimbing) {
        await handleSaveData({ type: 'asrama', nama_asrama: formData.asrama, nama_pembimbing: formData.pembimbing }, existing.id);
      }
    }

    if (formData.nama && formData.nis) {
      await handleSaveData({ type: 'anak', nama_anak: formData.nama, nis: formData.nis, kelas: formData.kelas, asrama: formData.asrama, createdAt: baseTime+1 });
      showToast('Santri berhasil ditambahkan!');
    } else {
      showToast('Kelompok berhasil diperbarui!');
    }
    setFormData({...formData, nama: '', nis: ''});
  };

  const downloadFormatCSV = () => {
    const header = "Nama Santri;NIS;Kelas;Nama Kelompok;Nama Pembimbing\n";
    const row1 = "Ahmad;1001;6A;BBQ Ukhuwah;Ust. Fulan\n";
    const row2 = "Zaid;1002;6B;BBQ Ukhuwah;Ust. Fulan\n";
    const row3 = "Fatimah;1003;6C;Tahfidz Annisa;Usth. Aisyah\n";
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + header + row1 + row2 + row3;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Format_Data_Santri_SIMONIF.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Template Format Excel/CSV berhasil diunduh', 'success');
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rows = ev.target.result.split(/\r?\n/);
      let count = 0;
      const baseTime = Date.now();
      for (let i = 1; i < rows.length; i++) {
        if(!rows[i].trim()) continue;
        const separator = rows[i].includes(';') ? ';' : ',';
        const cols = rows[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
        const [nama_anak, nis, kelas, nama_asrama, pembimbing] = cols;
        
        if(nama_anak && nama_asrama) {
          const existingAsrama = allData.find(d => d.type==='asrama' && d.nama_asrama.toLowerCase() === nama_asrama.toLowerCase());
          if(!existingAsrama) {
            await handleSaveData({type:'asrama', nama_asrama, nama_pembimbing: pembimbing||'-', createdAt: baseTime+i});
          } else if (pembimbing && existingAsrama.nama_pembimbing !== pembimbing) {
            await handleSaveData({type:'asrama', nama_asrama, nama_pembimbing: pembimbing}, existingAsrama.id);
          }

          const existingAnak = allData.find(d => d.type === 'anak' && (d.nis === nis || d.nama_anak.toLowerCase() === nama_anak.toLowerCase()));
          
          if (existingAnak) {
            await handleSaveData({type:'anak', nama_anak, nis, kelas, asrama: nama_asrama}, existingAnak.id);
          } else {
            await handleSaveData({type:'anak', nama_anak, nis, kelas, asrama: nama_asrama, createdAt: baseTime+i});
          }
          count++;
        }
      }
      showToast(`${count} data CSV selesai diproses (Baru/Diperbarui)!`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if(newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const deleteSelected = () => {
    if(selectedIds.size === 0) return;
    triggerDelete(Array.from(selectedIds), `Hapus ${selectedIds.size} data terpilih permanen?`);
    setSelectedIds(new Set());
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center gap-2"><Users/> Kelompok & Santri</h2>
      
      {!isAdmin && <div className="bg-blue-50 text-blue-700 p-4 rounded-xl mb-6 text-sm font-medium border border-blue-100 flex items-center gap-2"><Lock size={16}/> Hanya Admin yang dapat mengedit data santri.</div>}

      {isAdmin && (
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-emerald-200 pb-3">
             <h3 className="font-bold text-emerald-800">{editId ? '✏️ Edit Data' : 'Input Data / CSV'}</h3>
             {!editId && (
               <div className="flex gap-2">
                 <button onClick={downloadFormatCSV} className="bg-white text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-50 shadow-sm transition-colors">
                   <Download size={14}/> Format Excel/CSV
                 </button>
                 <input type="file" id="csvUpload" accept=".csv" onChange={handleImportCSV} className="hidden"/>
                 <button onClick={()=>document.getElementById('csvUpload').click()} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 shadow-sm transition-colors">
                   <UploadCloud size={14}/> Import Data
                 </button>
               </div>
             )}
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Kelompok</label>
                <input value={formData.asrama} onChange={e=>autoFill(e.target.value)} list="asramaList" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white" placeholder="Ketik/Pilih" required/>
                <datalist id="asramaList">{asrama.map(a=><option key={a.id} value={a.nama_asrama}/>)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Pembimbing</label>
                <input value={formData.pembimbing} onChange={e=>setFormData({...formData, pembimbing:e.target.value})} type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white" required/>
              </div>
            </div>
            
            {/* Tampilkan field ini hanya saat tidak edit kelompok saja (bisa untuk input baru atau edit santri) */}
            {(!editId || editType === 'anak') && (
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-white rounded-xl border border-gray-200">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Nama Santri</label><input value={formData.nama} onChange={e=>setFormData({...formData, nama:e.target.value})} className="w-full px-3 py-2 border rounded-lg" required={editType==='anak'}/></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">NIS</label><input value={formData.nis} onChange={e=>setFormData({...formData, nis:e.target.value})} className="w-full px-3 py-2 border rounded-lg" required={editType==='anak'}/></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label><input value={formData.kelas} onChange={e=>setFormData({...formData, kelas:e.target.value})} className="w-full px-3 py-2 border rounded-lg" required={editType==='anak'}/></div>
              </div>
            )}

            <div className="flex gap-3">
              {editId && (
                <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-200">
                  Batal Edit
                </button>
              )}
              <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700">
                {editId ? 'Simpan Perubahan' : 'Simpan Data'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari santri/kelompok..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-xl bg-gray-50 outline-none text-sm"/>
        </div>
        {isAdmin && selectedIds.size > 0 && (
          <button onClick={deleteSelected} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-200"><Trash2 size={16}/> Hapus ({selectedIds.size})</button>
        )}
      </div>

      <div className="space-y-4">
        {asrama.filter(a => a.nama_asrama.toLowerCase().includes(search.toLowerCase()) || anak.some(an => an.asrama === a.nama_asrama && an.nama_anak.toLowerCase().includes(search.toLowerCase()))).map(a => {
          const santri = anak.filter(an => an.asrama === a.nama_asrama && (search === '' || an.nama_anak.toLowerCase().includes(search.toLowerCase()) || a.nama_asrama.toLowerCase().includes(search.toLowerCase())));
          return (
            <div key={a.id} className="border border-gray-200 rounded-2xl p-5 shadow-sm group/asrama">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  {isAdmin && <input type="checkbox" checked={selectedIds.has(a.id)} onChange={()=>toggleSelect(a.id)} className="w-5 h-5 text-emerald-600 rounded cursor-pointer" />}
                  <div>
                    <div className="font-bold text-lg text-emerald-800">{a.nama_asrama}</div>
                    <div className="text-xs text-gray-500">👨‍🏫 {a.nama_pembimbing}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-100">{santri.length} Santri</div>
                  {isAdmin && (
                    <button onClick={() => handleEdit(a, 'asrama')} className="hidden group-hover/asrama:block text-blue-500 bg-blue-50 p-1.5 rounded-lg border border-blue-100 hover:bg-blue-100" title="Edit Grup / Kelompok">
                      <Edit2 size={16}/>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 pl-8 md:pl-0">
                {santri.map(s => (
                  <div key={s.id} className="bg-gray-50 px-3 py-2 rounded-xl flex items-center justify-between border border-transparent hover:border-emerald-200 group">
                    <div className="flex items-center gap-3">
                      {isAdmin && <input type="checkbox" checked={selectedIds.has(s.id)} onChange={()=>toggleSelect(s.id)} className="w-4 h-4 cursor-pointer" />}
                      <div><div className="text-sm font-bold text-gray-700">{s.nama_anak}</div><div className="text-[10px] text-gray-400">NIS: {s.nis} • Kls {s.kelas}</div></div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>handleEdit(s, 'anak')} className="text-blue-500 p-1.5 hover:bg-blue-100 rounded" title="Edit Data Santri"><Edit2 size={14}/></button>
                        <button onClick={()=>triggerDelete(s.id, `Hapus ${s.nama_anak}?`)} className="text-red-400 p-1.5 hover:bg-red-100 rounded"><Trash2 size={14}/></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AbsensiView({ allData, handleSaveData, editItem, setEditItem, showToast }) {
  const [form, setForm] = useState({
    asrama: '', nama_anak: '', tanggal: new Date().toISOString().split('T')[0],
    hadir: 'Hadir', subuh: 'Tidak', zuhur: 'Tidak', asar: 'Tidak', maghrib: 'Tidak', isya: 'Tidak',
    tahajud: 'Tidak', sunnah_rawatib: 'Tidak', zikir_pagi: 'Tidak', zikir_petang: 'Tidak',
    catatan_pembimbing: '', foto: null
  });

  const asramaList = allData.filter(d => d.type === 'asrama');
  const anakList = allData.filter(d => d.type === 'anak');
  const pembimbing = asramaList.find(a => a.nama_asrama === form.asrama)?.nama_pembimbing || '-';
  const filteredAnak = anakList.filter(a => form.asrama ? a.asrama === form.asrama : true);

  // Mencegah error "Maximum update depth exceeded" akibat pembaruan asrama berulang
  useEffect(() => {
    if (editItem && editItem.type === 'absensi') {
      const matchAnak = anakList.find(a => a.nama_anak === editItem.nama_anak);
      setForm(prev => {
        const asramaToSet = matchAnak ? matchAnak.asrama : editItem.asrama;
        // Hanya update state jika nilai benar-benar berubah
        if (prev.asrama !== asramaToSet || prev.id !== editItem.id) {
            return { ...editItem, asrama: asramaToSet };
        }
        return prev;
      });
    }
  }, [editItem, anakList]);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let w = img.width, h = img.height;
          if(w > h && w > MAX_SIZE) { h *= MAX_SIZE/w; w = MAX_SIZE; }
          else if(h > MAX_SIZE) { w *= MAX_SIZE/h; h = MAX_SIZE; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFoto = async (e) => {
    const file = e.target.files[0];
    if(file && file.type.startsWith('image/')) {
      const compressed = await compressImage(file);
      setForm({...form, foto: compressed});
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if(!form.nama_anak) return showToast('Pilih Santri terlebih dahulu!', 'error');
    
    const isDuplicate = allData.some(d => 
      d.type === 'absensi' && 
      d.nama_anak === form.nama_anak && 
      d.tanggal === form.tanggal && 
      (!editItem || d.id !== editItem.id) 
    );

    if (isDuplicate) {
      return showToast(`Data Ibadah untuk ${form.nama_anak} di tanggal ${form.tanggal} sudah ada!`, 'error');
    }
    
    const actualAsrama = anakList.find(a => a.nama_anak === form.nama_anak)?.asrama || form.asrama;
    const payload = { type: 'absensi', ...form, asrama: actualAsrama };
    delete payload.id; 

    await handleSaveData(payload, editItem?.id);
    showToast('Ceklis ibadah berhasil disimpan!');
    setEditItem(null);
    setForm({
      asrama: '', nama_anak: '', tanggal: new Date().toISOString().split('T')[0],
      hadir: 'Hadir', subuh: 'Tidak', zuhur: 'Tidak', asar: 'Tidak', maghrib: 'Tidak', isya: 'Tidak',
      tahajud: 'Tidak', sunnah_rawatib: 'Tidak', zikir_pagi: 'Tidak', zikir_petang: 'Tidak',
      catatan_pembimbing: '', foto: null
    });
  };

  const RadioGroup = ({ name, label }) => (
    <div className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <div className="flex gap-1.5">
        <label className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${form[name] === 'Ya' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
          <input type="radio" className="hidden" checked={form[name]==='Ya'} onChange={()=>setForm({...form, [name]: 'Ya'})}/> Ya
        </label>
        <label className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${form[name] === 'Tidak' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
          <input type="radio" className="hidden" checked={form[name]==='Tidak'} onChange={()=>setForm({...form, [name]: 'Tidak'})}/> Tidak
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-2"><CheckSquare/> Ceklis Ibadah</h2>
          {editItem && <button onClick={()=>setEditItem(null)} className="text-sm bg-gray-100 px-3 py-1.5 rounded-xl font-bold text-gray-600">Batal Edit</button>}
        </div>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Filter Kelompok</label>
              <select value={form.asrama} onChange={e=>setForm({...form, asrama: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none">
                <option value="">Semua Kelompok</option>
                {asramaList.map(a => <option key={a.id} value={a.nama_asrama}>{a.nama_asrama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Pembimbing</label>
              <div className="px-4 py-2.5 bg-gray-100/50 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm">{pembimbing}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Pilih Santri</label>
              <select value={form.nama_anak} onChange={e=>setForm({...form, nama_anak: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none font-bold text-emerald-700" required>
                <option value="">-- Pilih Santri --</option>
                {filteredAnak.map(a => <option key={a.id} value={a.nama_anak}>{a.nama_anak}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
              <input type="date" value={form.tanggal} onChange={e=>setForm({...form, tanggal: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none" required/>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <div className="flex gap-4">
              <label className={`flex-1 text-center py-3 rounded-xl font-bold cursor-pointer transition-all border-2 ${form.hadir==='Hadir' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'border-transparent text-gray-500'}`}><input type="radio" className="hidden" checked={form.hadir==='Hadir'} onChange={()=>setForm({...form, hadir:'Hadir'})}/> ✅ Hadir</label>
              <label className={`flex-1 text-center py-3 rounded-xl font-bold cursor-pointer transition-all border-2 ${form.hadir==='Tidak Hadir' ? 'bg-white border-red-500 text-red-600 shadow-sm' : 'border-transparent text-gray-500'}`}><input type="radio" className="hidden" checked={form.hadir==='Tidak Hadir'} onChange={()=>setForm({...form, hadir:'Tidak Hadir'})}/> ❌ Izin/Absen</label>
            </div>
          </div>

          <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
            <h3 className="font-bold text-emerald-800 text-sm mb-3">Shalat Wajib & Sunnah</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <RadioGroup name="subuh" label="Subuh" />
              <RadioGroup name="zuhur" label="Zuhur" />
              <RadioGroup name="asar" label="Asar" />
              <RadioGroup name="maghrib" label="Maghrib" />
              <RadioGroup name="isya" label="Isya" />
              <RadioGroup name="tahajud" label="Tahajud" />
              <div className="md:col-span-2"><RadioGroup name="sunnah_rawatib" label="Sunnah Rawatib" /></div>
            </div>
          </div>

          <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100 grid md:grid-cols-2 gap-3">
             <RadioGroup name="zikir_pagi" label="Al-Ma'tsurat Pagi" />
             <RadioGroup name="zikir_petang" label="Al-Ma'tsurat Petang" />
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 border-dashed">
            <label className="block font-bold text-gray-700 mb-2 flex items-center gap-2"><ImageIcon size={18}/> Foto Dokumentasi</label>
            <input type="file" accept="image/*" onChange={handleFoto} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 mb-2 w-full"/>
            {form.foto && (
              <div className="relative w-fit mt-2">
                <img src={form.foto} alt="Preview" className="h-32 rounded-xl object-cover border-2 border-emerald-200 shadow-md"/>
                <button type="button" onClick={()=>setForm({...form, foto: null})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"><X size={14}/></button>
              </div>
            )}
          </div>

          <div><textarea value={form.catatan_pembimbing} onChange={e=>setForm({...form, catatan_pembimbing: e.target.value})} placeholder="Catatan khusus..." rows="2" className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm"></textarea></div>

          <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2">
            <Save size={20} /> {editItem ? 'Update Evaluasi' : 'Simpan Evaluasi'}
          </button>
        </form>
      </div>
    </div>
  )
}

function QuranView({ allData, handleSaveData, editItem, setEditItem, showToast }) {
  const [form, setForm] = useState({
    asrama: '', nama_anak: '', tanggal: new Date().toISOString().split('T')[0],
    tilawah: '', hafalan: '', doa: '', kelancaran: 'Lancar', catatan_quran: ''
  });

  const anakList = allData.filter(d => d.type === 'anak');
  const asramaList = allData.filter(d => d.type === 'asrama');
  const filteredAnak = anakList.filter(a => form.asrama ? a.asrama === form.asrama : true);

  // Mencegah error "Maximum update depth exceeded" akibat loop render yang tidak terhingga
  useEffect(() => {
    if (editItem && editItem.type === 'quran') {
      const matchAnak = anakList.find(a => a.nama_anak === editItem.nama_anak);
      setForm(prev => {
        const asramaToSet = matchAnak ? matchAnak.asrama : editItem.asrama;
        // Hanya update state form jika data memang belum disesuaikan dengan item yang mau diedit
        if (prev.asrama !== asramaToSet || prev.id !== editItem.id) {
            return { ...editItem, asrama: asramaToSet };
        }
        return prev;
      });
    }
  }, [editItem, anakList]);

  const handleSave = async (e) => {
    e.preventDefault();
    if(!form.nama_anak) return showToast('Pilih Santri terlebih dahulu!', 'error');
    
    const isDuplicate = allData.some(d => 
      d.type === 'quran' && 
      d.nama_anak === form.nama_anak && 
      d.tanggal === form.tanggal && 
      (!editItem || d.id !== editItem.id)
    );

    if (isDuplicate) {
      return showToast(`Data Al-Quran untuk ${form.nama_anak} di tanggal ${form.tanggal} sudah ada!`, 'error');
    }
    
    const payload = { type: 'quran', ...form };
    delete payload.asrama; 
    delete payload.id;

    await handleSaveData(payload, editItem?.id);
    showToast('Data hafalan & tilawah disimpan!');
    setEditItem(null);
    setForm({
      asrama: '', nama_anak: '', tanggal: new Date().toISOString().split('T')[0],
      tilawah: '', hafalan: '', doa: '', kelancaran: 'Lancar', catatan_quran: ''
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-cyan-700 flex items-center gap-2"><BookOpen/> Laporan Al-Quran & Doa</h2>
          {editItem && <button onClick={()=>setEditItem(null)} className="text-sm bg-gray-100 px-3 py-1.5 rounded-xl font-bold text-gray-600">Batal Edit</button>}
        </div>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-cyan-50/50 p-4 rounded-2xl border border-cyan-100 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Filter Kelompok</label>
              <select value={form.asrama} onChange={e=>setForm({...form, asrama: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none">
                <option value="">Semua Kelompok</option>
                {asramaList.map(a => <option key={a.id} value={a.nama_asrama}>{a.nama_asrama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Pilih Santri</label>
              <select value={form.nama_anak} onChange={e=>setForm({...form, nama_anak: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none font-bold text-cyan-700" required>
                <option value="">-- Pilih Santri --</option>
                {filteredAnak.map(a => <option key={a.id} value={a.nama_anak}>{a.nama_anak}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal Kegiatan</label>
              <input type="date" value={form.tanggal} onChange={e=>setForm({...form, tanggal: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none" required/>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <label className="block font-bold text-gray-800 text-sm mb-2">Capaian Tilawah</label>
              <input type="text" value={form.tilawah} onChange={e=>setForm({...form, tilawah: e.target.value})} placeholder="Misal: Juz 30 Hal 1-5" className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-cyan-500" required/>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <label className="block font-bold text-gray-800 text-sm mb-2">Setoran Hafalan Quran (Ziyadah / Muroja'ah)</label>
              <input type="text" value={form.hafalan} onChange={e=>setForm({...form, hafalan: e.target.value})} placeholder="Misal: An-Naba Ayat 1-20" className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-cyan-500" required/>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <label className="block font-bold text-gray-800 text-sm mb-2">Setoran Doa Harian / Hadits</label>
              <input type="text" value={form.doa} onChange={e=>setForm({...form, doa: e.target.value})} placeholder="Misal: Doa Masuk Masjid / Hadits Niat" className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-cyan-500" required/>
              
              <div className="mt-4">
                <label className="block font-bold text-gray-600 text-xs uppercase mb-2">Predikat Kelancaran Keseluruhan</label>
                <div className="flex gap-2">
                  {['Lancar', 'Kurang Lancar', 'Belum Setor'].map(val => (
                    <label key={val} className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold cursor-pointer border-2 transition-all active:scale-95 ${form.kelancaran === val ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 bg-white text-gray-500'}`}>
                      <input type="radio" className="hidden" checked={form.kelancaran === val} onChange={()=>setForm({...form, kelancaran: val})}/>
                      {val}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div><textarea value={form.catatan_quran} onChange={e=>setForm({...form, catatan_quran: e.target.value})} placeholder="Catatan asatidz (Misal: Perlu perbaiki makhroj)..." rows="2" className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm"></textarea></div>

          <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2">
            <Save size={20} /> {editItem ? 'Update Data Quran & Doa' : 'Simpan Data Quran & Doa'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PenilaianView({ allData, handleSaveData, editItem, setEditItem, showToast }) {
  const [form, setForm] = useState({
    asrama: '', nama_anak: '', tanggal: new Date().toISOString().split('T')[0],
    kerapian: 'Cukup', disiplin: 'Cukup', tanggung_jawab: 'Cukup', kemandirian_pribadi: 'Cukup',
    catatan_tambahan: ''
  });

  const anakList = allData.filter(d => d.type === 'anak');
  const asramaList = allData.filter(d => d.type === 'asrama');
  const filteredAnak = anakList.filter(a => form.asrama ? a.asrama === form.asrama : true);

  // Mencegah error "Maximum update depth exceeded"
  useEffect(() => {
    if (editItem && editItem.type === 'penilaian') {
      const matchAnak = anakList.find(a => a.nama_anak === editItem.nama_anak);
      setForm(prev => {
        const asramaToSet = matchAnak ? matchAnak.asrama : editItem.asrama;
        // Hanya update state form jika data memang belum disesuaikan dengan item yang mau diedit
        if (prev.asrama !== asramaToSet || prev.id !== editItem.id) {
            return { ...editItem, asrama: asramaToSet };
        }
        return prev;
      });
    }
  }, [editItem, anakList]);

  const handleSave = async (e) => {
    e.preventDefault();
    if(!form.nama_anak) return showToast('Pilih Santri terlebih dahulu!', 'error');
    
    const isDuplicate = allData.some(d => 
      d.type === 'penilaian' && 
      d.nama_anak === form.nama_anak && 
      d.tanggal === form.tanggal && 
      (!editItem || d.id !== editItem.id)
    );

    if (isDuplicate) {
      return showToast(`Evaluasi Nilai untuk ${form.nama_anak} di tanggal ${form.tanggal} sudah ada!`, 'error');
    }
    
    const payload = { type: 'penilaian', ...form };
    delete payload.asrama; 
    delete payload.id;

    await handleSaveData(payload, editItem?.id);
    showToast('Nilai kemandirian disimpan!');
    setEditItem(null);
    setForm({
      asrama: '', nama_anak: '', tanggal: new Date().toISOString().split('T')[0],
      kerapian: 'Cukup', disiplin: 'Cukup', tanggung_jawab: 'Cukup', kemandirian_pribadi: 'Cukup',
      catatan_tambahan: ''
    });
  };

  const OptionBtn = ({ name, val }) => {
    const isSelected = form[name] === val;
    const colors = {
      'Baik': 'border-emerald-600 bg-emerald-50 text-emerald-700',
      'Cukup': 'border-blue-500 bg-blue-50 text-blue-700',
      'Perlu Bimbingan': 'border-orange-500 bg-orange-50 text-orange-700',
    };
    return (
      <label className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold cursor-pointer border-2 transition-all active:scale-95 ${isSelected ? colors[val] : 'border-gray-200 bg-white text-gray-500'}`}>
        <input type="radio" className="hidden" checked={isSelected} onChange={()=>setForm({...form, [name]: val})}/>
        {val}
      </label>
    );
  };

  const RubrikGroup = ({ title, name }) => (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
      <h3 className="font-bold text-gray-800 text-sm mb-3">{title}</h3>
      <div className="flex gap-2">
        <OptionBtn name={name} val="Baik" />
        <OptionBtn name={name} val="Cukup" />
        <OptionBtn name={name} val="Perlu Bimbingan" />
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-indigo-800 flex items-center gap-2"><Star/> Evaluasi Kemandirian</h2>
          {editItem && <button onClick={()=>setEditItem(null)} className="text-sm bg-gray-100 px-3 py-1.5 rounded-xl font-bold text-gray-600">Batal Edit</button>}
        </div>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Filter Kelompok</label>
              <select value={form.asrama} onChange={e=>setForm({...form, asrama: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none">
                <option value="">Semua Kelompok</option>
                {asramaList.map(a => <option key={a.id} value={a.nama_asrama}>{a.nama_asrama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Pilih Santri</label>
              <select value={form.nama_anak} onChange={e=>setForm({...form, nama_anak: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none font-bold text-indigo-700" required>
                <option value="">-- Pilih Santri --</option>
                {filteredAnak.map(a => <option key={a.id} value={a.nama_anak}>{a.nama_anak}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
              <input type="date" value={form.tanggal} onChange={e=>setForm({...form, tanggal: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none" required/>
            </div>
          </div>

          <div className="space-y-4">
            <RubrikGroup title="1. Kerapian Diri & Tempat" name="kerapian" />
            <RubrikGroup title="2. Kedisiplinan Waktu" name="disiplin" />
            <RubrikGroup title="3. Tanggung Jawab Kelompok" name="tanggung_jawab" />
            <RubrikGroup title="4. Inisiatif Pribadi" name="kemandirian_pribadi" />
          </div>

          <div><textarea value={form.catatan_tambahan} onChange={e=>setForm({...form, catatan_tambahan: e.target.value})} placeholder="Catatan observasi khusus..." rows="2" className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm"></textarea></div>

          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2">
            <Save size={20} /> {editItem ? 'Update Penilaian' : 'Simpan Penilaian'}
          </button>
        </form>
      </div>
    </div>
  )
}

function RekapView({ allData, setEditItem, setActiveTab, triggerDelete, resetPekanan, isAdmin }) {
  const [filterAnak, setFilterAnak] = useState('');
  const [filterTgl, setFilterTgl] = useState('');
  
  const absensi = allData.filter(d => d.type === 'absensi');
  const penilaian = allData.filter(d => d.type === 'penilaian');
  const quran = allData.filter(d => d.type === 'quran');
  const anakNames = [...new Set([...absensi.map(a=>a.nama_anak), ...penilaian.map(p=>p.nama_anak), ...quran.map(q=>q.nama_anak)])];

  const handleEdit = (item) => {
    setEditItem(item);
    setActiveTab(item.type);
  };

  const getFiltered = () => {
    let raw = [...absensi, ...penilaian, ...quran].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    if(filterAnak) raw = raw.filter(r => r.nama_anak === filterAnak);
    if(filterTgl) raw = raw.filter(r => r.tanggal === filterTgl);
    return raw;
  };

  const list = getFiltered();

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-blue-600"/> Riwayat Input Harian</h2>
        {isAdmin && <button onClick={resetPekanan} className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 shadow-sm flex items-center gap-2 w-fit"><Trash2 size={16}/> Bersihkan Rekap Pekan Ini</button>}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Santri</label>
          <select value={filterAnak} onChange={e=>setFilterAnak(e.target.value)} className="w-full p-2 border rounded-xl bg-white text-sm">
            <option value="">Semua Santri</option>
            {anakNames.map((n,i) => <option key={i} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Tanggal</label>
          <input type="date" value={filterTgl} onChange={e=>setFilterTgl(e.target.value)} className="w-full p-2 border rounded-xl bg-white text-sm" />
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-4 rounded-tl-2xl">Santri</th>
              <th className="px-4 py-4">Tanggal</th>
              <th className="px-4 py-4">Tipe Data</th>
              <th className="px-4 py-4 text-center rounded-tr-2xl">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.length === 0 ? (
               <tr><td colSpan="4" className="text-center py-8 text-gray-400 italic bg-gray-50/50">Belum ada riwayat data / Tidak sesuai filter.</td></tr>
            ) : list.map(item => (
               <tr key={item.id} className={`transition-colors ${item.type==='absensi' ? 'hover:bg-emerald-50/50' : item.type==='quran' ? 'hover:bg-cyan-50/50' : 'hover:bg-indigo-50/50'}`}>
                 <td className="px-4 py-3 font-semibold text-gray-800">{item.nama_anak} <span className="block text-[10px] text-gray-400 font-normal">{item.asrama || '-'}</span></td>
                 <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</td>
                 <td className="px-4 py-3">
                   <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${item.type==='absensi' ? 'bg-emerald-100 text-emerald-700' : item.type==='quran' ? 'bg-cyan-100 text-cyan-700' : 'bg-indigo-100 text-indigo-700'}`}>
                     {item.type==='absensi' ? 'Ibadah' : item.type==='quran' ? 'Quran/Doa' : 'Mandiri'}
                   </span>
                 </td>
                 <td className="px-4 py-3 text-center">
                   <div className="flex justify-center gap-1">
                     <button onClick={()=>handleEdit(item)} className="text-blue-500 bg-blue-50 p-1.5 rounded border border-blue-100 hover:bg-blue-100"><Edit2 size={14}/></button>
                     {isAdmin && <button onClick={()=>triggerDelete(item.id, "Hapus riwayat ini?")} className="text-red-500 bg-red-50 p-1.5 rounded border border-red-100 hover:bg-red-100"><Trash2 size={14}/></button>}
                   </div>
                 </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RaporView({ allData, resetPekanan, isAdmin, showToast }) {
  const [filterKelas, setFilterKelas] = useState('');
  const [filterTgl, setFilterTgl] = useState('');
  
  const kelasList = [...new Set(allData.filter(d=>d.type==='anak').map(a=>a.kelas).filter(Boolean))].sort();

  const results = useMemo(() => {
    const anakListNames = allData.filter(d => d.type === 'anak').map(a => a.nama_anak);
    let anakList = allData.filter(d => d.type === 'anak');
    if (filterKelas) anakList = anakList.filter(a => a.kelas === filterKelas);

    let absensiList = allData.filter(d => d.type === 'absensi' && anakListNames.includes(d.nama_anak));
    let penilaianList = allData.filter(d => d.type === 'penilaian' && anakListNames.includes(d.nama_anak));
    
    if (filterTgl) {
      absensiList = absensiList.filter(a => a.tanggal === filterTgl);
      penilaianList = penilaianList.filter(p => p.tanggal === filterTgl);
    }

    return anakList.map(anak => {
      const aList = absensiList.filter(a => a.nama_anak === anak.nama_anak);
      const pList = penilaianList.filter(p => p.nama_anak === anak.nama_anak);
      const qList = allData.filter(d => d.type === 'quran' && d.nama_anak === anak.nama_anak && (!filterTgl || d.tanggal === filterTgl));
      const asramaData = allData.find(d => d.type === 'asrama' && d.nama_asrama === anak.asrama);
      const pembimbing = asramaData ? asramaData.nama_pembimbing : '-';

      if (!aList.length && !pList.length && !qList.length) return { ...anak, pembimbing, hasData: false, totalNilai: -1 };

      const hadirCount = aList.filter(a => a.hadir === 'Hadir').length;
      const nilaiHadir = aList.length ? ((hadirCount / aList.length) * 100 * 0.2) : 0; 

      let ibadahCount = 0;
      aList.forEach(a => {
          ['subuh','zuhur','asar','maghrib','isya','tahajud','sunnah_rawatib','zikir_pagi','zikir_petang'].forEach(k => {
              if (a[k] === 'Ya') ibadahCount++;
          });
      });
      const nilaiIbadah = aList.length ? ((ibadahCount / (aList.length * 9)) * 100 * 0.3) : 0; 

      let quranScore = 0;
      qList.forEach(q => {
          const sk = {'Lancar':100, 'Kurang Lancar':70, 'Belum Setor':40};
          quranScore += (sk[q.kelancaran] || 0);
      });
      const nilaiQuran = qList.length ? ((quranScore / (qList.length * 100)) * 100 * 0.3) : 0; 

      let mandiriScore = 0;
      pList.forEach(p => {
          const sk = {'Baik':100, 'Cukup':70, 'Perlu Bimbingan':40};
          mandiriScore += (sk[p.kerapian]||0) + (sk[p.disiplin]||0) + (sk[p.tanggung_jawab]||0) + (sk[p.kemandirian_pribadi]||0);
      });
      const nilaiMandiri = pList.length ? ((mandiriScore / (pList.length * 400)) * 100 * 0.2) : 0; 

      const totalNilai = Math.round(nilaiHadir + nilaiIbadah + nilaiQuran + nilaiMandiri);
      let grade = 'C', color = 'text-orange-600 bg-orange-50 border-orange-200';
      if(totalNilai >= 85) { grade = 'A'; color = 'text-emerald-700 bg-emerald-50 border-emerald-200'; }
      else if(totalNilai >= 70) { grade = 'B'; color = 'text-blue-700 bg-blue-50 border-blue-200'; }

      return {
        ...anak, pembimbing, hasData: true, totalNilai, grade, color,
        skorHadir: Math.round(nilaiHadir/0.2), skorIbadah: Math.round(nilaiIbadah/0.3), skorQuran: Math.round(nilaiQuran/0.3), skorMandiri: Math.round(nilaiMandiri/0.2)
      };
    }).sort((a,b) => b.totalNilai - a.totalNilai);
  }, [allData, filterKelas, filterTgl]);

  const shareWA = () => {
    if(!results.length) return showToast('Belum ada data!', 'error');
    const tglStr = filterTgl ? new Date(filterTgl).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let text = `🏆 *REKAP NILAI MONDOK PEKANAN SDIT AL HANIF* 🏆\n📅 Tanggal: ${tglStr}\n${filterKelas ? `🏫 Kelas: ${filterKelas}\n` : ''}\n`;
    
    results.forEach((r, i) => {
        text += `${i+1}. *${r.nama_anak}* (Kls ${r.kelas || '-'} | ${r.asrama})\n   ↳ Pendamping: ${r.pembimbing}\n`;
        if(r.hasData) text += `   ↳ Skor: ${r.totalNilai}/100 | Grade ${r.grade}\n`;
        else text += `   ↳ Belum ada evaluasi masuk\n`;
    });
    text += "\n_Terima kasih atas partisipasi dan antusiasme santri-santri hebat!_";

    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('Teks berhasil disalin! Silakan Paste di WA.');
  };

  const cetakPDF = () => {
    if(!window.html2pdf) return showToast('Modul PDF belum siap', 'error');
    const el = document.getElementById('print-area');
    document.getElementById('print-header').style.display = 'block';
    
    html2pdf().set({
        margin: 0.4, filename: 'Rapor_Mondok_SDIT_AlHanif.pdf', image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    }).from(el).save().then(() => {
        document.getElementById('print-header').style.display = 'none';
        showToast('PDF berhasil diunduh!');
    });
  };

  const unduhExcel = () => {
    if(!results.length) return showToast('Belum ada data untuk diunduh!', 'error');
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Peringkat;Nama Santri;NIS;Kelas;Kelompok Asrama;Pembimbing;Skor Kehadiran (20%);Skor Ibadah (30%);Skor Quran (30%);Skor Mandiri (20%);Total Nilai Akhir;Grade/Predikat\n";
    
    results.forEach((r, index) => {
      const peringkat = index + 1;
      const nama = r.nama_anak;
      const nis = r.nis || '-';
      const kelas = r.kelas || '-';
      const asrama = r.asrama || '-';
      const pembimbing = r.pembimbing || '-';
      const skorHadir = r.hasData ? r.skorHadir : '0';
      const skorIbadah = r.hasData ? r.skorIbadah : '0';
      const skorQuran = r.hasData ? r.skorQuran : '0';
      const skorMandiri = r.hasData ? r.skorMandiri : '0';
      const total = r.hasData ? r.totalNilai : '0';
      const grade = r.hasData ? r.grade : '-';
      
      const baris = `${peringkat};${nama};${nis};${kelas};${asrama};${pembimbing};${skorHadir};${skorIbadah};${skorQuran};${skorMandiri};${total};${grade}\n`;
      csvContent += baris;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const tglFile = filterTgl ? filterTgl : 'Semua';
    link.setAttribute("download", `Rekap_Rapor_Mondok_${tglFile}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('File Excel berhasil diunduh!', 'success');
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-amber-600 flex items-center gap-2"><Trophy/> Papan Peringkat Akhir</h2>
        <div className="flex flex-wrap gap-2">
          {isAdmin && <button onClick={resetPekanan} className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold border border-red-200">🔄 Reset</button>}
          <button onClick={shareWA} className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-indigo-200 transition-colors"><Share2 size={14}/> Salin WA</button>
          <button onClick={unduhExcel} className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-200 transition-colors"><FileText size={14}/> Unduh Excel</button>
          <button onClick={cetakPDF} className="bg-amber-100 text-amber-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-amber-200 transition-colors"><Download size={14}/> Cetak PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Kelas</label>
          <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} className="w-full p-2 border rounded-xl bg-white text-sm">
            <option value="">Semua Kelas</option>
            {kelasList.map((k,i) => <option key={i} value={k}>Kelas {k}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Tgl Penilaian</label>
          <input type="date" value={filterTgl} onChange={e=>setFilterTgl(e.target.value)} className="w-full p-2 border rounded-xl bg-white text-sm" />
        </div>
      </div>

      <div id="print-area" className="bg-white">
        <div id="print-header" style={{display:'none'}} className="text-center mb-6 pb-4 border-b-2 border-emerald-500">
          <h2 className="text-2xl font-black text-emerald-800 uppercase tracking-wider">Rapor Mondok Pekanan SDIT Al Hanif</h2>
          <p className="text-gray-600 font-semibold mt-1">Periode: {filterTgl ? new Date(filterTgl).toLocaleDateString('id-ID') : 'Keseluruhan'}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-100 p-2 md:p-3 rounded-2xl flex items-center justify-center gap-2"><div className="text-xl">🏆</div><div><div className="font-bold text-emerald-800 text-xs md:text-sm">Grade A</div><div className="text-[9px] md:text-[10px] text-emerald-600">85-100</div></div></div>
          <div className="bg-blue-50 border border-blue-100 p-2 md:p-3 rounded-2xl flex items-center justify-center gap-2"><div className="text-xl">⭐</div><div><div className="font-bold text-blue-800 text-xs md:text-sm">Grade B</div><div className="text-[9px] md:text-[10px] text-blue-600">70-84</div></div></div>
          <div className="bg-orange-50 border border-orange-100 p-2 md:p-3 rounded-2xl flex items-center justify-center gap-2"><div className="text-xl">📝</div><div><div className="font-bold text-orange-800 text-xs md:text-sm">Grade C</div><div className="text-[9px] md:text-[10px] text-orange-600">0-69</div></div></div>
        </div>

        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-2xl text-gray-400 italic border border-dashed border-gray-200">Belum ada data.</div>
          ) : results.map((r, i) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 shrink-0 rounded-full font-black flex items-center justify-center text-sm ${i === 0 ? 'bg-amber-400 text-white shadow-md' : i===1 ? 'bg-gray-300 text-white shadow-md' : i===2 ? 'bg-amber-700 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                  {i+1}
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm md:text-base leading-tight">{r.nama_anak}</div>
                  <div className="text-[10px] text-gray-500 font-medium">Kls {r.kelas} • {r.asrama} • <span className="text-emerald-600 font-bold">Pendamping: {r.pembimbing}</span></div>
                </div>
              </div>
              {r.hasData ? (
                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 ml-12 md:ml-0 bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-xl overflow-x-auto">
                  <div className="flex gap-2 md:gap-4 text-[9px] md:text-[10px] text-center mr-2 md:mr-4 text-gray-400 font-bold uppercase min-w-max">
                    <div title="Bobot 20%">Hadir<br/><span className="text-gray-800 text-sm">{r.skorHadir}</span></div>
                    <div title="Bobot 30%">Ibadah<br/><span className="text-gray-800 text-sm">{r.skorIbadah}</span></div>
                    <div title="Bobot 30%">Quran<br/><span className="text-gray-800 text-sm">{r.skorQuran}</span></div>
                    <div title="Bobot 20%">Mandiri<br/><span className="text-gray-800 text-sm">{r.skorMandiri}</span></div>
                  </div>
                  <div className="text-right border-l md:border-l-0 border-gray-200 pl-3 md:pl-0 shrink-0">
                    <div className="text-xs text-gray-400 font-bold uppercase mb-0.5 hidden md:block">Total</div>
                    <div className="text-xl md:text-2xl font-black text-gray-800 leading-none">{r.totalNilai}</div>
                  </div>
                  <div className={`px-2 py-1.5 rounded-xl border font-black text-sm w-10 text-center ml-2 shrink-0 ${r.color}`}>
                    {r.grade}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1 rounded-lg ml-12 md:ml-0 w-fit shrink-0">Belum dinilai</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GaleriView({ allData }) {
  const [fAsrama, setFAsrama] = useState('');
  const [fPendamping, setFPendamping] = useState('');

  const asramaList = allData.filter(d => d.type === 'asrama');
  const uniquePendamping = [...new Set(asramaList.map(a=>a.nama_pembimbing).filter(Boolean))].sort();
  const fotos = allData.filter(a => a.type === 'absensi' && a.foto).sort((a,b)=>new Date(b.tanggal)-new Date(a.tanggal));

  const filteredFotos = fotos.filter(f => {
      const matchAsrama = asramaList.find(a => a.nama_asrama === f.asrama);
      const pend = matchAsrama ? matchAsrama.nama_pembimbing : '-';
      if(fAsrama && f.asrama !== fAsrama) return false;
      if(fPendamping && pend !== fPendamping) return false;
      return true;
  });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-8">
      <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center gap-2"><ImageIcon/> Galeri Dokumentasi</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Kelompok</label>
          <select value={fAsrama} onChange={e=>setFAsrama(e.target.value)} className="w-full p-2 border rounded-xl bg-white text-sm">
            <option value="">Semua</option>
            {asramaList.map((k,i) => <option key={i} value={k.nama_asrama}>{k.nama_asrama}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Pendamping</label>
          <select value={fPendamping} onChange={e=>setFPendamping(e.target.value)} className="w-full p-2 border rounded-xl bg-white text-sm">
            <option value="">Semua</option>
            {uniquePendamping.map((k,i) => <option key={i} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {filteredFotos.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
          <ImageIcon className="mx-auto text-gray-300 mb-3" size={48}/>
          <p className="text-gray-500 font-medium text-sm">Belum ada foto dokumentasi sesuai filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFotos.map((f, i) => {
            const pend = asramaList.find(a=>a.nama_asrama === f.asrama)?.nama_pembimbing || '-';
            return (
            <div key={i} className="relative group overflow-hidden rounded-2xl aspect-square bg-gray-100 border border-gray-200 shadow-sm">
              <img src={f.foto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Dokumentasi"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <span className="text-white text-xs font-bold truncate leading-tight">{f.nama_anak}</span>
                <span className="text-emerald-300 text-[9px] font-bold mt-0.5">{new Date(f.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</span>
                <span className="text-gray-300 text-[9px] mt-1 border-t border-white/20 pt-1">📍 {f.asrama} ({pend})</span>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

function PortalOrtuView({ allData, handleSaveData, triggerDelete, isAdmin, showToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [childData, setChildData] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [testimoniText, setTestimoniText] = useState('');
  
  const [viewAllAdmin, setViewAllAdmin] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
        setHasSearched(false);
        setChildData(null);
        return;
    }
    
    setHasSearched(true);
    const found = allData.find(d => d.type === 'anak' && (d.nis === searchQuery || d.nama_anak.toLowerCase().includes(searchQuery.toLowerCase())));
    if (found) {
      const asrama = allData.find(a => a.type === 'asrama' && a.nama_asrama === found.asrama);
      const absensi = allData.filter(a => a.type === 'absensi' && a.nama_anak === found.nama_anak);
      const quran = allData.filter(q => q.type === 'quran' && q.nama_anak === found.nama_anak);
      const fotos = absensi.filter(a => a.foto).map(a => a.foto);

      setChildData({
        ...found,
        pembimbing: asrama ? asrama.nama_pembimbing : '-',
        absensiCount: absensi.length,
        latestHafalan: quran.length > 0 ? quran[quran.length-1].hafalan : '-',
        latestDoa: quran.length > 0 ? quran[quran.length-1].doa : '-',
        fotos: fotos
      });
    } else {
      setChildData(null);
    }
  };

  const handleKirimTestimoni = async (e) => {
    e.preventDefault();
    if (!testimoniText.trim()) return showToast('Pesan cerita tidak boleh kosong', 'error');

    await handleSaveData({
      type: 'testimoni',
      nama_anak: childData.nama_anak,
      nis: childData.nis,
      kelas: childData.kelas, 
      isi: testimoniText,
      tanggal: new Date().toISOString().split('T')[0],
      isVisible: true 
    });

    showToast('Terima kasih! Cerita pengalaman Anda berhasil dikirim.', 'success');
    setTestimoniText('');
  };

  const toggleVisibility = async (testi) => {
    const payload = { ...testi, isVisible: testi.isVisible === false ? true : false };
    delete payload.id;
    await handleSaveData(payload, testi.id);
    showToast(payload.isVisible ? 'Testimoni ditampilkan ke publik' : 'Testimoni disembunyikan', 'success');
  };

  const publicTestimonies = allData
    .filter(d => d.type === 'testimoni' && d.isVisible !== false)
    .sort((a,b) => b.createdAt - a.createdAt);

  const riwayatTestimoni = allData
    .filter(d => d.type === 'testimoni' && childData && d.nama_anak === childData.nama_anak)
    .filter(d => isAdmin ? true : d.isVisible !== false)
    .sort((a,b) => b.createdAt - a.createdAt);

  const allTestimonies = allData
    .filter(d => d.type === 'testimoni')
    .sort((a,b) => b.createdAt - a.createdAt);

  const TestimoniCard = ({ testi, showAuthor = false }) => (
    <div className={`p-4 md:p-5 rounded-2xl border shadow-sm text-sm text-gray-700 relative group transition-all duration-300 ${testi.isVisible === false ? 'bg-gray-100/80 border-gray-200 opacity-80' : 'bg-white border-rose-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="text-[10px] md:text-xs text-rose-500 font-bold flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
          <span>{new Date(testi.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
          <span className="text-gray-400 hidden md:inline">•</span>
          <span className="text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
            Oleh: <span className="font-bold text-gray-800">Orang Tua {testi.nama_anak} {testi.kelas ? `(Kelas ${testi.kelas})` : ''}</span>
          </span>
        </div>
        {isAdmin && testi.isVisible === false && (
          <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 shadow-sm">
            Disembunyikan
          </span>
        )}
      </div>
      
      <p className={`italic mt-2 text-sm leading-relaxed ${testi.isVisible === false ? 'text-gray-500' : 'text-gray-800'}`}>"{testi.isi}"</p>

      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100">
           <button onClick={() => toggleVisibility(testi)} title={testi.isVisible === false ? "Tampilkan ke Publik" : "Sembunyikan"} className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600 transition-colors">
             {testi.isVisible === false ? <Eye size={14}/> : <EyeOff size={14}/>}
           </button>
           <button onClick={() => triggerDelete(testi.id, "Yakin ingin menghapus testimoni ini secara permanen?")} title="Hapus" className="p-1.5 hover:bg-red-50 rounded-md text-red-500 transition-colors">
             <Trash2 size={14}/>
           </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2 relative z-10">
          <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-2"><UserCircle/> Portal Orang Tua</h2>
          
          {isAdmin && (
            <button 
              onClick={() => { setViewAllAdmin(!viewAllAdmin); setHasSearched(false); setChildData(null); }} 
              className={`text-[10px] md:text-xs font-bold px-3 py-2 rounded-lg border transition-colors flex items-center gap-1.5 shadow-sm ${viewAllAdmin ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
            >
              {viewAllAdmin ? <X size={14}/> : <Star size={14}/>}
              {viewAllAdmin ? 'Tutup Mode Moderasi' : 'Kelola Semua Testimoni'}
            </button>
          )}
        </div>

        {!viewAllAdmin && (
          <div className="relative z-10">
            <p className="text-gray-500 text-sm mb-6">Pantau perkembangan ananda selama mondok pekanan dengan memasukkan NIS atau Nama Panggilan.</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Masukkan NIS atau Nama Anak..." 
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
              />
              <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 flex items-center gap-2">
                <Search size={18}/> Cari
              </button>
            </form>
          </div>
        )}
      </div>

      {!viewAllAdmin && !hasSearched && (
        <div className="space-y-4 animate-fade-in mt-6">
          <div className="flex items-center gap-2 mb-4 px-2 border-b border-gray-200 pb-3">
            <Heart size={24} className="text-rose-500" fill="currentColor" />
            <h3 className="text-xl font-extrabold text-gray-800">Cerita Inspiratif Orang Tua</h3>
          </div>
          
          {publicTestimonies.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
              Belum ada cerita pengalaman yang dibagikan.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {publicTestimonies.map(testi => <TestimoniCard key={testi.id} testi={testi} showAuthor={true} />)}
            </div>
          )}
        </div>
      )}

      {!viewAllAdmin && hasSearched && childData && (
        <div className="space-y-6 animate-fade-in">
          <button onClick={() => { setHasSearched(false); setSearchQuery(''); }} className="text-sm text-emerald-600 font-bold hover:underline flex items-center gap-1.5 px-2">
             ← Kembali ke Beranda Portal
          </button>
          
          <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner">
                👦
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">{childData.nama_anak}</h3>
                <p className="text-sm font-medium text-gray-500">NIS: {childData.nis} | Kelas {childData.kelas}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Kelompok Mentoring</div>
                <div className="font-bold text-gray-800">{childData.asrama}</div>
                <div className="text-xs text-gray-500 mt-1">Pembimbing: {childData.pembimbing}</div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Capaian Terakhir</div>
                <div className="font-bold text-emerald-800 text-sm truncate">📖 {childData.latestHafalan}</div>
                <div className="font-bold text-emerald-800 text-sm truncate mt-1">🤲 {childData.latestDoa}</div>
              </div>
            </div>

            {childData.fotos.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><ImageIcon size={16}/> Momen Ananda</h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {childData.fotos.map((foto, idx) => (
                    <img key={idx} src={foto} className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm shrink-0" alt={`Momen ${idx+1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 md:p-8 rounded-3xl shadow-sm border border-rose-100">
            <h3 className="text-xl font-bold text-rose-800 mb-2 flex items-center gap-2"><Heart className="text-rose-500" fill="currentColor"/> Cerita & Pengalaman</h3>
            <p className="text-rose-600 text-sm mb-5">Bagaimana perkembangan dan kebiasaan positif ananda setelah pulang mondok? Ceritakan pengalaman terbaik Anda!</p>
            
            <form onSubmit={handleKirimTestimoni}>
              <textarea 
                value={testimoniText}
                onChange={e => setTestimoniText(e.target.value)}
                rows="4"
                placeholder="Misal: Alhamdulillah, semenjak mondok ananda jadi rajin merapikan tempat tidur sendiri dan tilawah sehabis maghrib tanpa disuruh..."
                className="w-full p-4 rounded-2xl border border-rose-200 bg-white/80 outline-none focus:ring-2 focus:ring-rose-400 text-sm mb-3 shadow-inner"
              ></textarea>
              <button type="submit" className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-rose-600 transition-colors w-full flex justify-center items-center gap-2">
                Kirim Cerita
              </button>
            </form>

            {riwayatTestimoni.length > 0 && (
              <div className="mt-8 space-y-3">
                <h4 className="text-sm font-bold text-rose-800 border-b border-rose-200 pb-2">Riwayat Cerita Anda</h4>
                {riwayatTestimoni.map(testi => <TestimoniCard key={testi.id} testi={testi} showAuthor={false} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {!viewAllAdmin && hasSearched && !childData && (
        <div className="text-center p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-gray-500 animate-fade-in">
          <Search size={32} className="mx-auto text-gray-300 mb-3"/>
          <p className="mb-4">Data tidak ditemukan. Pastikan ketikan NIS atau Nama benar.</p>
          <button onClick={() => { setHasSearched(false); setSearchQuery(''); }} className="text-emerald-600 font-bold px-5 py-2.5 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
            Kembali
          </button>
        </div>
      )}

      {isAdmin && viewAllAdmin && (
        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl"><Heart size={20} fill="currentColor"/></div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Manajemen Testimoni</h3>
              <p className="text-xs text-gray-500">Moderasi cerita dari wali murid sebelum ditampilkan jika perlu.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {allTestimonies.length === 0 ? (
              <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Belum ada testimoni yang masuk dari orang tua.
              </div>
            ) : (
              allTestimonies.map(testi => <TestimoniCard key={testi.id} testi={testi} showAuthor={true} />)
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function InfoView({ allData, handleSaveData, triggerDelete, isAdmin, showToast }) {
  const infos = allData.filter(d => d.type === 'pengumuman').sort((a,b) => b.createdAt - a.createdAt);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ judul: '', isi: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    await handleSaveData({ type: 'pengumuman', judul: form.judul, isi: form.isi, tanggal: new Date().toISOString().split('T')[0] });
    showToast('Pengumuman diterbitkan!');
    setModal(false);
    setForm({ judul: '', isi: '' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2"><Bell/> Pusat Informasi</h2>
          <p className="text-gray-500 text-sm mt-1">Pengumuman & Tata Tertib Mondok</p>
        </div>
        {isAdmin && (
          <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm">
            <Plus size={18}/> Buat Info
          </button>
        )}
      </div>

      <div className="space-y-4">
        {infos.length === 0 ? (
          <div className="text-center p-10 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-gray-500">
            <Info className="mx-auto text-gray-300 mb-3" size={48}/>
            Belum ada informasi terbaru.
          </div>
        ) : infos.map(info => (
          <div key={info.id} className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 relative group">
            <div className="text-xs font-bold text-blue-500 mb-2">{new Date(info.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <h3 className="text-lg font-black text-gray-800 mb-2">{info.judul}</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{info.isi}</p>
            
            {isAdmin && (
              <button onClick={() => triggerDelete(info.id, 'Hapus pengumuman ini?')} className="absolute top-4 right-4 text-red-400 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all">
                <Trash2 size={16}/>
              </button>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Bell/> Buat Pengumuman</h3>
            <div>
              <label className="text-xs font-bold text-gray-500">Judul Pengumuman</label>
              <input value={form.judul} onChange={e=>setForm({...form, judul:e.target.value})} placeholder="Misal: Info Penjemputan Santri" className="w-full p-3 border rounded-xl bg-gray-50 mt-1" required/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Isi Pesan</label>
              <textarea value={form.isi} onChange={e=>setForm({...form, isi:e.target.value})} placeholder="Tulis pesan lengkap di sini..." rows="5" className="w-full p-3 border rounded-xl bg-gray-50 mt-1" required/>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={()=>setModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Batal</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md">Terbitkan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ClockComponent({ isMobile = false }) {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => { 
    const timer = setInterval(() => setTime(new Date()), 1000); 
    return () => clearInterval(timer); 
  }, []);
  
  const hijriDate = useMemo(() => {
    try {
      // ====================================================
      // PENGATURAN MANUAL TANGGAL HIJRIYAH
      // Ubah angka 0 di bawah ini jika tanggalnya meleset:
      // Isi dengan 1  -> untuk menambah 1 hari (maju)
      // Isi dengan -1 -> untuk mengurangi 1 hari (mundur)
      // ====================================================
      const penyesuaianHari = 0; 
      
      const adjustedDate = new Date(time.getTime());
      adjustedDate.setDate(adjustedDate.getDate() + penyesuaianHari);

      const hijriFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' });
      return hijriFormatter.format(adjustedDate) + ' H';
    } catch(e) {
      return '';
    }
  }, [time.getDate()]); // Hanya dihitung ulang jika tanggal berubah, bukan setiap detik

  const timeString = time.toLocaleTimeString('id-ID');
  const dateString = time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className={`flex flex-col ${isMobile ? 'items-end' : 'items-end'} w-full`}>
      <div className="font-mono font-bold text-base md:text-xl tracking-wider text-white drop-shadow-sm min-w-[80px] md:min-w-[95px] text-right">
        {timeString}
      </div>
      <div className="text-emerald-100 text-[9px] md:text-xs mt-0.5 truncate max-w-full font-medium">
        {dateString}
      </div>
      {hijriDate && (
        <div className="text-yellow-300 text-[9px] md:text-xs font-bold mt-0.5 truncate max-w-full">
          {hijriDate}
        </div>
      )}
    </div>
  );
}