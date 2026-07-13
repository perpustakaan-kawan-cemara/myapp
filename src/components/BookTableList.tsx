import React, { useState, useEffect } from "react";
import { DriveFile, BookMetadata, GasConfig, BorrowLog } from "../types";
import { 
  Edit2, Check, X, Tag, Plus, Trash2, Search, Wifi, WifiOff, 
  BookOpen, PlusCircle, AlertCircle, Save, Layers, BookMarked, HelpCircle, History, Loader2, Calendar, Clock, User, Download, Upload
} from "lucide-react";
import { fetchBorrowLogsFromGas } from "../api";

interface BookTableListProps {
  files: DriveFile[];
  metadata: Record<string, BookMetadata>;
  config: GasConfig;
  onUpdateBook: (fileId: string, newTitle: string, newCategory: string) => Promise<void>;
  onUpdateMetadata: (newMetadata: Record<string, BookMetadata>) => Promise<void>;
}

const CATEGORIES = [
  "000 - Karya Umum & Ilmu Komputer",
  "100 - Filsafat & Psikologi",
  "200 - Agama",
  "300 - Ilmu Sosial",
  "400 - Bahasa",
  "500 - Ilmu Murni",
  "600 - Teknologi (Ilmu Terapan)",
  "700 - Kesenian & Hiburan",
  "800 - Sastra",
  "900 - Sejarah & Geografi"
];

export function BookTableList({ files, metadata, config, onUpdateBook, onUpdateMetadata }: BookTableListProps) {
  const [subTab, setSubTab] = useState<'online' | 'offline'>('online');
  const [searchQuery, setSearchQuery] = useState("");
  
  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyBookTitle, setHistoryBookTitle] = useState("");
  const [historyLogs, setHistoryLogs] = useState<BorrowLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  
  const openHistoryModal = async (bookTitle: string) => {
    setHistoryBookTitle(bookTitle);
    setHistoryModalOpen(true);
    setIsLoadingHistory(true);
    setHistoryError("");
    setHistoryLogs([]);
    
    try {
      const response = await fetchBorrowLogsFromGas(config);
      if (response.success && response.borrowLogs) {
        // Filter by the selected book's title
        const logsForBook = response.borrowLogs.filter(log => log.namaBuku === bookTitle);
        // Sort newest first
        logsForBook.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setHistoryLogs(logsForBook);
      } else {
        setHistoryError(response.error || "Gagal mengambil riwayat peminjaman.");
      }
    } catch (err: any) {
      setHistoryError(err.message || "Gagal mengambil riwayat peminjaman.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Online Books State
  const [editingOnlineId, setEditingOnlineId] = useState<string | null>(null);
  const [editOnlineTitle, setEditOnlineTitle] = useState("");
  const [editOnlineCategory, setEditOnlineCategory] = useState("");
  const [isSavingOnline, setIsSavingOnline] = useState(false);

  // Offline Books State
  const [showOfflineForm, setShowOfflineForm] = useState(false);
  const [editingOfflineId, setEditingOfflineId] = useState<string | null>(null);
  
  // Offline Book Form Fields
  const [offlineTitle, setOfflineTitle] = useState("");
  const [offlineCategory, setOfflineCategory] = useState(CATEGORIES[0]);
  const [offlineAuthor, setOfflineAuthor] = useState("");
  const [offlinePublisher, setOfflinePublisher] = useState("");
  const [offlineYear, setOfflineYear] = useState("");
  const [offlineStock, setOfflineStock] = useState("1");
  const [offlineLocation, setOfflineLocation] = useState("");
  const [offlineCoverUrl, setOfflineCoverUrl] = useState("");
  const [isSavingOffline, setIsSavingOffline] = useState(false);

  // Filter book lists
  const onlineBooks = files.filter(f => metadata[f.id] && metadata[f.id].status === 'collection');
  const offlineBooks = Object.values(metadata).filter(m => m.isOffline);

  const filteredOnline = onlineBooks.filter(file => {
    const book = metadata[file.id];
    const title = book?.title || file.name;
    const category = book?.category || "";
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredOffline = offlineBooks.filter(book => {
    const title = book.title || "";
    const category = book.category || "";
    const author = book.author || "";
    const location = book.location || "";
    const code = book.id || "";
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           category.toLowerCase().includes(searchQuery.toLowerCase()) ||
           author.toLowerCase().includes(searchQuery.toLowerCase()) ||
           code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           location.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Online Edit handlers
  const handleEditOnlineClick = (fileId: string) => {
    const book = metadata[fileId];
    setEditOnlineTitle(book?.title || "");
    setEditOnlineCategory(book?.category || CATEGORIES[0]);
    setEditingOnlineId(fileId);
  };

  const handleCancelOnlineEdit = () => {
    setEditingOnlineId(null);
    setEditOnlineTitle("");
    setEditOnlineCategory("");
  };

  const handleSaveOnline = async (fileId: string) => {
    if (!editOnlineTitle.trim()) return;
    setIsSavingOnline(true);
    try {
      await onUpdateBook(fileId, editOnlineTitle, editOnlineCategory);
      setEditingOnlineId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingOnline(false);
    }
  };

  const handleDeleteOnline = async (fileId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus buku digital ini dari katalog? File akan dikembalikan ke Arsip Drive Masuk.")) {
      return;
    }
    const updatedMetadata = { ...metadata };
    delete updatedMetadata[fileId];
    try {
      await onUpdateMetadata(updatedMetadata);
    } catch (err) {
      console.error(err);
    }
  };

  // Offline Form actions
  const openAddOffline = () => {
    setOfflineTitle("");
    setOfflineCategory(CATEGORIES[0]);
    setOfflineAuthor("");
    setOfflinePublisher("");
    setOfflineYear("");
    setOfflineStock("1");
    setOfflineLocation("");
    setOfflineCoverUrl("");
    setEditingOfflineId(null);
    setShowOfflineForm(true);
  };

  const openEditOffline = (book: BookMetadata) => {
    setOfflineTitle(book.title);
    setOfflineCategory(book.category || CATEGORIES[0]);
    setOfflineAuthor(book.author || "");
    setOfflinePublisher(book.publisher || "");
    setOfflineYear(book.year || "");
    setOfflineStock(String(book.stock || 1));
    setOfflineLocation(book.location || "");
    setOfflineCoverUrl(book.coverUrl || "");
    setEditingOfflineId(book.id);
    setShowOfflineForm(true);
  };

  const handleSaveOffline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineTitle.trim()) return;

    setIsSavingOffline(true);
    const bookId = editingOfflineId || `off-${Math.random().toString(36).substring(2, 11)}`;
    
    const newOfflineBook: BookMetadata = {
      id: bookId,
      status: 'collection',
      category: offlineCategory,
      title: offlineTitle.trim(),
      isOffline: true,
      author: offlineAuthor.trim() || undefined,
      publisher: offlinePublisher.trim() || undefined,
      year: offlineYear.trim() || undefined,
      stock: parseInt(offlineStock) || 0,
      location: offlineLocation.trim() || undefined,
      coverUrl: offlineCoverUrl.trim() || undefined,
      addedToCollectionAt: metadata[bookId]?.addedToCollectionAt || new Date().toISOString()
    };

    const updatedMetadata = {
      ...metadata,
      [bookId]: newOfflineBook
    };

    try {
      await onUpdateMetadata(updatedMetadata);
      setShowOfflineForm(false);
      // Reset form
      setOfflineTitle("");
      setOfflineAuthor("");
      setOfflinePublisher("");
      setOfflineYear("");
      setOfflineStock("1");
      setOfflineLocation("");
      setEditingOfflineId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingOffline(false);
    }
  };

  const handleDeleteOffline = async (bookId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus buku offline ini dari pendataan?")) {
      return;
    }

    const updatedMetadata = { ...metadata };
    delete updatedMetadata[bookId];

    try {
      await onUpdateMetadata(updatedMetadata);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportOfflineBooks = () => {
    if (offlineBooks.length === 0) {
      alert("Tidak ada data buku offline untuk diekspor.");
      return;
    }

    const headers = ["ID", "Judul", "Kategori", "Penulis", "Penerbit", "Tahun", "Stok", "Lokasi", "URL Cover"];
    const csvContent = [
      headers.join(","),
      ...offlineBooks.map(book => {
        return [
          `"${book.id}"`,
          `"${(book.title || "").replace(/"/g, '""')}"`,
          `"${(book.category || "").replace(/"/g, '""')}"`,
          `"${(book.author || "").replace(/"/g, '""')}"`,
          `"${(book.publisher || "").replace(/"/g, '""')}"`,
          `"${(book.year || "").replace(/"/g, '""')}"`,
          `"${book.stock || 0}"`,
          `"${(book.location || "").replace(/"/g, '""')}"`,
          `"${(book.coverUrl || "").replace(/"/g, '""')}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `buku_offline_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = ["Judul", "Kategori", "Penulis", "Penerbit", "Tahun", "Stok", "Lokasi", "URL Cover"];
    const sampleRow = ["Buku Contoh", "000 - Karya Umum & Ilmu Komputer", "Penulis A", "Penerbit B", "2023", "5", "Rak 1", "https://example.com/cover.jpg"];
    
    const csvContent = [
      headers.join(","),
      sampleRow.map(v => `"${v}"`).join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_buku_offline.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportOfflineBooks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length <= 1) {
        alert("File CSV kosong atau tidak valid.");
        return;
      }

      // Very basic CSV parser for simple imports (assumes correct formatting without complex escapes within quotes containing newlines)
      const parseCsvLine = (line: string) => {
        const row: string[] = [];
        let inQuotes = false;
        let currentValue = "";
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(currentValue);
            currentValue = "";
          } else {
            currentValue += char;
          }
        }
        row.push(currentValue);
        return row;
      };

      const headers = parseCsvLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
      
      const newMetadata = { ...metadata };
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        // Handle ID mapping if it exists, otherwise generate one
        const hasIdCol = headers[0].toLowerCase() === "id";
        
        const titleIdx = headers.findIndex(h => h.toLowerCase() === "judul");
        const categoryIdx = headers.findIndex(h => h.toLowerCase() === "kategori");
        const authorIdx = headers.findIndex(h => h.toLowerCase() === "penulis");
        const publisherIdx = headers.findIndex(h => h.toLowerCase() === "penerbit");
        const yearIdx = headers.findIndex(h => h.toLowerCase() === "tahun");
        const stockIdx = headers.findIndex(h => h.toLowerCase() === "stok");
        const locationIdx = headers.findIndex(h => h.toLowerCase() === "lokasi");
        const coverUrlIdx = headers.findIndex(h => h.toLowerCase() === "url cover" || h.toLowerCase() === "cover" || h.toLowerCase() === "url_cover");

        if (titleIdx === -1) continue; // Skip invalid rows missing Title

        const title = row[titleIdx]?.replace(/^"|"$/g, '').trim();
        if (!title) continue;

        const id = hasIdCol && row[0]?.replace(/^"|"$/g, '').trim() ? row[0].replace(/^"|"$/g, '').trim() : `offline_${Date.now()}_${i}`;
        
        newMetadata[id] = {
          id: id,
          status: 'collection',
          isOffline: true,
          title: title,
          category: categoryIdx !== -1 ? row[categoryIdx]?.replace(/^"|"$/g, '').trim() || CATEGORIES[0] : CATEGORIES[0],
          author: authorIdx !== -1 ? row[authorIdx]?.replace(/^"|"$/g, '').trim() || undefined : undefined,
          publisher: publisherIdx !== -1 ? row[publisherIdx]?.replace(/^"|"$/g, '').trim() || undefined : undefined,
          year: yearIdx !== -1 ? row[yearIdx]?.replace(/^"|"$/g, '').trim() || undefined : undefined,
          stock: stockIdx !== -1 ? parseInt(row[stockIdx]?.replace(/^"|"$/g, '').trim()) || 0 : 0,
          location: locationIdx !== -1 ? row[locationIdx]?.replace(/^"|"$/g, '').trim() || undefined : undefined,
          coverUrl: coverUrlIdx !== -1 ? row[coverUrlIdx]?.replace(/^"|"$/g, '').trim() || undefined : undefined
        };
        importedCount++;
      }

      if (importedCount > 0) {
        try {
          await onUpdateMetadata(newMetadata);
          alert(`Berhasil mengimpor ${importedCount} buku offline.`);
        } catch (err) {
          console.error(err);
          alert("Gagal menyimpan data buku hasil import.");
        }
      } else {
        alert("Tidak ada data valid yang bisa diimpor dari file ini.");
      }
    };
    
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Action buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setSubTab('online'); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              subTab === 'online'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Katalog Online ({onlineBooks.length})</span>
          </button>
          <button
            onClick={() => { setSubTab('offline'); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              subTab === 'offline'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <WifiOff className="w-4 h-4" />
            <span>Katalog Offline ({offlineBooks.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 md:justify-end">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={subTab === 'online' ? "Cari buku online..." : "Cari buku offline..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {subTab === 'offline' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all shadow-sm"
                title="Unduh Template CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Template</span>
              </button>
              
              <label
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
                title="Impor dari CSV"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Impor</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleImportOfflineBooks} 
                />
              </label>

              <button
                onClick={handleExportOfflineBooks}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all shadow-sm"
                title="Ekspor ke CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Ekspor</span>
              </button>

              <button
                onClick={openAddOffline}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Offline Entry Form Card */}
      {subTab === 'offline' && showOfflineForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-lg">
                {editingOfflineId ? "Edit Pendataan Buku Offline" : "Pendataan Buku Offline Baru"}
              </h3>
            </div>
            <button 
              onClick={() => setShowOfflineForm(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveOffline} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Judul Buku <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengantar Algoritma dan Pemrograman"
                  value={offlineTitle}
                  onChange={(e) => setOfflineTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Kategori / Klasifikasi DDC</label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={offlineCategory}
                    onChange={(e) => setOfflineCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none bg-white cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Penulis / Pengarang</label>
                <input
                  type="text"
                  placeholder="Contoh: Prof. Dr. Ir. Budi"
                  value={offlineAuthor}
                  onChange={(e) => setOfflineAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Penerbit</label>
                <input
                  type="text"
                  placeholder="Contoh: Penerbit Erlangga"
                  value={offlinePublisher}
                  onChange={(e) => setOfflinePublisher(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Tahun</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="2024"
                    value={offlineYear}
                    onChange={(e) => setOfflineYear(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center font-semibold"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Stok</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="1"
                    value={offlineStock}
                    onChange={(e) => setOfflineStock(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center font-semibold"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Lokasi Rak</label>
                  <input
                    type="text"
                    placeholder="Rak A3"
                    value={offlineLocation}
                    onChange={(e) => setOfflineLocation(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center font-semibold uppercase"
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Cover URL (Opsional)</label>
                <input
                  type="text"
                  placeholder="https://example.com/cover.jpg"
                  value={offlineCoverUrl}
                  onChange={(e) => setOfflineCoverUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowOfflineForm(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors"
                disabled={isSavingOffline}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
                disabled={isSavingOffline}
              >
                <Save className="w-4 h-4" />
                <span>{isSavingOffline ? "Menyimpan..." : "Simpan Data"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Online Books Tab Content */}
      {subTab === 'online' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 w-1/4">Judul Buku</th>
                  <th className="px-6 py-4 w-1/4">Klasifikasi (Kategori)</th>
                  <th className="px-6 py-4 w-1/4">Detail Pengarang / Penerbit</th>
                  <th className="px-6 py-4">Nama File Asli</th>
                  <th className="px-6 py-4 w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOnline.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-gray-400" />
                      <p className="font-medium text-gray-500">Tidak ada buku online yang cocok.</p>
                      <p className="text-xs text-gray-400 mt-1">Ubah kata kunci pencarian Anda atau sinkronkan koleksi Anda.</p>
                    </td>
                  </tr>
                )}
                
                {filteredOnline.map(file => {
                  const book = metadata[file.id];
                  const isEditing = editingOnlineId === file.id;
                  const title = book?.title || file.name;
                  const category = book?.category || 'Tidak Berkategori';
                  
                  return (
                    <tr key={file.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editOnlineTitle}
                            onChange={(e) => setEditOnlineTitle(e.target.value)}
                            className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900"
                            disabled={isSavingOnline}
                          />
                        ) : (
                          <div className="font-semibold text-gray-900 line-clamp-2">{title}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="relative">
                            <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <select
                              value={editOnlineCategory}
                              onChange={(e) => setEditOnlineCategory(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none bg-white cursor-pointer"
                              disabled={isSavingOnline}
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5">
                          {book?.author && (
                            <div>
                              <span className="text-gray-400">Penulis:</span>{" "}
                              <span className="font-medium text-gray-700">{book.author}</span>
                            </div>
                          )}
                          {book?.publisher && (
                            <div>
                              <span className="text-gray-400">Penerbit:</span>{" "}
                              <span className="font-medium text-gray-700">{book.publisher}</span>
                            </div>
                          )}
                          {book?.year && (
                            <div>
                              <span className="text-gray-400">Tahun:</span>{" "}
                              <span className="font-medium text-gray-700">{book.year}</span>
                            </div>
                          )}
                          {!book?.author && !book?.publisher && !book?.year && (
                            <span className="text-gray-400 italic">Tidak ada detail</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-xs text-gray-500 break-all">{file.name}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={handleCancelOnlineEdit}
                              disabled={isSavingOnline}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSaveOnline(file.id)}
                              disabled={isSavingOnline || !editOnlineTitle.trim()}
                              className="p-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => openHistoryModal(title)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Riwayat Peminjaman"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditOnlineClick(file.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteOnline(file.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus dari Katalog"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Offline Books Tab Content */}
      {subTab === 'offline' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 w-28">Kode Buku</th>
                  <th className="px-6 py-4 w-1/4">Judul Buku</th>
                  <th className="px-6 py-4 w-1/4">Klasifikasi</th>
                  <th className="px-6 py-4 w-1/5">Detail Pengarang / Penerbit</th>
                  <th className="px-6 py-4 text-center w-20">Stok</th>
                  <th className="px-6 py-4 text-center w-28">Lokasi Rak</th>
                  <th className="px-6 py-4 w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOffline.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <WifiOff className="w-10 h-10 mx-auto mb-2 opacity-40 text-gray-400" />
                      <p className="font-medium text-gray-500">Belum ada pendataan buku offline.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {searchQuery ? "Ubah kata kunci pencarian Anda." : "Klik tombol 'Tambah Buku' untuk memulai pencatatan buku fisik."}
                      </p>
                    </td>
                  </tr>
                )}

                {filteredOffline.map(book => {
                  const displayId = book.id.startsWith("off-") ? book.id.slice(4).toUpperCase() : book.id.toUpperCase();
                  
                  return (
                    <tr key={book.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">
                          {displayId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 leading-snug">{book.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5">
                          {book.author && (
                            <div>
                              <span className="text-gray-400">Penulis:</span>{" "}
                              <span className="font-medium text-gray-700">{book.author}</span>
                            </div>
                          )}
                          {book.publisher && (
                            <div>
                              <span className="text-gray-400">Penerbit:</span>{" "}
                              <span className="font-medium text-gray-700">{book.publisher}</span>
                            </div>
                          )}
                          {book.year && (
                            <div>
                              <span className="text-gray-400">Tahun:</span>{" "}
                              <span className="font-medium text-gray-700">{book.year}</span>
                            </div>
                          )}
                          {!book.author && !book.publisher && !book.year && (
                            <span className="text-gray-400 italic">Tidak ada detail</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          (book.stock || 0) > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-600'
                        }`}>
                          {book.stock || 0} Eks
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {book.location ? (
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded uppercase">
                            {book.location}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => openHistoryModal(book.title)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Riwayat Peminjaman"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditOffline(book)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Buku"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOffline(book.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Buku"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Riwayat Peminjaman</h3>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-md">{historyBookTitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setHistoryModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                  <p className="text-sm text-gray-500 font-medium">Memuat riwayat peminjaman...</p>
                </div>
              ) : historyError ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{historyError}</p>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Belum ada riwayat peminjaman untuk buku ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <th className="px-4 py-3">Tanggal Pinjam</th>
                        <th className="px-4 py-3">Peminjam</th>
                        <th className="px-4 py-3">Durasi</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historyLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-800">{log.namaPeminjam}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {log.durasiPeminjaman}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              log.status === "Kembali" ? "bg-green-100 text-green-800" :
                              log.status === "Ditolak" ? "bg-red-100 text-red-800" :
                              log.status === "Dipinjam" ? "bg-blue-100 text-blue-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {log.status || "Menunggu Persetujuan"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
