import React, { useState } from "react";
import { DriveFile, BookMetadata } from "../types";
import { FileText, Loader2, ArrowRight, Tag } from "lucide-react";

interface StockListProps {
  files: DriveFile[];
  metadata: Record<string, BookMetadata>;
  isLoading: boolean;
  onCategorize: (
    fileId: string, 
    title: string, 
    category: string, 
    author?: string, 
    publisher?: string, 
    year?: string
  ) => Promise<void>;
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

export function StockList({ files, metadata, isLoading, onCategorize }: StockListProps) {
  const stockFiles = files.filter(f => !metadata[f.id] || metadata[f.id].status === 'stock');

  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // State for forms in the list
  const [formState, setFormState] = useState<Record<string, { 
    title: string; 
    category: string;
    author: string;
    publisher: string;
    year: string;
  }>>({});

  const handleInitForm = (file: DriveFile) => {
    if (!formState[file.id]) {
      setFormState(prev => ({
        ...prev,
        [file.id]: {
          title: file.name.replace(/\.pdf$/i, ""),
          category: CATEGORIES[0],
          author: "",
          publisher: "",
          year: ""
        }
      }));
    }
  };

  const handleTitleChange = (fileId: string, title: string) => {
    setFormState(prev => ({ ...prev, [fileId]: { ...prev[fileId], title } }));
  };

  const handleCategoryChange = (fileId: string, category: string) => {
    setFormState(prev => ({ ...prev, [fileId]: { ...prev[fileId], category } }));
  };

  const handleAuthorChange = (fileId: string, author: string) => {
    setFormState(prev => ({ ...prev, [fileId]: { ...prev[fileId], author } }));
  };

  const handlePublisherChange = (fileId: string, publisher: string) => {
    setFormState(prev => ({ ...prev, [fileId]: { ...prev[fileId], publisher } }));
  };

  const handleYearChange = (fileId: string, year: string) => {
    setFormState(prev => ({ ...prev, [fileId]: { ...prev[fileId], year } }));
  };

  const handleSubmit = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    const rawData = formState[fileId];
    const finalTitle = rawData?.title !== undefined ? rawData.title : file.name.replace(/\.pdf$/i, "");
    const finalCategory = rawData?.category !== undefined ? rawData.category : CATEGORIES[0];
    const finalAuthor = rawData?.author || "";
    const finalPublisher = rawData?.publisher || "";
    const finalYear = rawData?.year || "";

    if (!finalTitle.trim()) return;
    
    setProcessingId(fileId);
    try {
      await onCategorize(
        fileId, 
        finalTitle.trim(), 
        finalCategory, 
        finalAuthor.trim() || undefined, 
        finalPublisher.trim() || undefined, 
        finalYear.trim() || undefined
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Menyinkronkan file mentah dari Google Drive...</p>
      </div>
    );
  }

  if (stockFiles.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Tidak ada buku mentah di stok.</p>
        <p className="text-gray-400 text-sm mt-1">Semua file Anda telah diklasifikasikan atau folder kosong.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stockFiles.map((file) => {
        // Ensure form state is initialized for this file without infinite loops
        const rawData = formState[file.id];
        const data = {
          title: rawData?.title !== undefined ? rawData.title : file.name.replace(/\.pdf$/i, ""),
          category: rawData?.category !== undefined ? rawData.category : CATEGORIES[0],
          author: rawData?.author !== undefined ? rawData.author : "",
          publisher: rawData?.publisher !== undefined ? rawData.publisher : "",
          year: rawData?.year !== undefined ? rawData.year : ""
        };
        
        return (
          <div 
            key={file.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow group"
            onMouseEnter={() => handleInitForm(file)}
          >
            {/* Left Section: Raw File Info */}
            <div className="w-full md:w-5/12 p-6 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 flex gap-4 items-start">
              {/* Thumbnail */}
              <div className="w-24 sm:w-28 flex-shrink-0 relative aspect-[2/3] bg-gradient-to-br from-indigo-50 to-pink-50 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-gray-400">
                   <FileText className="w-8 h-8 mb-2 opacity-50" />
                   <span className="text-[10px] break-all line-clamp-3 font-medium px-2">{file.name}</span>
                </div>
                <img 
                   src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w600`}
                  alt={file.name}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">File Mentah</div>
                <h3 className="text-sm font-semibold text-gray-800 break-all line-clamp-3 leading-snug">{file.name}</h3>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                  Ditambahkan {new Date(file.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Right Section: Categorization Form */}
            <div className="flex-1 p-6 flex flex-col justify-center bg-white">
              <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4">Pengkategorian & Metadata</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    JUDUL BUKU KUSTOM <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.title}
                    onChange={(e) => handleTitleChange(file.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50 focus:bg-white transition-colors"
                    placeholder="Masukkan judul buku yang rapi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    PILIH KATEGORI <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={data.category}
                      onChange={(e) => handleCategoryChange(file.id, e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none bg-gray-50/50 focus:bg-white transition-colors cursor-pointer"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Detail Tambahan - Standardized with same font sizes and labels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">PENULIS / PENGARANG</label>
                  <input
                    type="text"
                    value={data.author}
                    onChange={(e) => handleAuthorChange(file.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50 focus:bg-white transition-colors"
                    placeholder="Nama Penulis"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">PENERBIT</label>
                  <input
                    type="text"
                    value={data.publisher}
                    onChange={(e) => handlePublisherChange(file.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50 focus:bg-white transition-colors"
                    placeholder="Nama Penerbit"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">TAHUN TERBIT</label>
                  <input
                    type="text"
                    value={data.year}
                    onChange={(e) => handleYearChange(file.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50 focus:bg-white transition-colors"
                    placeholder="Tahun"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-auto pt-1">
                <button
                  onClick={() => handleSubmit(file.id)}
                  disabled={processingId === file.id || !data.title.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm shadow-indigo-200 w-full sm:w-auto justify-center"
                >
                  {processingId === file.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Tambahkan ke Koleksi <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
