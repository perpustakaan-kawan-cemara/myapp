import { GasConfig, SliderItem } from "../types";
import { logVisitorToGas, logBorrowToGas } from "../api";
import React, { useEffect, useRef, useState } from "react";
import { DriveFile, BookMetadata } from "../types";
import { BookOpen, Shield, User, ClipboardList, AlertCircle, Sparkles, X, Phone, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { CollectionList } from "./CollectionList";
import { VisitorSlider } from "./VisitorSlider";
import { getDriveImageUrl } from "../utils";

interface VisitorViewProps {
  config: GasConfig;
  files: DriveFile[];
  metadata: Record<string, BookMetadata>;
  libraryName?: string;
  onExit: () => void;
  isLoading: boolean;
  sliderItems: SliderItem[];
  showSlider: boolean;
  isAuthenticated?: boolean;
}

export function VisitorView({ 
  files, 
  metadata, 
  libraryName, 
  onExit, 
  isLoading, 
  config,
  sliderItems,
  showSlider,
  isAuthenticated
}: VisitorViewProps) {
  // Default to explorer view directly (self-service form is now optional)
  const [currentView, setCurrentView] = useState<'explorer' | 'form'>('explorer');
  
  const [nama, setNama] = useState(() => sessionStorage.getItem("visitor_nama") || "");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [kategoriUsia, setKategoriUsia] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [member, setMember] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // States for Book Borrowing & Unified Self-Service
  const [borrowAlamat, setBorrowAlamat] = useState("");
  const [borrowBuku, setBorrowBuku] = useState("");
  const [borrowTelpon, setBorrowTelpon] = useState("");
  const [borrowDurasi, setBorrowDurasi] = useState("7 Hari");
  const [borrowSuccess, setBorrowSuccess] = useState(false);

  const activeVisitorName = sessionStorage.getItem("visitor_nama") || nama;

  const handleAdminLogin = () => {
    onExit();
  };

  const handleOpenBorrowWithBook = (bookTitle: string) => {
    setBorrowBuku(bookTitle);
    setTujuan("Pinjam Buku (Khusus Offline)");
    setBorrowSuccess(false);
    setCurrentView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!nama.trim()) {
      setSubmitError("Nama pengunjung harus diisi.");
      return;
    }
    if (!jenisKelamin) {
      setSubmitError("Silakan pilih jenis kelamin Anda.");
      return;
    }
    if (!kategoriUsia) {
      setSubmitError("Silakan pilih kategori usia Anda.");
      return;
    }
    if (!pekerjaan) {
      setSubmitError("Silakan pilih pekerjaan atau profesi Anda.");
      return;
    }
    if (!tujuan) {
      setSubmitError("Silakan pilih tujuan kunjungan Anda.");
      return;
    }
    if (!member) {
      setSubmitError("Silakan pilih status keanggotaan Anda.");
      return;
    }

    const isBorrowing = tujuan === "Pinjam Buku (Khusus Offline)";
    if (isBorrowing) {
      if (!borrowAlamat.trim()) {
        setSubmitError("Alamat peminjam harus diisi.");
        return;
      }
      if (!borrowBuku.trim()) {
        setSubmitError("Judul buku yang ingin dipinjam harus diisi.");
        return;
      }
      if (!borrowTelpon.trim()) {
        setSubmitError("Nomor telepon/WhatsApp peminjam harus diisi.");
        return;
      }
      if (!borrowDurasi) {
        setSubmitError("Silakan pilih durasi peminjaman.");
        return;
      }
    }

    setIsSubmitting(true);

    // Enforce that Apps Script & Spreadsheet are fully configured
    if (!config.gasUrl || !config.sheetId) {
      setSubmitError("Gagal mengirim: Konfigurasi Google Sheets / Apps Script belum lengkap di Panel Admin. Silakan hubungi admin perpustakaan agar data Anda dapat disimpan langsung ke Google Spreadsheet.");
      setIsSubmitting(false);
      return;
    }

    let borrowDurasiString = "";
    if (tujuan === "Pinjam Buku (Khusus Offline)") {
      const days = parseInt(borrowDurasi.split(" ")[0]) || 7;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + days);
      
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      borrowDurasiString = `${formatDate(startDate)} s/d ${formatDate(endDate)}`;
    }

    try {
      // 1. Log Visitor Kunjungan
      const visitorResult = await logVisitorToGas(
        config,
        navigator.userAgent,
        nama.trim(),
        jenisKelamin,
        tujuan,
        member,
        kategoriUsia,
        pekerjaan
      );

      if (!visitorResult || !visitorResult.success) {
        throw new Error(visitorResult?.error || "Gagal mencatat kunjungan ke Google Spreadsheet");
      }

      // 2. Log Peminjaman Buku (if borrowing)
      if (isBorrowing) {
        const borrowResult = await logBorrowToGas(
          config,
          nama.trim(),
          jenisKelamin,
          borrowAlamat.trim(),
          borrowBuku.trim(),
          borrowTelpon.trim(),
          borrowDurasiString
        );

        if (!borrowResult || !borrowResult.success) {
          throw new Error(borrowResult?.error || "Gagal mencatat data peminjaman ke Google Spreadsheet");
        }
      }

      // If everything successfully saved to GAS/Spreadsheet, record session and show success state
      sessionStorage.setItem("visitor_registered", "true");
      sessionStorage.setItem("visitor_nama", nama.trim());
      setBorrowSuccess(true);
    } catch (err: any) {
      console.error("Gagal mengirim data ke Google Sheets:", err);
      setSubmitError(`Gagal menyimpan data ke Google Spreadsheet: ${err.message || "Pastikan URL Apps Script dan Sheet ID sudah benar, serta koneksi internet Anda aktif."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetVisitor = () => {
    sessionStorage.removeItem("visitor_registered");
    sessionStorage.removeItem("visitor_nama");
    setNama("");
    setJenisKelamin("");
    setKategoriUsia("");
    setPekerjaan("");
    setTujuan("");
    setMember("");
    setBorrowAlamat("");
    setBorrowBuku("");
    setBorrowTelpon("");
    setBorrowDurasi("7 Hari");
    setBorrowSuccess(false);
    setCurrentView('form');
  };

  // If we are in the Form View, render the beautiful dedicated full-page layout
  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Navigation Bar for Form Page */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <button 
              onClick={() => {
                setBorrowSuccess(false);
                setCurrentView('explorer');
              }}
              className="flex items-center gap-2 sm:gap-3 text-left hover:opacity-90 transition-all duration-200 cursor-pointer group focus:outline-none"
              title="Kembali ke Katalog"
            >
              <div className={`p-1.5 sm:p-2 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200 ${config?.libraryLogoUrl || config?.libraryLogoId ? 'bg-transparent shadow-none p-0' : 'bg-indigo-500 shadow-indigo-500/20'}`}>
                {config?.libraryLogoUrl || config?.libraryLogoId ? (
                  <img src={getDriveImageUrl(config.libraryLogoId || config.libraryLogoUrl)} alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded bg-white shadow-sm border border-gray-100" />
                ) : (
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm sm:text-lg tracking-tight flex items-center gap-1 sm:gap-1.5 group-hover:text-indigo-600 transition-colors">
                  {libraryName || 'Perpustakaan Digital'}
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500">Layanan Mandiri Pengunjung</p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setBorrowSuccess(false);
                  setCurrentView('explorer');
                }}
                className="flex items-center justify-center p-1.5 sm:p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                title="Kembali ke Katalog"
              >
                <ArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Form Main Body: Clean Centered Google Forms-inspired Layout */}
        <main className="flex-1 flex flex-col items-center justify-start p-3 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 overflow-y-auto">
          <div className="max-w-2xl w-full space-y-4 sm:space-y-5 my-auto">
            
            {/* Top Header Card (Google Form Style with Elegant Accent) */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
              {/* Colored top accent line */}
              <div className="h-1.5 sm:h-2.5 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600"></div>
              
              <div className="p-4 sm:p-8 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-indigo-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-indigo-600">
                    <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                      Portal Layanan Mandiri
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-indigo-600">
                      {libraryName || 'Perpustakaan Digital'}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pt-2 border-t border-gray-100">
                  Selamat datang! Silakan lengkapi formulir di bawah ini untuk mencatat kunjungan harian Anda atau mengajukan peminjaman buku fisik secara mandiri.
                </p>

                {/* Quick Info Badges / Guides (Minimalist Visuals) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
                  <div className="p-2.5 sm:p-3 bg-gray-50 rounded-xl border border-gray-100 flex gap-2.5 sm:gap-3 items-start">
                    <div className="bg-indigo-100/50 p-1 sm:p-1.5 rounded-lg text-indigo-600 mt-0.5">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Buku Tamu Pengunjung</h4>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 leading-normal mt-0.5">Wajib diisi oleh setiap pengunjung untuk kepentingan statistik sirkulasi harian.</p>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-gray-50 rounded-xl border border-gray-100 flex gap-2.5 sm:gap-3 items-start">
                    <div className="bg-indigo-100/50 p-1 sm:p-1.5 rounded-lg text-indigo-600 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Sirkulasi & Peminjaman</h4>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 leading-normal mt-0.5">Pilih tujuan "Pinjam Buku" untuk meminjam buku fisik secara offline di perpustakaan.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Interactive Form Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-8">
              {borrowSuccess ? (
                <div className="text-center py-6 sm:py-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 border border-green-100">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                  </div>
                  {tujuan === "Pinjam Buku (Khusus Offline)" ? (
                    <>
                      <h4 className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight">Peminjaman Berhasil!</h4>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 max-w-sm mx-auto leading-relaxed">
                        Terima kasih, data peminjaman Anda untuk buku <strong className="font-semibold text-gray-800">"{borrowBuku}"</strong> telah sukses disimpan. Silakan temui petugas di meja pelayanan untuk serah terima fisik buku.
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight">Kunjungan Berhasil!</h4>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 max-w-sm mx-auto leading-relaxed">
                        Terima kasih, data kunjungan Anda telah disimpan. Selamat menjelajahi dan membaca katalog buku digital kami.
                      </p>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setBorrowSuccess(false);
                      setCurrentView('explorer');
                    }}
                    className="mt-6 sm:mt-8 w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
                  >
                    Mulai Jelajahi Buku
                  </button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">Formulir Isian</h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Lengkapi kolom di bawah ini secara benar</p>
                  </div>

                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-3 text-sm font-medium animate-shake">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p>{submitError}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nama Pengunjung */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1" htmlFor="visitor-name">
                        Nama Pengunjung <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <input
                          id="visitor-name"
                          type="text"
                          required
                          placeholder="Masukkan nama lengkap Anda"
                          value={nama}
                          onChange={(e) => setNama(e.target.value)}
                          className="block w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Jenis Kelamin */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                        Jenis Kelamin <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <label 
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all ${
                            jenisKelamin === "Laki-laki" 
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm font-bold" 
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="jenisKelamin"
                            value="Laki-laki"
                            checked={jenisKelamin === "Laki-laki"}
                            onChange={() => setJenisKelamin("Laki-laki")}
                            className="sr-only"
                          />
                          <span>Laki-laki</span>
                        </label>
                        <label 
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all ${
                            jenisKelamin === "Perempuan" 
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm font-bold" 
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="jenisKelamin"
                            value="Perempuan"
                            checked={jenisKelamin === "Perempuan"}
                            onChange={() => setJenisKelamin("Perempuan")}
                            className="sr-only"
                          />
                          <span>Perempuan</span>
                        </label>
                      </div>
                    </div>

                    {/* Kategori Usia */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1" htmlFor="age-category">
                        Kategori Usia <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="age-category"
                        required
                        value={kategoriUsia}
                        onChange={(e) => setKategoriUsia(e.target.value)}
                        className="block w-full px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs sm:text-sm cursor-pointer"
                      >
                        <option value="" disabled>-- Pilih Kategori Usia --</option>
                        <option value="Anak-anak (0-11 th)">Anak-anak (0-11 th)</option>
                        <option value="Remaja (12-25 th)">Remaja (12-25 th)</option>
                        <option value="Dewasa (26-45 th)">Dewasa (26-45 th)</option>
                        <option value="Lansia (> 45 th)">Lansia (&gt; 45 th)</option>
                      </select>
                    </div>

                    {/* Pekerjaan */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1" htmlFor="occupation">
                        Pekerjaan / Profesi <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="occupation"
                        required
                        value={pekerjaan}
                        onChange={(e) => setPekerjaan(e.target.value)}
                        className="block w-full px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs sm:text-sm cursor-pointer"
                      >
                        <option value="" disabled>-- Pilih Pekerjaan --</option>
                        <option value="Pelajar / Mahasiswa">Pelajar / Mahasiswa</option>
                        <option value="Guru / Dosen">Guru / Dosen</option>
                        <option value="PNS / TNI / Polri">PNS / TNI / Polri</option>
                        <option value="Karyawan Swasta">Karyawan Swasta</option>
                        <option value="Wiraswasta">Wiraswasta</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    {/* Tujuan */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1" htmlFor="visit-purpose">
                        Tujuan Kunjungan <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="visit-purpose"
                        required
                        value={tujuan}
                        onChange={(e) => setTujuan(e.target.value)}
                        className="block w-full px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs sm:text-sm cursor-pointer"
                      >
                        <option value="" disabled>-- Pilih Tujuan --</option>
                        <optgroup label="Baca Buku">
                          <option value="Baca Buku (Online)">Baca Buku (Online)</option>
                          <option value="Baca Buku (Offline)">Baca Buku (Offline)</option>
                          <option value="Baca Buku (Online & Offline)">Baca Buku (Online & Offline)</option>
                        </optgroup>
                        <optgroup label="Pinjam Buku">
                          <option value="Pinjam Buku (Khusus Offline)">Pinjam Buku (Khusus Offline)</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Status Keanggotaan */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                        Status Anggota <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <label 
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all ${
                            member === "Member" 
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm font-bold" 
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="member"
                            value="Member"
                            checked={member === "Member"}
                            onChange={() => setMember("Member")}
                            className="sr-only"
                          />
                          <span>Member</span>
                        </label>
                        <label 
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all ${
                            member === "Non-member" 
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm font-bold" 
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="member"
                            value="Non-member"
                            checked={member === "Non-member"}
                            onChange={() => setMember("Non-member")}
                            className="sr-only"
                          />
                          <span>Non-member</span>
                        </label>
                      </div>
                    </div>

                    {/* Dynamic Borrowing Questions */}
                    {tujuan === "Pinjam Buku (Khusus Offline)" && (
                      <div className="pt-3.5 border-t border-dashed border-gray-200 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-sm font-bold">Informasi Peminjaman Buku</span>
                        </div>

                        {/* Alamat Peminjam */}
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1" htmlFor="borrower-address">
                            Alamat Tinggal <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 flex items-start pointer-events-none text-gray-400">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <textarea
                              id="borrower-address"
                              required
                              rows={2}
                              placeholder="Masukkan alamat lengkap tinggal saat ini"
                              value={borrowAlamat}
                              onChange={(e) => setBorrowAlamat(e.target.value)}
                              className="block w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs sm:text-sm resize-none"
                            />
                          </div>
                        </div>

                        {/* Nama Buku */}
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1" htmlFor="borrowed-book">
                            Judul Buku <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>
                            <input
                              id="borrowed-book"
                              type="text"
                              required
                              placeholder="Judul buku yang ingin dipinjam"
                              value={borrowBuku}
                              onChange={(e) => setBorrowBuku(e.target.value)}
                              className="block w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs sm:text-sm"
                            />
                          </div>
                        </div>

                        {/* Nomor Telepon */}
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1" htmlFor="borrower-phone">
                            Nomor Telepon / WhatsApp <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                              <Phone className="w-3.5 h-3.5" />
                            </div>
                            <input
                              id="borrower-phone"
                              type="tel"
                              required
                              placeholder="Contoh: 081234567890"
                              value={borrowTelpon}
                              onChange={(e) => setBorrowTelpon(e.target.value)}
                              className="block w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs sm:text-sm"
                            />
                          </div>
                        </div>

                        {/* Durasi Peminjaman */}
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1" htmlFor="borrower-duration">
                            Durasi Peminjaman <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <select
                              id="borrower-duration"
                              required
                              value={borrowDurasi}
                              onChange={(e) => setBorrowDurasi(e.target.value)}
                              className="block w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs sm:text-sm cursor-pointer"
                            >
                              <option value="3 Hari">3 Hari</option>
                              <option value="7 Hari">7 Hari (1 Minggu)</option>
                              <option value="14 Hari">14 Hari (2 Minggu)</option>
                              <option value="30 Hari">30 Hari (1 Bulan)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-4 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-lg sm:rounded-xl font-bold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 text-xs sm:text-sm shadow-md shadow-indigo-100 cursor-pointer animate-none"
                    >
                      {isSubmitting 
                        ? (tujuan === "Pinjam Buku (Khusus Offline)" ? "Mengajukan Peminjaman..." : "Mencatat kunjungan...") 
                        : (tujuan === "Pinjam Buku (Khusus Offline)" ? "Kirim & Pinjam Buku" : "Kirim & Masuk")
                      }
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Minimalist Footer */}
            <div className="text-center pt-2 pb-6 text-xs text-gray-400 font-medium flex flex-col sm:flex-row sm:justify-between items-center gap-2 px-4">
              <span>{libraryName || "Perpustakaan"} &copy; {new Date().getFullYear()}</span>
              <span className="flex items-center gap-1.5 bg-indigo-50/50 text-indigo-500/80 px-2.5 py-1 rounded-full border border-indigo-100/50">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                Layanan Mandiri Terintegrasi Apps Script
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // explorer View (Main book exploration UI)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-md w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg shadow-sm ${config?.libraryLogoUrl || config?.libraryLogoId ? 'bg-transparent shadow-none p-0' : 'bg-indigo-500 shadow-indigo-500/20'}`}>
              {config?.libraryLogoUrl || config?.libraryLogoId ? (
                <img src={getDriveImageUrl(config.libraryLogoId || config.libraryLogoUrl)} alt="Logo" className="w-9 h-9 object-contain rounded bg-white shadow-sm border border-gray-100" />
              ) : (
                <BookOpen className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-base sm:text-lg tracking-tight truncate max-w-[150px] sm:max-w-md">
                {libraryName || 'Perpustakaan Digital'}
              </h1>
              {activeVisitorName && (
                <p className="text-xs text-indigo-600 font-medium truncate max-w-[150px] sm:max-w-xs">
                  Pengunjung: {activeVisitorName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => {
                setBorrowBuku("");
                setBorrowSuccess(false);
                setCurrentView('form');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all border border-indigo-600 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Form Layanan Mandiri</span>
            </button>
            {activeVisitorName && (
              <button 
                onClick={handleResetVisitor}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
              >
                Ganti Identitas
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {showSlider ? (
            <VisitorSlider 
              slides={sliderItems} 
              visitorName={activeVisitorName}
              onOpenVisitorForm={() => setCurrentView('form')}
            />
          ) : (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-200 mb-8 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                <BookOpen className="w-64 h-64" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-semibold tracking-wide backdrop-blur-sm mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Pustaka Digital Terbuka</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold mb-2 tracking-tight">
                  {activeVisitorName ? `Halo, ${activeVisitorName}! Selamat datang` : "Selamat datang di perpustakaan kami"}
                </h2>
                <p className="text-indigo-100 max-w-2xl text-base sm:text-lg">
                  Jelajahi koleksi buku elektronik kami yang kaya. Gunakan kotak pencarian atau filter kategori untuk menemukan bacaan favorit Anda.
                </p>
              </div>
            </div>
          )}

          <CollectionList 
            files={files} 
            metadata={metadata} 
            isLoading={isLoading} 
            onBorrowBook={handleOpenBorrowWithBook}
          />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-5 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} xdmrproject
          </p>
          <button
            onClick={handleAdminLogin}
            title={isAuthenticated ? "Masuk ke Panel Admin" : "Login Admin"}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm ${
              isAuthenticated
                ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700 hover:scale-105"
                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:scale-105"
            }`}
          >
            <Shield className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
