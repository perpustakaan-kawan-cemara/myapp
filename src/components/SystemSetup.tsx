import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, DownloadCloud, Loader2, CheckCircle2, HelpCircle, FileSpreadsheet, Folder, LayoutDashboard } from 'lucide-react';
import { GasConfig } from '../types';
import { SetupInstructions } from './SetupInstructions';
import { getSettingsFromGas, saveSettingsToGas } from '../api';

interface SystemSetupProps {
  initialConfig: GasConfig;
  onSave: (config: GasConfig) => void;
}

export function SystemSetup({ initialConfig, onSave }: SystemSetupProps) {
  const [activeTab, setActiveTab] = useState<'connection' | 'details' | 'guide'>('connection');

  const [gasUrl, setGasUrl] = useState(initialConfig.gasUrl || "");
  const [ebookFolderId, setEbookFolderId] = useState(initialConfig.ebookFolderId || "");
  const [coverFolderId, setCoverFolderId] = useState(initialConfig.coverFolderId || "");
  const [sheetId, setSheetId] = useState(initialConfig.sheetId || "");
  const [sheetIdOffline, setSheetIdOffline] = useState(initialConfig.sheetIdOffline || "");
  const [libraryName, setLibraryName] = useState(initialConfig.libraryName || "Perpustakaan Digital");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'success' | 'error' | 'not_found'>('idle');
  const [fetchMessage, setFetchMessage] = useState("");

  const [fetchedConfig, setFetchedConfig] = useState<any>({});

  const handleFetchConfig = async () => {
    if (!gasUrl) {
      setFetchStatus('error');
      setFetchMessage("Harap masukkan URL Apps Script terlebih dahulu.");
      return;
    }
    const cleanUrl = gasUrl.trim();
    if (!cleanUrl.endsWith('/exec')) {
      setFetchStatus('error');
      setFetchMessage("URL Apps Script tidak valid. Harus diakhiri dengan '/exec'.");
      return;
    }

    setIsFetching(true);
    setFetchStatus('idle');
    setFetchMessage("");

    try {
      const response = await getSettingsFromGas({ gasUrl: cleanUrl, sheetId: "", ebookFolderId: "", coverFolderId: "" });
      
      if (response.success && response.settings) {
        const parsed = JSON.parse(response.settings);
        if (parsed && Object.keys(parsed).length > 0) {
          setFetchedConfig(parsed);
          if (parsed.ebookFolderId) setEbookFolderId(parsed.ebookFolderId);
          if (parsed.coverFolderId) setCoverFolderId(parsed.coverFolderId);
          if (parsed.sheetId) setSheetId(parsed.sheetId);
          if (parsed.sheetIdOffline) setSheetIdOffline(parsed.sheetIdOffline);
          if (parsed.libraryName) setLibraryName(parsed.libraryName);
          
          setFetchStatus('success');
          setFetchMessage("Berhasil! Konfigurasi sistem berhasil ditarik dari Spreadsheet.");
        } else {
          setFetchStatus('not_found');
          setFetchMessage("Terhubung ke Apps Script, tetapi belum ada konfigurasi tersimpan di Google Sheet. Silakan lengkapi pengaturan manual di bawah ini.");
        }
      } else {
        setFetchStatus('error');
        setFetchMessage(response.error || "Gagal menarik konfigurasi. Pastikan Apps Script telah di-deploy dan URL benar.");
      }
    } catch (err: any) {
      console.error(err);
      setFetchStatus('error');
      setFetchMessage("Koneksi gagal: " + (err.message || "Pastikan Apps Script di-deploy dengan akses 'Anyone' (Siapa saja)."));
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const finalConfig: GasConfig = {
      gasUrl: gasUrl.trim(),
      ebookFolderId: ebookFolderId.trim(),
      coverFolderId: coverFolderId.trim(),
      sheetId: sheetId.trim(),
      sheetIdOffline: sheetIdOffline.trim() || undefined,
      libraryName: libraryName.trim(),
      libraryLogoUrl: fetchedConfig.libraryLogoUrl || initialConfig.libraryLogoUrl,
      libraryLogoId: fetchedConfig.libraryLogoId || initialConfig.libraryLogoId,
      adminTimeoutMinutes: fetchedConfig.adminTimeoutMinutes || initialConfig.adminTimeoutMinutes !== undefined ? initialConfig.adminTimeoutMinutes : 15
    };

    try {
      await saveSettingsToGas(finalConfig, {
        ...fetchedConfig,
        libraryName: finalConfig.libraryName,
        ebookFolderId: finalConfig.ebookFolderId,
        coverFolderId: finalConfig.coverFolderId,
        sheetId: finalConfig.sheetId,
        sheetIdOffline: finalConfig.sheetIdOffline || '',
        adminTimeoutMinutes: finalConfig.adminTimeoutMinutes,
        sliderItems: fetchedConfig.sliderItems || '',
        showSlider: fetchedConfig.showSlider || 'true'
      });
    } catch (err) {
      console.warn("Gagal mencadangkan konfigurasi ke Spreadsheet:", err);
    }

    setTimeout(() => {
      onSave(finalConfig);
      setIsSaving(false);
    }, 500);
  };

  const tabs = [
    { id: 'connection', label: 'Koneksi Apps Script', icon: DownloadCloud },
    { id: 'details', label: 'Detail Konfigurasi', icon: LayoutDashboard },
    { id: 'guide', label: 'Panduan Instalasi', icon: HelpCircle }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="flex w-full max-w-5xl h-[calc(100vh-2rem)] min-h-[600px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl shadow-indigo-900/5 animate-in fade-in duration-300">
        
        {/* Sidebar */}
        <div className="w-64 bg-slate-50 border-r border-gray-200 flex flex-col h-full overflow-y-auto hidden md:flex shrink-0">
          <div className="p-6 pb-4 border-b border-gray-200/60 bg-white">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
              <SettingsIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Portal<br/>Perpustakaan
            </h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">Setup Awal Kiosk</p>
          </div>
          
          <div className="p-4 space-y-1 flex-1">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-3 mb-2">Menu Setup</h4>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left text-sm font-semibold ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex absolute top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-semibold border-b-2 transition-colors ${
                  isActive ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-50/50 relative pt-[72px] md:pt-0">
          
          {activeTab === 'connection' && (
            <div className="h-full flex flex-col overflow-y-auto">
              <div className="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <DownloadCloud className="w-48 h-48" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <h1 className="text-2xl font-bold tracking-tight">Koneksi Apps Script</h1>
                  <p className="text-indigo-100 mt-2 text-sm leading-relaxed">
                    Tautkan URL Apps Script Web App untuk menyinkronkan data kiosk Anda.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 max-w-3xl flex-1">
                <div className="space-y-6">
                  {/* Step 1: Connecting Apps Script */}
                  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="flex items-center justify-center bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full text-xs">1</span>
                      Tautkan Apps Script Web App
                    </h2>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Google Apps Script Web App URL
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={gasUrl}
                          onChange={(e) => setGasUrl(e.target.value)}
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="block flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleFetchConfig}
                          disabled={isFetching || !gasUrl}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          {isFetching ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Menghubungkan...</span>
                            </>
                          ) : (
                            <>
                              <DownloadCloud className="w-4 h-4" />
                              <span>Tarik Konfigurasi</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Setelah berhasil ditarik, lanjut ke tab <strong>Detail Konfigurasi</strong> untuk melengkapi data lainnya.
                      </p>
                    </div>

                    {fetchStatus === 'success' && (
                      <div className="p-3.5 bg-green-50 border border-green-100 rounded-xl flex items-start gap-2.5 text-green-800 text-xs font-semibold animate-in slide-in-from-top-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p>{fetchMessage}</p>
                      </div>
                    )}
                    {(fetchStatus === 'error' || fetchStatus === 'not_found') && (
                      <div className={`p-3.5 border rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-in slide-in-from-top-2 ${
                        fetchStatus === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'
                      }`}>
                        <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${fetchStatus === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
                        <p>{fetchMessage}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="px-6 py-3 bg-white border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold transition-all cursor-pointer"
                    >
                      Lanjut ke Detail Konfigurasi &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="h-full flex flex-col overflow-y-auto">
              <div className="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <LayoutDashboard className="w-48 h-48" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <h1 className="text-2xl font-bold tracking-tight">Detail Database</h1>
                  <p className="text-indigo-100 mt-2 text-sm leading-relaxed">
                    Atur ID Folder Drive dan Spreadsheet untuk penyimpanan Kiosk.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 max-w-3xl flex-1">
                <div className="space-y-6">
                  {/* Step 2: Main configurations */}
                  <form onSubmit={handleSave} className="space-y-6 pb-8">
                    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-5">
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="flex items-center justify-center bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full text-xs">2</span>
                        Detail Konfigurasi
                      </h2>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Nama Perpustakaan
                          </label>
                          <input
                            type="text"
                            required
                            value={libraryName}
                            onChange={(e) => setLibraryName(e.target.value)}
                            placeholder="Misal: Perpustakaan Budi Jaya"
                            className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                              <Folder className="w-4 h-4 text-gray-400" />
                              ID Folder Drive (e-Book PDF)
                            </label>
                            <input
                              type="text"
                              required
                              value={ebookFolderId}
                              onChange={(e) => setEbookFolderId(e.target.value)}
                              placeholder="ID Folder PDF Google Drive"
                              className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                              <Folder className="w-4 h-4 text-gray-400" />
                              ID Folder Drive (Gambar Cover)
                            </label>
                            <input
                              type="text"
                              required
                              value={coverFolderId}
                              onChange={(e) => setCoverFolderId(e.target.value)}
                              placeholder="ID Folder Cover Google Drive"
                              className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                              ID Spreadsheet Utama
                            </label>
                            <input
                              type="text"
                              required
                              value={sheetId}
                              onChange={(e) => setSheetId(e.target.value)}
                              placeholder="ID Google Spreadsheet Utama"
                              className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                              ID Spreadsheet Offline (Opsional)
                            </label>
                            <input
                              type="text"
                              value={sheetIdOffline}
                              onChange={(e) => setSheetIdOffline(e.target.value)}
                              placeholder="Kosongkan jika disamakan"
                              className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving || !gasUrl || !ebookFolderId || !coverFolderId || !sheetId}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:shadow-none"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Menyimpan & Menyinkronkan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Simpan Konfigurasi & Masuk Portal</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="h-full overflow-hidden p-6 pb-0">
               <SetupInstructions />
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

