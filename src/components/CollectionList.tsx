import React, { useMemo, useState } from "react";
import { DriveFile, BookMetadata } from "../types";
import { getDriveImageUrl } from "../utils";
import { 
  Book, ExternalLink, Loader2, Tag, Search, Filter, Wifi, WifiOff, 
  MapPin, User, Building, Calendar, Hash, Info, X, BookOpen, LayoutGrid, List
} from "lucide-react";

interface CollectionListProps {
  files: DriveFile[];
  metadata: Record<string, BookMetadata>;
  isLoading: boolean;
  onBorrowBook?: (bookTitle: string) => void;
}

const CATEGORIES = [
  "Semua Kategori",
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

export function CollectionList({ files, metadata, isLoading, onBorrowBook }: CollectionListProps) {
  const [collectionTab, setCollectionTab] = useState<'digital' | 'fisik'>('digital');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Selected physical book for detail modal
  const [selectedPhysicalBook, setSelectedPhysicalBook] = useState<BookMetadata | null>(null);

  // Digital Books List
  const collectionFiles = files.filter(f => metadata[f.id] && metadata[f.id].status === 'collection');

  // Physical/Offline Books List
  const offlineBooks = Object.values(metadata).filter(m => m.isOffline);

  // Filter digital books
  const filteredDigital = useMemo(() => {
    return collectionFiles.filter(file => {
      const bookMetadata = metadata[file.id];
      const title = bookMetadata?.title || file.name;
      const category = bookMetadata?.category || 'Tidak Berkategori';

      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "Semua Kategori" || category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [collectionFiles, metadata, searchQuery, selectedCategory]);

  // Filter physical books
  const filteredPhysical = useMemo(() => {
    return offlineBooks.filter(book => {
      const title = book.title || "";
      const category = book.category || 'Tidak Berkategori';
      const author = book.author || "";
      const publisher = book.publisher || "";
      const code = book.id || "";

      const matchesSearch = 
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "Semua Kategori" || category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [offlineBooks, searchQuery, selectedCategory]);

  const renderModeAll = selectedCategory === "Semua Kategori";

  // Group Digital
  const groupedDigital = useMemo<Record<string, DriveFile[]>>(() => {
    if (renderModeAll) {
      const sorted = [...filteredDigital].sort((a, b) => {
        const titleA = (metadata[a.id]?.title || a.name).toLowerCase();
        const titleB = (metadata[b.id]?.title || b.name).toLowerCase();
        return titleA.localeCompare(titleB);
      });
      return { "Semua Buku Digital": sorted };
    }

    const groups: Record<string, typeof filteredDigital> = {};
    filteredDigital.forEach(file => {
      const cat = metadata[file.id].category || 'Tidak Berkategori';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(file);
    });
    return groups;
  }, [filteredDigital, metadata, renderModeAll]);

  // Group Physical
  const groupedPhysical = useMemo<Record<string, BookMetadata[]>>(() => {
    if (renderModeAll) {
      const sorted = [...filteredPhysical].sort((a, b) => {
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      });
      return { "Semua Buku Fisik": sorted };
    }

    const groups: Record<string, typeof filteredPhysical> = {};
    filteredPhysical.forEach(book => {
      const cat = book.category || 'Tidak Berkategori';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(book);
    });
    return groups;
  }, [filteredPhysical, renderModeAll]);

  if (isLoading && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Menyinkronkan perpustakaan dari Google Drive...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher - e-Book vs Buku Fisik */}
      <div className="flex w-full sm:w-fit bg-gray-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        <button
          onClick={() => { setCollectionTab('digital'); setSelectedCategory("Semua Kategori"); setSearchQuery(""); }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2.5 px-2.5 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            collectionTab === 'digital'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span className="truncate">Digital (e-Book)</span>
          <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full ${collectionTab === 'digital' ? 'bg-indigo-50 text-indigo-600 font-extrabold' : 'bg-gray-200 text-gray-600'}`}>
            {collectionFiles.length}
          </span>
        </button>
        <button
          onClick={() => { setCollectionTab('fisik'); setSelectedCategory("Semua Kategori"); setSearchQuery(""); }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2.5 px-2.5 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            collectionTab === 'fisik'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span className="truncate">Fisik (Offline)</span>
          <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full ${collectionTab === 'fisik' ? 'bg-indigo-50 text-indigo-600 font-extrabold' : 'bg-gray-200 text-gray-600'}`}>
            {offlineBooks.length}
          </span>
        </button>
      </div>

      {/* Filter Box */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={collectionTab === 'digital' ? "Cari e-book berdasarkan judul..." : "Cari buku fisik berdasarkan judul, penulis, kode..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none cursor-pointer text-gray-700"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {collectionTab === 'fisik' && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Tampilan Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Tampilan List"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Digital Books Render */}
      {collectionTab === 'digital' && (
        collectionFiles.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum ada e-book di perpustakaan digital.</p>
          </div>
        ) : Object.keys(groupedDigital).length === 0 || Object.values(groupedDigital).every((arr: any) => arr.length === 0) ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 font-medium">Tidak ada e-book yang ditemukan.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedDigital).map(([category, catFiles]: [string, DriveFile[]]) => (
              catFiles.length > 0 && (
                <div key={category} className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold text-gray-900">{category.includes(' - ') ? category.split(' - ')[1] : category}</h3>
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full ml-2">
                      {catFiles.length} Buku
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8">
                    {catFiles.map(file => {
                      const bookTitle = metadata[file.id]?.title || file.name;
                      const bookCategory = metadata[file.id]?.category || 'Tidak Berkategori';
                      const displayCategory = bookCategory.includes(' - ') ? bookCategory.split(' - ')[1] : bookCategory;
                      
                      return (
                        <div key={file.id} className="group relative flex flex-col cursor-pointer" onClick={() => window.open(file.url, '_blank')}>
                          {/* Book Cover */}
                          <div className="aspect-[2/3] w-full bg-gradient-to-br from-indigo-50 to-pink-50 border border-gray-150 rounded-xl mb-2 sm:mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 relative">
                            {/* Fallback Placeholder (Behind Image) */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                               <Book className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-300 mb-2 sm:mb-3 opacity-50" />
                               <span className="text-gray-700 font-bold text-[11px] sm:text-xs leading-snug line-clamp-4">{bookTitle}</span>
                            </div>

                            {/* Actual Thumbnail */}
                            <img 
                              src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w600`}
                              alt={bookTitle}
                              className="absolute inset-0 w-full h-full object-cover z-10"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Hover Action Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center z-20">
                              <div className="opacity-0 group-hover:opacity-100 bg-white text-indigo-600 rounded-full p-2 sm:p-2.5 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Metadata below cover */}
                          <h4 className="font-semibold text-gray-900 text-xs sm:text-sm leading-snug mb-0.5 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {bookTitle}
                          </h4>
                          
                          {metadata[file.id]?.author && (
                            <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate mb-1">
                              {metadata[file.id].author}
                            </p>
                          )}
                          
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-auto">
                            <div className="flex items-center truncate">
                              <span className="text-pink-600 font-bold truncate">{displayCategory}</span>
                              {metadata[file.id]?.year && (
                                <>
                                  <span className="mx-1 text-gray-300">•</span>
                                  <span className="truncate text-gray-600 font-semibold">{metadata[file.id].year}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        )
      )}

      {/* Physical Books Render */}
      {collectionTab === 'fisik' && (
        offlineBooks.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum ada koleksi buku fisik / offline.</p>
            <p className="text-gray-400 text-sm mt-1">Staf perpustakaan dapat mendata buku fisik lewat admin panel.</p>
          </div>
        ) : Object.keys(groupedPhysical).length === 0 || Object.values(groupedPhysical).every((arr: any) => arr.length === 0) ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 font-medium">Tidak ada buku fisik yang ditemukan.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedPhysical).map(([category, catBooks]: [string, BookMetadata[]]) => (
              catBooks.length > 0 && (
                <div key={category} className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold text-gray-900">{category.includes(' - ') ? category.split(' - ')[1] : category}</h3>
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full ml-2">
                      {catBooks.length} Buku Fisik
                    </span>
                  </div>
                  
                  <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8" : "flex flex-col gap-3"}>
                    {catBooks.map(book => {
                      const displayCategory = book.category?.includes(' - ') ? book.category.split(' - ')[1] : (book.category || "Fisik");
                      
                      if (viewMode === 'list') {
                        return (
                          <div 
                            key={book.id} 
                            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-gray-100 hover:border-emerald-200 rounded-xl cursor-pointer hover:shadow-md transition-all duration-200"
                            onClick={() => setSelectedPhysicalBook(book)}
                          >
                            <div className="flex items-center gap-4 flex-1 w-full">
                              <div className="w-12 h-16 sm:w-16 sm:h-24 bg-gray-100 rounded shadow-sm flex-shrink-0 overflow-hidden relative border border-gray-200">
                                {book.coverUrl ? (
                                  <img 
                                    src={getDriveImageUrl(book.coverUrl)} 
                                    alt={book.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Book className="w-6 h-6 opacity-50" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                                  {book.title}
                                </h4>
                                <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {book.author || "-"}</span>
                                  <span className="hidden sm:flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {book.publisher || "-"}</span>
                                  <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {book.id.startsWith("off-") ? book.id.slice(4).toUpperCase() : book.id.toUpperCase()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                               <div className="text-left sm:text-right">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase">Lokasi</div>
                                  <div className="text-xs font-bold text-amber-700 uppercase">{book.location || "-"}</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase">Sisa Stok</div>
                                  <div className="text-sm font-extrabold text-emerald-600">{book.stock || 0}</div>
                               </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={book.id} 
                          className="group relative flex flex-col cursor-pointer" 
                          onClick={() => setSelectedPhysicalBook(book)}
                        >
                          {/* Book Cover Design for Physical Book (Classic Hardcover style) */}
                          <div className="aspect-[2/3] w-full bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-900 border border-emerald-500/20 rounded-xl mb-2 sm:mb-3 overflow-hidden shadow-sm group-hover:shadow-lg hover:scale-[1.02] transition-all duration-300 relative flex flex-col justify-between p-3 sm:p-4">
                            {book.coverUrl && (
                              <img 
                                src={getDriveImageUrl(book.coverUrl)} 
                                alt={book.title} 
                                className="absolute inset-0 w-full h-full object-cover z-20"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {/* Texture overlay */}
                            <div className="absolute inset-0 bg-black/10 mix-blend-overlay opacity-40 pointer-events-none" />
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20" /> {/* Book Spine effect */}
                            
                            {/* Gold Badge or Star Indicator */}
                            <div className="flex justify-between items-start z-10">
                              <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-emerald-200 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10">
                                FISIK
                              </span>
                              {book.location && (
                                <span className="font-mono text-[8px] sm:text-[10px] font-bold text-yellow-300 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                                  {book.location}
                                </span>
                              )}
                            </div>

                            <div className="z-10 my-auto text-center py-2">
                              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-300/60 mx-auto mb-1.5 sm:mb-2" />
                              <span className="text-white font-extrabold text-[11px] sm:text-xs leading-snug line-clamp-3 drop-shadow-md px-1">{book.title}</span>
                            </div>

                            {/* Book Footer on Card */}
                            <div className="z-10 flex justify-between items-center text-[8px] sm:text-[10px] text-emerald-200 border-t border-white/10 pt-1.5 sm:pt-2">
                              <span className="truncate font-semibold text-emerald-300 max-w-[60px] sm:max-w-[100px]">{book.author || "Umum"}</span>
                              <span className="font-bold bg-white/15 px-1.5 py-0.5 rounded-sm flex-shrink-0">
                                {book.stock || 0} Eks
                              </span>
                            </div>
                          </div>
                          
                          {/* Metadata below cover */}
                          <h4 className="font-semibold text-gray-900 text-xs sm:text-sm leading-snug mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                            {book.title}
                          </h4>
                          
                          <div className="text-[10px] sm:text-xs text-gray-500 mt-auto">
                            <div className="flex items-center truncate">
                              <span className="text-emerald-600 font-semibold truncate">{displayCategory}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        )
      )}

      {/* Physical Book Detail Modal */}
      {selectedPhysicalBook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200 flex flex-col sm:flex-row">
            
            {/* Left Content (Data & Header) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative flex-shrink-0">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/6 translate-y-1/6">
                  <Book className="w-48 h-48" />
                </div>
                <button 
                  onClick={() => setSelectedPhysicalBook(null)}
                  className="absolute right-4 top-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors sm:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2 bg-white/15 w-fit px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide backdrop-blur-sm mb-2.5">
                  <WifiOff className="w-3 h-3 text-emerald-300" />
                  <span>Buku Fisik / Offline</span>
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold tracking-tight drop-shadow-sm leading-snug pr-8 sm:pr-0">
                  {selectedPhysicalBook.title}
                </h3>
              </div>

              {/* Content Details */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Mobile Cover (Shown only on small screens) */}
                {selectedPhysicalBook.coverUrl && (
                  <div className="w-32 h-48 mx-auto mb-6 rounded-lg shadow-lg overflow-hidden relative sm:hidden">
                    <img 
                      src={getDriveImageUrl(selectedPhysicalBook.coverUrl)} 
                      alt={selectedPhysicalBook.title} 
                      className="absolute inset-0 w-full h-full object-cover z-20"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex gap-2.5 items-start p-3 bg-gray-50 rounded-xl">
                    <Tag className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Kategori</div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-800 leading-tight">
                        {selectedPhysicalBook.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start p-3 bg-gray-50 rounded-xl">
                    <Hash className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Kode Buku</div>
                      <div className="text-xs sm:text-sm font-mono font-bold text-gray-700">
                        {selectedPhysicalBook.id.startsWith("off-") ? selectedPhysicalBook.id.slice(4).toUpperCase() : selectedPhysicalBook.id.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start p-3 bg-gray-50 rounded-xl">
                    <User className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Penulis</div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-800">
                        {selectedPhysicalBook.author || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start p-3 bg-gray-50 rounded-xl">
                    <Building className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Penerbit</div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-800">
                        {selectedPhysicalBook.publisher || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Tahun Terbit</div>
                      <div className="text-xs sm:text-sm font-bold text-gray-800">
                        {selectedPhysicalBook.year || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Lokasi Rak</div>
                      <div className="text-xs sm:text-sm font-bold text-amber-700 uppercase">
                        {selectedPhysicalBook.location || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-6">
                  <Info className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div className="text-xs text-emerald-800 leading-relaxed">
                    Buku ini berkategori <strong className="font-bold">Fisik (Offline)</strong> dengan sisa stok tersedia sebanyak <strong className="font-bold">{selectedPhysicalBook.stock || 0} eks</strong>. Anda dapat meminjam atau membaca buku ini secara langsung dengan mengunjungi area rak <strong className="font-bold">{selectedPhysicalBook.location || "-"}</strong> di ruang perpustakaan.
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3.5 border-t border-gray-100 flex-shrink-0">
                {onBorrowBook && (
                  <button
                    onClick={() => {
                      const title = selectedPhysicalBook.title;
                      setSelectedPhysicalBook(null);
                      onBorrowBook(title);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all transform active:scale-95"
                  >
                    Pinjam Buku Ini
                  </button>
                )}
                <button
                  onClick={() => setSelectedPhysicalBook(null)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all transform active:scale-95"
                >
                  Tutup Info
                </button>
              </div>
            </div>

            {/* Right Content (Cover Image) - Desktop Only */}
            <div className="w-64 md:w-80 lg:w-96 bg-gray-100 flex-shrink-0 relative hidden sm:flex items-center justify-center p-6 border-l border-gray-200">
                <button 
                  onClick={() => setSelectedPhysicalBook(null)}
                  className="absolute right-4 top-4 p-2 bg-black/5 hover:bg-black/10 text-gray-500 hover:text-gray-900 rounded-full transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                {selectedPhysicalBook.coverUrl ? (
                  <div className="w-full aspect-[2/3] max-h-[500px] rounded-lg shadow-xl border border-gray-200 overflow-hidden relative">
                    <img 
                      src={getDriveImageUrl(selectedPhysicalBook.coverUrl)} 
                      alt={selectedPhysicalBook.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                   <div className="w-full aspect-[2/3] max-h-[500px] rounded-lg shadow-inner border border-gray-200 bg-gray-200 flex flex-col items-center justify-center text-gray-400">
                     <Book className="w-16 h-16 mb-4 opacity-50" />
                     <span className="text-xs font-medium uppercase tracking-wider">Tanpa Cover</span>
                   </div>
                )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
