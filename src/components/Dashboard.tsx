import React, { useState, useEffect } from 'react';
import { DriveFile, BookMetadata, GasConfig, VisitorLog, BorrowLog } from '../types';
import { fetchVisitorLogsFromGas, fetchBorrowLogsFromGas } from '../api';
import { 
  Book, Clock, Library, ArrowRight, Users, ClipboardCheck, 
  BookOpen, Calendar, User, ShieldAlert, Sparkles, AlertCircle 
} from 'lucide-react';

interface DashboardProps {
  files: DriveFile[];
  metadata: Record<string, BookMetadata>;
  onGoToTab: (tab: 'dashboard' | 'stock' | 'collection' | 'booklist' | 'traffic' | 'settings' | 'visitor' | 'borrow') => void;
  config: GasConfig;
}

export function Dashboard({ files, metadata, onGoToTab, config }: DashboardProps) {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [borrowLogs, setBorrowLogs] = useState<BorrowLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Digital and physical book calculations
  const totalDigitalBooks = files.filter(f => metadata[f.id]?.status === 'collection').length;
  const totalPhysicalBooks = Object.values(metadata).filter(m => m.isOffline).length;

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!config.gasUrl || !config.sheetId) {
        setVisitorLogs([]);
        setBorrowLogs([]);
        return;
      }

      setIsLoading(true);
      setIsError(false);
      try {
        // Fetch Visitor Logs
        let fetchedVLogs: VisitorLog[] = [];
        try {
          const vResponse = await fetchVisitorLogsFromGas(config);
          if (vResponse.success && vResponse.visitorLogs) {
            fetchedVLogs = vResponse.visitorLogs;
          }
        } catch (err) {
          console.warn("Could not fetch visitors for dashboard", err);
        }

        // Fetch Borrow Logs
        let fetchedBLogs: BorrowLog[] = [];
        try {
          const bResponse = await fetchBorrowLogsFromGas(config);
          if (bResponse.success && bResponse.borrowLogs) {
            fetchedBLogs = bResponse.borrowLogs;
          }
        } catch (err) {
          console.warn("Could not fetch borrows for dashboard", err);
        }

        fetchedVLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setVisitorLogs(fetchedVLogs);

        fetchedBLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setBorrowLogs(fetchedBLogs);

      } catch (error) {
        console.error("Dashboard statistics loading error:", error);
        setIsError(true);
        setVisitorLogs([]);
        setBorrowLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [config.gasUrl, config.sheetId]);

  // Derived statistics
  const activeBorrows = borrowLogs.filter(b => b.status === 'Dipinjam').length;
  const pendingApprovals = borrowLogs.filter(b => !b.status || b.status === 'Menunggu Persetujuan').length;
  
  // Sorted books
  const sortedFiles = [...files]
    .filter(f => metadata[f.id]?.status === 'collection')
    .sort((a, b) => {
      const timeA = metadata[a.id]?.addedToCollectionAt ? new Date(metadata[a.id].addedToCollectionAt!).getTime() : 0;
      const timeB = metadata[b.id]?.addedToCollectionAt ? new Date(metadata[b.id].addedToCollectionAt!).getTime() : 0;
      return timeB - timeA;
    });
  const recentDigitalBooks = sortedFiles.slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Dynamic Welcoming Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 border border-indigo-500/20">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-indigo-100 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Sistem Manajemen Perpustakaan Terpadu</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {config.libraryName || 'Perpustakaan Digital'}
            </h1>
            <p className="text-indigo-100 max-w-2xl text-sm sm:text-base opacity-95">
              Selamat datang di panel kontrol admin. Kelola inventaris buku, klasifikasikan katalog, pantau status sirkulasi peminjaman, serta analisis statistik kunjungan secara profesional.
            </p>
          </div>
          <button
            onClick={() => onGoToTab('visitor')}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl text-sm shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 self-start md:self-auto"
          >
            <span>Buka Portal Pengunjung</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 Elegant Statistics Grid Cards */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-6">
        
        {/* e-Book Card */}
        <div 
          onClick={() => onGoToTab('booklist')}
          className="bg-white hover:bg-gray-50/50 rounded-xl sm:rounded-2xl p-2 sm:p-6 shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group min-w-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between items-center text-center sm:text-left gap-1 sm:gap-0">
            <div className="p-1.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-2xl group-hover:bg-indigo-100 transition-colors order-first sm:order-last flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0 w-full">
              <p className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate sm:whitespace-normal">
                <span className="hidden sm:inline">Koleksi Digital</span>
                <span className="inline sm:hidden">Digital</span>
              </p>
              <h3 className="text-sm xs:text-base sm:text-3xl font-black text-gray-900 leading-none">{totalDigitalBooks}</h3>
            </div>
          </div>
          <div className="hidden sm:flex mt-4 pt-4 border-t border-gray-100 items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Kelola e-Book PDF</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Physical Book Card */}
        <div 
          onClick={() => onGoToTab('booklist')}
          className="bg-white hover:bg-gray-50/50 rounded-xl sm:rounded-2xl p-2 sm:p-6 shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group min-w-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between items-center text-center sm:text-left gap-1 sm:gap-0">
            <div className="p-1.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-2xl group-hover:bg-emerald-100 transition-colors order-first sm:order-last flex-shrink-0">
              <Library className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0 w-full">
              <p className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate sm:whitespace-normal">
                <span className="hidden sm:inline">Buku Fisik (Offline)</span>
                <span className="inline sm:hidden">Fisik</span>
              </p>
              <h3 className="text-sm xs:text-base sm:text-3xl font-black text-gray-900 leading-none">{totalPhysicalBooks}</h3>
            </div>
          </div>
          <div className="hidden sm:flex mt-4 pt-4 border-t border-gray-100 items-center justify-between text-xs font-semibold text-emerald-600">
            <span>Kelola Inventaris Fisik</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Active Circulations Card */}
        <div 
          onClick={() => onGoToTab('borrow')}
          className="bg-white hover:bg-gray-50/50 rounded-xl sm:rounded-2xl p-2 sm:p-6 shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group min-w-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between items-center text-center sm:text-left gap-1 sm:gap-0">
            <div className="p-1.5 sm:p-3 bg-amber-50 text-amber-600 rounded-lg sm:rounded-2xl group-hover:bg-amber-100 transition-colors order-first sm:order-last flex-shrink-0">
              <ClipboardCheck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0 w-full">
              <p className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate sm:whitespace-normal">
                <span className="hidden sm:inline">Sedang Dipinjam</span>
                <span className="inline sm:hidden">Pinjam</span>
              </p>
              <h3 className="text-sm xs:text-base sm:text-3xl font-black text-gray-900 leading-none">{activeBorrows}</h3>
            </div>
          </div>
          <div className="hidden sm:flex mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-amber-600">
            <span>Pantau Sirkulasi</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Pending Approvals Card */}
        <div 
          onClick={() => onGoToTab('borrow')}
          className="bg-white hover:bg-gray-50/50 rounded-xl sm:rounded-2xl p-2 sm:p-6 shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group min-w-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between items-center text-center sm:text-left gap-1 sm:gap-0">
            <div className="p-1.5 sm:p-3 bg-orange-50 text-orange-600 rounded-lg sm:rounded-2xl group-hover:bg-orange-100 transition-colors order-first sm:order-last flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0 w-full">
              <p className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate sm:whitespace-normal">
                <span className="hidden sm:inline">Menunggu Acc</span>
                <span className="inline sm:hidden">Pending</span>
              </p>
              <h3 className="text-sm xs:text-base sm:text-3xl font-black text-gray-900 leading-none">{pendingApprovals}</h3>
            </div>
          </div>
          <div className="hidden sm:flex mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-orange-600">
            <span>Persetujuan Baru</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Visitors Card */}
        <div 
          onClick={() => onGoToTab('traffic')}
          className="bg-white hover:bg-gray-50/50 rounded-xl sm:rounded-2xl p-2 sm:p-6 shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group min-w-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between items-center text-center sm:text-left gap-1 sm:gap-0">
            <div className="p-1.5 sm:p-3 bg-sky-50 text-sky-600 rounded-lg sm:rounded-2xl group-hover:bg-sky-100 transition-colors order-first sm:order-last flex-shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0 w-full">
              <p className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate sm:whitespace-normal">
                <span className="hidden sm:inline">Total Kunjungan</span>
                <span className="inline sm:hidden">Tamu</span>
              </p>
              <h3 className="text-sm xs:text-base sm:text-3xl font-black text-gray-900 leading-none">{visitorLogs.length}</h3>
            </div>
          </div>
          <div className="hidden sm:flex mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-sky-600">
            <span>Statistik Pengunjung</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      {/* Connection Warning Notification if Apps Script Config is Missing */}
      {(!config.gasUrl || !config.sheetId) && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-start gap-3.5 shadow-sm">
          <AlertCircle className="w-5.5 h-5.5 flex-shrink-0 text-red-600 mt-0.5 animate-pulse" />
          <div>
            <h4 className="text-sm font-bold text-red-900">Koneksi Google Spreadsheet Diperlukan</h4>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              Google Apps Script atau Google Sheet ID belum dikonfigurasi. Anda harus mengatur koneksi Google Spreadsheet aktif Anda di menu <strong>Pengaturan Sistem</strong> agar portal sirkulasi, riwayat kunjungan, dan katalog buku tersimpan dengan aman dan permanen.
            </p>
          </div>
        </div>
      )}

      {/* Dual Layout: Recent Circulations & New Books */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sirkulasi Buku Terbaru */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-gray-400" />
                Sirkulasi Peminjaman Terkini
              </h3>
              <button 
                onClick={() => onGoToTab('borrow')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
              >
                Semua Sirkulasi
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {borrowLogs.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <ClipboardCheck className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-semibold">Belum ada aktivitas sirkulasi</p>
                <p className="text-xs text-gray-400 mt-0.5">Pengajuan pinjam buku dari portal pengunjung akan terekam di sini.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {borrowLogs.slice(0, 4).map((log, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{log.namaPeminjam}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">Meminjam: <strong className="font-semibold text-gray-700">"{log.namaBuku}"</strong></p>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">{new Date(log.timestamp).toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-full leading-none whitespace-nowrap ${
                      log.status === "Kembali" 
                        ? "bg-green-100 text-green-800" 
                        : log.status === "Ditolak"
                        ? "bg-red-100 text-red-800"
                        : log.status === "Dipinjam"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {log.status || "Menunggu"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400 font-medium">Menampilkan {Math.min(borrowLogs.length, 4)} data peminjaman terbaru</p>
          </div>
        </div>

        {/* Pengunjung Terbaru */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-gray-400" />
                Daftar Kunjungan Terakhir
              </h3>
              <button 
                onClick={() => onGoToTab('traffic')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
              >
                Detail Pengunjung
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {visitorLogs.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <Users className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-semibold">Belum ada riwayat kunjungan</p>
                <p className="text-xs text-gray-400 mt-0.5">Pengisian buku tamu mandiri di kiosk pengunjung akan tertera di sini.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {visitorLogs.slice(0, 4).map((log, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="bg-sky-50 p-2.5 rounded-xl text-sky-600 flex-shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{log.nama || "Tanpa Nama"}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">Tujuan: <span className="text-gray-700 font-semibold">{log.tujuan || "Membaca"}</span></p>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">{new Date(log.timestamp).toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-[10px] font-extrabold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {log.member || "Umum"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400 font-medium">Menampilkan {Math.min(visitorLogs.length, 4)} kunjungan terdaftar terbaru</p>
          </div>
        </div>

      </div>

      {/* Recent Digital Books (e-Book) added */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-gray-400" />
            Koleksi Digital Baru Ditambahkan
          </h3>
          <button 
            onClick={() => onGoToTab('collection')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
          >
            Lihat Semua Katalog Visual
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        {recentDigitalBooks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Book className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-semibold">Belum ada buku digital yang terpublikasi</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Gunakan "Arsip Drive Masuk" untuk mengimpor file PDF dari Google Drive Anda ke visualisasi katalog.</p>
            <button 
              onClick={() => onGoToTab('stock')}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors text-xs"
            >
              Impor Arsip Drive
            </button>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentDigitalBooks.map(file => {
              const bookMeta = metadata[file.id];
              return (
                <div key={file.id} className="p-3.5 border border-gray-100 rounded-xl hover:border-indigo-100 hover:bg-indigo-50/10 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Book className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate" title={bookMeta?.title || file.name}>
                        {bookMeta?.title || file.name}
                      </p>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5 bg-gray-100 px-2 py-0.5 rounded-md inline-block">
                        {bookMeta?.category || "Belum Terkategori"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono font-medium whitespace-nowrap bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    {bookMeta?.addedToCollectionAt ? new Date(bookMeta.addedToCollectionAt).toLocaleDateString("id-ID") : new Date(file.lastUpdated).toLocaleDateString("id-ID")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
