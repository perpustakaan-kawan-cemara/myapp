import React, { useState, useRef } from "react";
import { GasConfig, SliderItem } from "../types";
import { Settings, Folder, FileSpreadsheet, Link, Library, UploadCloud, ImageIcon, Loader2, CheckCircle2, AlertCircle, Info, Clock, Save, RefreshCw, Lock } from "lucide-react";
import { uploadFileToGas, deleteFileViaGas, saveSettingsToGas, getSettingsFromGas, changeAdminPassword } from "../api";
import { Trash2 } from "lucide-react";
import { getDriveImageUrl } from "../utils";

interface ConfigPanelProps {
  config: GasConfig;
  onChange: (config: GasConfig) => void;
  slides?: SliderItem[];
  showSlider?: boolean;
  onSaveSlides?: (slides: SliderItem[]) => void;
  onToggleShowSlider?: (show: boolean) => void;
  section?: 'identity' | 'cloud' | 'sync' | 'security' | 'reset' | 'all';
}

export function ConfigPanel({ 
  config, 
  onChange,
  slides,
  showSlider,
  onSaveSlides,
  onToggleShowSlider,
  section = 'all'
}: ConfigPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newUsername, setNewUsername] = useState('admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordStatus, setChangePasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [changePasswordMessage, setChangePasswordMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'adminTimeoutMinutes' ? parseInt(value, 10) : value;
    onChange({ ...config, [name]: finalValue });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!config.coverFolderId || !config.gasUrl) {
      setUploadStatus('error');
      setUploadMessage('Harap lengkapi URL Apps Script dan ID Folder Drive (Cover) terlebih dahulu');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      if (!config.coverFolderId) {
      setUploadMessage('ID Folder Cover belum diisi di atas! Masukkan ID Folder khusus Cover terlebih dahulu dan klik Simpan.');
      setUploadStatus('error');
      setIsUploading(false);
      return;
    }
    const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const fileName = `logo_${Date.now()}_${file.name}`;
          
          const response = await uploadFileToGas(config, fileName, base64Data, 'cover');
          
          if (response.success && response.file) {
            // Delete old logo if it exists
            if (config.libraryLogoId) {
              try {
                await deleteFileViaGas(config, config.libraryLogoId);
              } catch (deleteError) {
                console.warn("Failed to delete old logo, but new logo was uploaded", deleteError);
              }
            }
            
            const newConfig = { 
              ...config, 
              libraryLogoUrl: response.file.url,
              libraryLogoId: response.file.id
            };
            onChange(newConfig);
            
            // Save to GAS
            if (newConfig.sheetId) {
              try {
                await saveSettingsToGas(newConfig, {
                  libraryName: newConfig.libraryName || '',
                  libraryLogoUrl: newConfig.libraryLogoUrl || '',
                  libraryLogoId: newConfig.libraryLogoId || ''
                });
              } catch(e) {
                console.warn('Failed to save to config sheet', e);
              }
            }
            setUploadStatus('success');
            setUploadMessage('Logo berhasil diperbarui');
          } else {
            throw new Error(response.error || 'Gagal mengunggah logo');
          }
        } catch (error) {
          console.error('Logo upload error:', error);
          setUploadStatus('error');
          setUploadMessage('Terjadi kesalahan saat mengunggah logo: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
          setIsUploading(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      setUploadStatus('error');
      setUploadMessage('Gagal membaca file gambar');
    }
  };

  const handleSaveToSpreadsheet = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');

    try {
      const response = await saveSettingsToGas(config, {
        libraryName: config.libraryName || '',
        libraryLogoUrl: config.libraryLogoUrl || '',
        libraryLogoId: config.libraryLogoId || '',
        ebookFolderId: config.ebookFolderId || '',
        coverFolderId: config.coverFolderId || '',
        sheetId: config.sheetId || '',
        sheetIdOffline: config.sheetId || '',
        adminTimeoutMinutes: config.adminTimeoutMinutes !== undefined ? config.adminTimeoutMinutes : 15,
        sliderItems: slides ? JSON.stringify(slides) : '',
        showSlider: showSlider !== undefined ? String(showSlider) : 'true'
      });

      if (response.success) {
        setSaveStatus('success');
        setSaveMessage('Konfigurasi berhasil disimpan dan disinkronkan ke Spreadsheet!');
      } else {
        setSaveStatus('error');
        setSaveMessage(response.error || 'Gagal menyimpan ke Spreadsheet.');
      }
    } catch (error: any) {
      console.error(error);
      setSaveStatus('error');
      setSaveMessage('Terjadi kesalahan koneksi: ' + (error.message || String(error)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchFromSpreadsheet = async () => {
    setIsRefreshing(true);
    setSaveStatus('idle');
    setSaveMessage('');

    try {
      const response = await getSettingsFromGas(config);
      if (response.success && response.settings) {
        const parsed = JSON.parse(response.settings);
        if (parsed && Object.keys(parsed).length > 0) {
          const updatedConfig = {
            ...config,
            ebookFolderId: parsed.ebookFolderId || config.ebookFolderId,
            coverFolderId: parsed.coverFolderId || config.coverFolderId,
            sheetId: parsed.sheetId || config.sheetId,
            sheetIdOffline: parsed.sheetId || config.sheetId || '',
            libraryName: parsed.libraryName || config.libraryName,
            adminTimeoutMinutes: parsed.adminTimeoutMinutes !== undefined ? Number(parsed.adminTimeoutMinutes) : (config.adminTimeoutMinutes !== undefined ? config.adminTimeoutMinutes : 15),
            libraryLogoUrl: parsed.libraryLogoUrl || config.libraryLogoUrl,
            libraryLogoId: parsed.libraryLogoId || config.libraryLogoId
          };
          onChange(updatedConfig);

          if (parsed.sliderItems && onSaveSlides) {
            try {
              const parsedSlides = JSON.parse(parsed.sliderItems);
              if (Array.isArray(parsedSlides)) {
                onSaveSlides(parsedSlides);
              }
            } catch (e) {
              console.warn("Failed to parse slider items from spreadsheet", e);
            }
          }
          if (parsed.showSlider !== undefined && onToggleShowSlider) {
            onToggleShowSlider(parsed.showSlider === 'true' || parsed.showSlider === true);
          }

          setSaveStatus('success');
          setSaveMessage('Berhasil menarik dan menyinkronkan konfigurasi dari Spreadsheet!');
        } else {
          setSaveStatus('error');
          setSaveMessage('Konfigurasi kosong di Spreadsheet.');
        }
      } else {
        setSaveStatus('error');
        setSaveMessage(response.error || 'Gagal menarik konfigurasi dari Spreadsheet.');
      }
    } catch (error: any) {
      console.error(error);
      setSaveStatus('error');
      setSaveMessage('Koneksi gagal: ' + (error.message || String(error)));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordStatus('idle');
    setChangePasswordMessage('');

    if (!oldPassword) {
      setChangePasswordStatus('error');
      setChangePasswordMessage('Password lama harus diisi.');
      return;
    }

    if (!newPassword || newPassword.trim() === '') {
      setChangePasswordStatus('error');
      setChangePasswordMessage('Password baru tidak boleh kosong.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordStatus('error');
      setChangePasswordMessage('Konfirmasi password baru tidak cocok.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await changeAdminPassword(
        config,
        oldPassword,
        newUsername,
        newPassword
      );

      if (response.success) {
        setChangePasswordStatus('success');
        setChangePasswordMessage(response.message || 'Kredensial admin berhasil diubah!');
        // Reset form
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setChangePasswordStatus('error');
        setChangePasswordMessage(response.error || 'Gagal mengubah password. Pastikan password lama Anda benar.');
      }
    } catch (error: any) {
      console.error(error);
      setChangePasswordStatus('error');
      setChangePasswordMessage('Gagal menghubungi Apps Script: ' + (error.message || String(error)));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 w-full h-full">
      {/* 1. Identity & Branding Card */}
      {(section === 'all' || section === 'identity') && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-indigo-100/10 overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-base">Identitas & Branding Kiosk</h3>
              <p className="text-xs text-gray-500 mt-0.5">Atur nama instansi dan logo utama untuk ditampilkan di halaman depan kiosk.</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600">
            Kustomisasi Visual
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Nama Perpustakaan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Library className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="libraryName"
                value={config.libraryName || ""}
                onChange={handleChange}
                placeholder="mis. Perpustakaan Digital"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-semibold text-gray-800 placeholder-gray-400"
              />
            </div>
            <p className="text-[10px] text-gray-500">Nama ini akan menjadi judul utama di layar pengunjung.</p>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Logo Perpustakaan <span className="text-gray-400 font-normal">(Opsional)</span>
            </label>
            <div className="flex items-center gap-4 bg-slate-50/30 p-3 rounded-xl border border-gray-200/50">
              {(config.libraryLogoUrl || config.libraryLogoId) ? (
                <div className="relative group">
                  <img 
                    src={getDriveImageUrl(config.libraryLogoId || config.libraryLogoUrl)} 
                    alt="Logo" 
                    className="w-16 h-16 object-contain rounded-xl bg-white border border-gray-200/80 p-2 shadow-sm" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-6 h-6 opacity-60" />
                  <span className="text-[8px] font-bold uppercase mt-1">Kosong</span>
                </div>
              )}
              
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleLogoUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-gray-200 text-gray-800 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-600" />
                  )}
                  <span>{config.libraryLogoUrl || config.libraryLogoId ? 'Ganti Gambar Logo' : 'Unggah File Logo'}</span>
                </button>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Format .png, .jpg, .webp (Maks 1MB). Direkomendasikan rasio persegi.
                </p>
              </div>
            </div>
            {uploadStatus === 'success' && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5 bg-green-50 p-2 rounded-lg border border-green-100"><CheckCircle2 className="w-3.5 h-3.5" /> {uploadMessage}</p>
            )}
            {uploadStatus === 'error' && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100"><AlertCircle className="w-3.5 h-3.5" /> {uploadMessage}</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* 2. Google Cloud Integration Card */}
      {(section === 'all' || section === 'cloud') && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-indigo-100/10 overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-base">Integrasi Google Cloud & Apps Script</h3>
              <p className="text-xs text-gray-500 mt-0.5">Konfigurasikan detail database dan penyimpanan awan Google Drive Anda.</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700">
            Koneksi Aktif
          </span>
        </div>
        
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Apps Script Web App URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              URL Web App Apps Script <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-500">
                <Link className="w-4 h-4" />
              </div>
              <input
                type="url"
                name="gasUrl"
                value={config.gasUrl}
                onChange={handleChange}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-mono text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex items-start gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-normal">
                URL ini didapatkan setelah Anda menerapkan (Deploy) kode Google Apps Script sebagai aplikasi web (Web App). Pastikan hak akses disetel ke "Anyone".
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drive PDF Folder ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                ID Folder Drive (Buku PDF) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Folder className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="ebookFolderId"
                  value={config.ebookFolderId}
                  onChange={handleChange}
                  placeholder="mis. 1A2b3C4d5E6f7G8h9I0j"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-mono text-gray-800 placeholder-gray-400"
                />
              </div>
              <p className="text-[10px] text-gray-500">ID folder Google Drive tempat menyimpan berkas E-Book PDF.</p>
            </div>

            {/* Drive Cover Folder ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                ID Folder Drive (Sampul/Cover) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Folder className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="coverFolderId"
                  value={config.coverFolderId}
                  onChange={handleChange}
                  placeholder="mis. 1A2b3C4d5E6f7G8h9I0j"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-mono text-gray-800 placeholder-gray-400"
                />
              </div>
              <p className="text-[10px] text-gray-500">ID folder tempat gambar sampul buku diunggah secara otomatis.</p>
            </div>

            {/* Spreadsheet ID */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                ID Google Spreadsheet Utama <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="sheetId"
                  value={config.sheetId || ""}
                  onChange={handleChange}
                  placeholder="mis. 1A2b3C4d5E6f7G8h9I0j"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-mono text-gray-800 placeholder-gray-400"
                />
              </div>
              <p className="text-[10px] text-gray-500">Database pusat yang berisi sheet Buku, Pengunjung, Peminjaman, Config, dll.</p>
            </div>

            {/* Timeout Sesi */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Timeout Sesi Panel Admin (Inaktivitas)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Clock className="w-4 h-4" />
                </div>
                <select
                  name="adminTimeoutMinutes"
                  value={config.adminTimeoutMinutes !== undefined ? config.adminTimeoutMinutes : 15}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-semibold text-gray-800 bg-no-repeat appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem'
                  }}
                >
                  <option value={5}>5 Menit</option>
                  <option value={10}>10 Menit</option>
                  <option value={15}>15 Menit (Standar)</option>
                  <option value={30}>30 Menit</option>
                  <option value={60}>1 Jam</option>
                  <option value={120}>2 Jam</option>
                  <option value={0}>Selalu Aktif (Tidak Ada Batasan)</option>
                </select>
              </div>
              <p className="text-[10px] text-gray-500">Melindungi panel admin dengan keluar secara otomatis jika tidak ada aktivitas.</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 3. Sync & Cloud Backup Card */}
      {(section === 'all' || section === 'sync') && (
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl text-white p-6 shadow-lg shadow-indigo-900/10 border border-indigo-800/50 relative overflow-hidden h-full flex flex-col">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex-1 space-y-6 overflow-y-auto pr-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-2xl text-indigo-200 border border-white/10">
              <Save className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-white">Sinkronisasi & Backup Database (Config)</h3>
              <p className="text-xs text-indigo-200 leading-relaxed max-w-2xl">
                Simpan seluruh setelan visual, folder, dan parameter database Kiosk Anda langsung ke tab <strong className="text-white underline decoration-indigo-400">Config</strong> di Google Spreadsheet. Sangat berguna sebagai cadangan permanen saat berpindah sistem.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleSaveToSpreadsheet}
              disabled={isSaving || isRefreshing || !config.gasUrl || !config.sheetId}
              className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 disabled:bg-indigo-400/50 disabled:text-indigo-200 disabled:border-transparent text-indigo-950 rounded-xl text-sm font-extrabold transition-all shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan ke Spreadsheet</span>
                </>
              )}
            </button>

            <button
              onClick={handleFetchFromSpreadsheet}
              disabled={isSaving || isRefreshing || !config.gasUrl}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-950/60 hover:bg-indigo-900/80 disabled:opacity-50 text-indigo-200 border border-indigo-700 rounded-xl text-sm font-bold transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Menarik Data...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  <span>Tarik dari Spreadsheet</span>
                </>
              )}
            </button>
          </div>

          {saveStatus === 'success' && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-200 text-xs font-semibold animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p>{saveMessage}</p>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-200 text-xs font-semibold animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <p>{saveMessage}</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* 4. Security & Admin Credentials Card */}
      {(section === 'all' || section === 'security') && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-indigo-100/10 overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-base">Ubah Kredensial Admin</h3>
              <p className="text-xs text-gray-500 mt-0.5">Lindungi akses konfigurasi dengan memperbarui kombinasi username dan sandi.</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-gray-200 text-[10px] font-bold text-gray-600">
            Akses Admin
          </span>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Username Admin Baru
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="default: admin"
                  className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-semibold text-gray-800 placeholder-gray-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Password Lama
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan sandi saat ini"
                  className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-semibold text-gray-800 placeholder-gray-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Buat sandi baru yang kuat"
                  className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-semibold text-gray-800 placeholder-gray-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Ulangi sandi baru"
                  className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all text-sm font-semibold text-gray-800 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <button
                type="submit"
                disabled={isChangingPassword || !oldPassword || !newPassword || !confirmNewPassword}
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none self-start"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Pembaruan...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Simpan Kredensial Baru</span>
                  </>
                )}
              </button>

              {changePasswordStatus === 'success' && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 text-green-800 text-xs font-semibold animate-in slide-in-from-top-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>{changePasswordMessage}</p>
                </div>
              )}
              {changePasswordStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-800 text-xs font-semibold animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p>{changePasswordMessage}</p>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
      )}

      {/* 5. Danger Zone Card */}
      {(section === 'all' || section === 'reset') && (
      <div className="bg-rose-50/50 rounded-2xl border border-rose-200/60 p-6 space-y-4 h-full flex flex-col overflow-y-auto">
        <div className="flex items-center gap-3 text-rose-700">
          <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl border border-rose-200">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 text-base">Area Bahaya: Reset Pengaturan Sistem</h4>
            <p className="text-xs text-rose-700/80 mt-0.5">Tindakan ini permanen di browser Anda. Harap berhati-hati.</p>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 leading-relaxed max-w-3xl flex-1">
          Melakukan reset akan menghapus seluruh data cache lokal, URL integrasi Apps Script, kredensial tersimpan, dan konfigurasi portal di perangkat ini. <strong>Data buku, peminjaman, dan log di Google Spreadsheet Anda tetap aman dan tidak akan terpengaruh.</strong>
        </p>

        <button
          onClick={() => {
            if (window.confirm("Apakah Anda yakin ingin menghapus semua pengaturan dan cache lokal? Halaman akan dimuat ulang setelahnya.")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer hover:border-rose-400 self-start"
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Hapus & Reset Seluruh Data Lokal Kiosk</span>
        </button>
      </div>
      )}
    </div>
  );
}
