import React, { useState, useRef } from "react";
import { SliderItem, GasConfig } from "../types";
import { saveSettingsToGas } from "../api";
import { 
  Plus, Trash2, Edit2, Check, X, RotateCcw, Image, 
  Eye, EyeOff, Layout, ChevronUp, ChevronDown, Upload, Link, Sparkles, Loader2, Save, CheckCircle2, AlertCircle
} from "lucide-react";

interface SliderConfigProps {
  config?: GasConfig;
  slides: SliderItem[];
  showSlider: boolean;
  onSaveSlides: (slides: SliderItem[]) => void;
  onToggleShowSlider: (show: boolean) => void;
}

export const DEFAULT_SLIDES: SliderItem[] = [
  {
    id: "default-welcome",
    imageUrl: "",
    title: "Selamat datang di perpustakaan kami",
    description: "Jelajahi koleksi buku elektronik kami yang kaya. Gunakan kotak pencarian atau filter kategori untuk menemukan bacaan favorit Anda.",
    linkUrl: "",
    isActive: true,
    isGradientBg: true,
    gradientClass: "from-indigo-600 via-indigo-500 to-purple-600",
    hideOverlayText: false
  },
  {
    id: "default-invitation",
    imageUrl: "",
    title: "Kehadiran Anda Adalah Kebanggaan Kami",
    description: "Pengunjung yang cerdas, budiman, dan berwawasan luas seperti Anda selalu membawa inspirasi baru bagi perpustakaan digital ini. Luangkan waktu 10 detik mengisi buku kunjungan untuk membantu kami mempersembahkan pelayanan istimewa khusus bagi Anda.",
    linkUrl: "",
    isActive: true,
    isGradientBg: true,
    gradientClass: "from-amber-500 via-orange-600 to-red-600",
    hideOverlayText: false
  },
  {
    id: "default-1",
    imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
    title: "Selamat Datang di Pustaka Digital",
    description: "Temukan ribuan koleksi buku elektronik, jurnal ilmiah, dan referensi berharga yang siap mendukung riset dan hobi membaca Anda.",
    linkUrl: "",
    isActive: true,
    isGradientBg: false,
    hideOverlayText: false
  },
  {
    id: "default-2",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
    title: "Membaca Dimana Saja, Kapan Saja",
    description: "Akses koleksi buku digital kami secara online langsung dari smartphone, tablet, atau laptop Anda tanpa batasan ruang.",
    linkUrl: "",
    isActive: true,
    isGradientBg: false,
    hideOverlayText: false
  }
];

export const GRADIENT_PRESETS = [
  { name: "Indigo Purple (Default)", value: "from-indigo-600 via-indigo-500 to-purple-600" },
  { name: "Sunset Orange", value: "from-amber-500 via-orange-600 to-red-600" },
  { name: "Ocean Breeze", value: "from-blue-600 via-cyan-500 to-teal-500" },
  { name: "Forest Moss", value: "from-emerald-700 via-emerald-500 to-teal-600" },
  { name: "Deep Galaxy", value: "from-slate-900 via-violet-950 to-indigo-900" },
];

export function SliderConfig({ config, slides, showSlider, onSaveSlides, onToggleShowSlider }: SliderConfigProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Spreadsheet sync states
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveSliderToSpreadsheet = async () => {
    if (!config || !config.gasUrl || !config.sheetId) {
      setSaveStatus('error');
      setSaveMessage('Koneksi Google Sheets / Apps Script belum dikonfigurasi. Lengkapilah di tab Koneksi & Database.');
      return;
    }

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
        sheetIdOffline: config.sheetIdOffline || '',
        adminTimeoutMinutes: config.adminTimeoutMinutes !== undefined ? config.adminTimeoutMinutes : 15,
        sliderItems: JSON.stringify(slides),
        showSlider: String(showSlider)
      });

      if (response.success) {
        setSaveStatus('success');
        setSaveMessage('Konfigurasi spanduk berhasil disimpan dan disinkronkan ke Spreadsheet!');
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
  
  // Form states for Add/Edit
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImgUrl, setFormImgUrl] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formIsGradientBg, setFormIsGradientBg] = useState(false);
  const [formGradientClass, setFormGradientClass] = useState("from-indigo-600 via-indigo-500 to-purple-600");
  const [formHideOverlayText, setFormHideOverlayText] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isAdding, setIsAdding] = useState(false);

  const resetForm = () => {
    setFormTitle("");
    setFormDesc("");
    setFormImgUrl("");
    setFormLinkUrl("");
    setFormIsGradientBg(false);
    setFormGradientClass("from-indigo-600 via-indigo-500 to-purple-600");
    setFormHideOverlayText(false);
    setEditingId(null);
    setIsAdding(false);
    setIsUploading(false);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (slide: SliderItem) => {
    resetForm();
    setEditingId(slide.id);
    setFormTitle(slide.title);
    setFormDesc(slide.description);
    setFormImgUrl(slide.imageUrl);
    setFormLinkUrl(slide.linkUrl || "");
    setFormIsGradientBg(!!slide.isGradientBg);
    setFormGradientClass(slide.gradientClass || "from-indigo-600 via-indigo-500 to-purple-600");
    setFormHideOverlayText(!!slide.hideOverlayText);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormImgUrl(event.target.result as string);
        setFormIsGradientBg(false); // Disable gradient if they upload an image
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert("Gagal membaca file gambar.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIsGradientBg && !formImgUrl.trim()) {
      alert("Harap masukkan URL gambar atau unggah file gambar terlebih dahulu.");
      return;
    }

    if (isAdding) {
      const newSlide: SliderItem = {
        id: "slide_" + Date.now(),
        imageUrl: formIsGradientBg ? "" : formImgUrl.trim(),
        title: formHideOverlayText ? "" : formTitle.trim(),
        description: formHideOverlayText ? "" : formDesc.trim(),
        linkUrl: formLinkUrl.trim(),
        isActive: true,
        isGradientBg: formIsGradientBg,
        gradientClass: formGradientClass,
        hideOverlayText: formHideOverlayText
      };
      onSaveSlides([...slides, newSlide]);
    } else if (editingId) {
      const updated = slides.map(s => {
        if (s.id === editingId) {
          return {
            ...s,
            imageUrl: formIsGradientBg ? "" : formImgUrl.trim(),
            title: formHideOverlayText ? "" : formTitle.trim(),
            description: formHideOverlayText ? "" : formDesc.trim(),
            linkUrl: formLinkUrl.trim(),
            isGradientBg: formIsGradientBg,
            gradientClass: formGradientClass,
            hideOverlayText: formHideOverlayText
          };
        }
        return s;
      });
      onSaveSlides(updated);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus slide ini?")) {
      onSaveSlides(slides.filter(s => s.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = slides.map(s => {
      if (s.id === id) {
        return { ...s, isActive: !s.isActive };
      }
      return s;
    });
    onSaveSlides(updated);
  };

  const handleResetToDefault = () => {
    if (confirm("Apakah Anda yakin ingin mengatur ulang slider ke banner bawaan perpustakaan?")) {
      onSaveSlides(DEFAULT_SLIDES);
    }
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;
    
    onSaveSlides(newSlides);
  };

  return (
    <div id="slider-config-panel" className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-indigo-100/10 overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
      {/* Header Panel */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-950 flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-500" />
            Pengaturan Banner Promosi & Kiosk
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola dan urutkan spanduk (banner) interaktif yang tampil di bagian paling atas halaman pengunjung Kiosk.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-gray-200/50 self-start sm:self-center">
          {/* Master Toggle with modern design */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Status Slider:
            </span>
            <button
              type="button"
              onClick={() => onToggleShowSlider(!showSlider)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showSlider ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showSlider ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-extrabold ${showSlider ? "text-indigo-600" : "text-gray-400"}`}>
              {showSlider ? "Tampil" : "Sembunyi"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Save Status Notification */}
        {saveStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-800 flex items-start gap-3 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{saveMessage}</p>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{saveMessage}</p>
          </div>
        )}

        {/* Toggle Warning */}
        {!showSlider && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 flex items-start gap-3 animate-in fade-in">
            <EyeOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Slider Sedang Dinonaktifkan</p>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                Slider spanduk saat ini disembunyikan dari layar utama pengunjung. Aktifkan sakelar status di pojok kanan atas untuk menampilkannya kembali ke publik.
              </p>
            </div>
          </div>
        )}

        {/* Add / Edit Form */}
        {(isAdding || editingId) && (
          <form onSubmit={handleSaveForm} className="p-6 bg-slate-50 border border-gray-200/60 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-1">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Image className="w-4 h-4 text-indigo-500" />
                {isAdding ? "Tambah Slide Baru" : "Edit Setelan Slide"}
              </h3>
              <button 
                type="button" 
                onClick={resetForm} 
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                title="Batal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Type Settings */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-3 rounded-xl border border-gray-200">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsGradientBg}
                    onChange={(e) => {
                      setFormIsGradientBg(e.target.checked);
                      if (e.target.checked) {
                        setFormImgUrl("");
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div className="text-xs font-bold text-gray-700">
                    Latar Warna Gradien
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formHideOverlayText}
                    onChange={(e) => {
                      setFormHideOverlayText(e.target.checked);
                      if (e.target.checked) {
                        setFormTitle("");
                        setFormDesc("");
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div className="text-xs font-bold text-gray-700">
                    Hanya Gambar (Penuh)
                  </div>
                </label>

                <div className="text-right text-[10px] text-gray-400 self-center">
                  * Centang "Hanya Gambar" jika desain spanduk sudah berisi tulisan.
                </div>
              </div>

              {/* Background Selection: Image vs Gradient */}
              {formIsGradientBg ? (
                /* Gradient selection options */
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Pilih Skema Warna Gradien <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormGradientClass(preset.value)}
                        className={`p-3 rounded-xl border text-left transition-all bg-white cursor-pointer ${
                          formGradientClass === preset.value
                            ? "border-indigo-600 ring-4 ring-indigo-500/10 bg-indigo-50/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`h-8 w-full rounded-lg bg-gradient-to-r ${preset.value} mb-1.5 shadow-sm`} />
                        <span className="text-[10px] font-extrabold text-gray-800 block truncate leading-tight">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Image input with upload capabilities */
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Unggah Berkas Banner <span className="text-gray-400 font-normal font-sans text-[10px]">(Format Gambar)</span>
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer bg-white hover:bg-slate-50 hover:border-indigo-500 transition-all flex flex-col items-center justify-center h-[96px]"
                    >
                      <Upload className="w-5 h-5 text-gray-400 mb-1 animate-pulse" />
                      <span className="text-xs font-bold text-indigo-600">
                        {isUploading ? "Membaca berkas..." : "Pilih File Gambar"}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG, WEBP (Maks 1MB)</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Atau Gunakan Tautan Gambar Eksternal
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Link className="w-3.5 h-3.5" />
                      </div>
                      <textarea
                        required={!formIsGradientBg}
                        placeholder="Tempel URL gambar di sini (mis. Unsplash atau Google Drive)..."
                        value={formImgUrl}
                        onChange={(e) => setFormImgUrl(e.target.value)}
                        rows={3}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-white resize-none h-[96px] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Title & Description (Hidden if hideOverlayText is checked) */}
              {!formHideOverlayText && (
                <>
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Judul Utama Spanduk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={!formHideOverlayText}
                      placeholder="Contoh: Pengumuman Layanan Perpustakaan Digital"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 transition-all bg-white"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Keterangan Detail Spanduk <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required={!formHideOverlayText}
                      placeholder="Tulis keterangan menarik pendukung yang akan tampil di bawah judul utama..."
                      value={formDesc}
                      rows={2}
                      onChange={(e) => setFormDesc(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 transition-all bg-white resize-none"
                    />
                  </div>
                </>
              )}

              {/* Action Link URL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Tautan Klik Spanduk <span className="text-gray-400 font-normal font-sans text-[10px]">(Opsional - Mengarahkan pembaca ketika banner diklik)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://... (contoh: link Google Form, website, atau artikel)"
                  value={formLinkUrl}
                  onChange={(e) => setFormLinkUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-mono text-gray-800 placeholder-gray-400 transition-all bg-white"
                />
              </div>
            </div>

            {/* Live Preview within Config Form */}
            {!formIsGradientBg && formImgUrl && (
              <div className="mt-3 p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 block mb-1">PREVIEW VISUAL GAMBAR:</span>
                <div className="w-full h-32 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden relative">
                  <img src={formImgUrl} alt="Form Preview" className="w-full h-full object-cover" />
                  {formHideOverlayText && (
                    <div className="absolute right-3 top-3 bg-indigo-600 backdrop-blur-sm text-[9px] text-white px-2.5 py-1 rounded-full font-bold shadow-md">
                      Gambar Visual Penuh
                    </div>
                  )}
                </div>
              </div>
            )}

            {formIsGradientBg && (
              <div className="mt-3 p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 block mb-1">PREVIEW SETELAN GRADIEN:</span>
                <div className={`w-full h-24 rounded-lg bg-gradient-to-r ${formGradientClass} flex flex-col justify-center px-4 text-white shadow-inner relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl" />
                  <p className="text-xs font-black uppercase tracking-widest text-white/60">Contoh Banner</p>
                  <p className="text-sm font-extrabold truncate mt-0.5">{formTitle || "Koleksi Buku Baru Tersedia"}</p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-extrabold hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan Setelan Slide
              </button>
            </div>
          </form>
        )}

        {/* Action controls for list */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-gray-200/60">
          <button
            type="button"
            onClick={handleStartAdd}
            disabled={isAdding || !!editingId}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
          >
            <Plus className="w-4 h-4" />
            Tambah Slide Spanduk Baru
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all border border-gray-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Atur Ulang ke Bawaan
          </button>
        </div>

        {/* List of existing slides */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50/20">
          {slides.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm bg-white">
              <Sparkles className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold">Belum ada slide banner yang aktif.</p>
              <p className="text-xs text-gray-400 mt-1">Silakan klik tombol "Tambah Slide Baru" di atas untuk memulai.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 bg-white">
              {slides.map((slide, index) => (
                <div 
                  key={slide.id} 
                  className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-slate-50/50 ${
                    !slide.isActive ? "bg-slate-50/30 opacity-60" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Image thumbnail / Gradient preview with elegant card wrapper */}
                    <div className="w-28 h-16 rounded-xl bg-gray-100 border border-gray-200/80 overflow-hidden flex-shrink-0 relative flex items-center justify-center shadow-sm">
                      {slide.isGradientBg ? (
                        <div className={`w-full h-full bg-gradient-to-br ${slide.gradientClass || "from-indigo-500 to-purple-600"} flex items-center justify-center`}>
                          <Sparkles className="w-5 h-5 text-white/40" />
                        </div>
                      ) : (
                        <img 
                          src={slide.imageUrl} 
                          alt={slide.title || "Preview"} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/5" />
                    </div>

                    {/* Metadata text with elegant modern spacing */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-gray-900 truncate max-w-[240px]">
                          {slide.hideOverlayText ? "Desain Gambar Mandiri" : (slide.title || "Tanpa Judul")}
                        </h4>
                        {!slide.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                            Nonaktif
                          </span>
                        )}
                        {slide.isGradientBg && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                            Warna Gradien
                          </span>
                        )}
                        {slide.hideOverlayText && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                            Penuh
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {slide.hideOverlayText ? "Menampilkan visual gambar penuh tanpa teks overlay bawaan." : (slide.description || "Tanpa deskripsi")}
                      </p>
                      {slide.linkUrl && (
                        <p className="text-[10px] text-indigo-500 font-mono truncate flex items-center gap-1">
                          <Link className="w-3 h-3 text-indigo-400" /> Tautan: {slide.linkUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Ordering in customized beautiful capsules */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center bg-slate-50 p-2 sm:p-0 border sm:border-0 border-gray-100 rounded-xl">
                    {/* Ordering Buttons */}
                    <div className="flex items-center border border-gray-200 bg-white rounded-xl shadow-sm">
                      <button
                        type="button"
                        onClick={() => moveSlide(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-indigo-600 disabled:opacity-20 rounded-l-xl transition-colors cursor-pointer"
                        title="Geser Naik"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(index, 'down')}
                        disabled={index === slides.length - 1}
                        className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-indigo-600 disabled:opacity-20 rounded-r-xl border-l border-gray-200 transition-colors cursor-pointer"
                        title="Geser Turun"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Active/Draft Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(slide.id)}
                      className={`p-2 rounded-xl transition-colors border shadow-sm cursor-pointer ${
                        slide.isActive 
                          ? "text-green-700 bg-green-50 border-green-200 hover:bg-green-100/70" 
                          : "text-gray-400 bg-white border-gray-200 hover:bg-gray-100"
                      }`}
                      title={slide.isActive ? "Sembunyikan Spanduk" : "Tampilkan Spanduk"}
                    >
                      {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(slide)}
                      className="p-2 text-indigo-600 bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl transition-colors shadow-sm cursor-pointer"
                      title="Edit Detail Spanduk"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(slide.id)}
                      className="p-2 text-red-600 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 rounded-xl transition-colors shadow-sm cursor-pointer"
                      title="Hapus Spanduk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
