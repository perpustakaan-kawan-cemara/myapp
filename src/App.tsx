import React, { useState, useEffect, useRef } from "react";
import { GasConfig, DriveFile, BookMetadata, SliderItem, TabType } from "./types";
import { StockList } from "./components/StockList";
import { BookTableList } from "./components/BookTableList";
import { TrafficStats } from "./components/TrafficStats";
import { logVisitorToGas } from "./api";
import { CollectionList } from "./components/CollectionList";
import { Dashboard } from "./components/Dashboard";
import { Sidebar } from "./components/Sidebar";
import { Settings } from "./components/Settings";
import { VisitorView } from "./components/VisitorView";
import { UploadButton } from "./components/UploadButton";
import { BorrowList } from "./components/BorrowList";
import { fetchFilesFromGas, renameFileViaGas, saveMetadataToGas, fetchMetadataFromGas, getSettingsFromGas, saveSettingsToGas } from "./api";
import { AlertCircle, RefreshCw, Menu, BookOpen, List, Inbox, Library, LogOut } from "lucide-react";
import { DEFAULT_SLIDES } from "./components/SliderConfig";
import { DEFAULT_GAS_CONFIG } from "./defaultConfig";

import { Login } from "./components/Login";

import { getDriveImageUrl } from "./utils";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("adminAuth") === "true";
  });

  const lastActivityRef = useRef<number>(Date.now());
  const [timeoutMessage, setTimeoutMessage] = useState<string>("");

  const [config, setConfig] = useState<GasConfig>(() => {
    const saved = localStorage.getItem("gasConfig");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Invalid gasConfig in localStorage, falling back to defaults');
      }
    }
    // Use baked-in defaults for first-time visitors or after a reset
    return {
      ...DEFAULT_GAS_CONFIG,
      sheetIdOffline: DEFAULT_GAS_CONFIG.sheetId || "",
    };
  });

  const [metadata, setMetadata] = useState<Record<string, BookMetadata>>(() => {
    const saved = localStorage.getItem("bookMetadata");
    return saved ? JSON.parse(saved) : {};
  });

  const [sliderItems, setSliderItems] = useState<SliderItem[]>(() => {
    const saved = localStorage.getItem("sliderItems");
    if (saved) {
      let parsed = JSON.parse(saved);
      let updated = false;
      if (!parsed.some((item: any) => item.id === "default-welcome")) {
        parsed = [DEFAULT_SLIDES[0], ...parsed];
        updated = true;
      }
      if (!parsed.some((item: any) => item.id === "default-invitation")) {
        const welcomeIdx = parsed.findIndex((item: any) => item.id === "default-welcome");
        if (welcomeIdx !== -1) {
          parsed.splice(welcomeIdx + 1, 0, DEFAULT_SLIDES[1]);
        } else {
          parsed = [DEFAULT_SLIDES[1], ...parsed];
        }
        updated = true;
      }
      if (updated) {
        localStorage.setItem("sliderItems", JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_SLIDES;
  });

  const [showSlider, setShowSlider] = useState<boolean>(() => {
    const saved = localStorage.getItem("showSlider");
    return saved !== "false";
  });

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('visitor');
  const [booksSubTab, setBooksSubTab] = useState<'booklist' | 'stock' | 'collection'>('booklist');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  useEffect(() => {
    localStorage.setItem("gasConfig", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("bookMetadata", JSON.stringify(metadata));
  }, [metadata]);

  useEffect(() => {
    localStorage.setItem("sliderItems", JSON.stringify(sliderItems));
  }, [sliderItems]);

  useEffect(() => {
    localStorage.setItem("showSlider", String(showSlider));
  }, [showSlider]);

  // Track admin inactivity and perform automatic session logout
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Initialize activity timestamp on login or activity
    lastActivityRef.current = Date.now();

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const monitoredEvents = ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click"];
    monitoredEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity);
    });

    const timeoutMin = config.adminTimeoutMinutes !== undefined ? config.adminTimeoutMinutes : 15;
    
    // A timeout of 0 minutes disables the auto-logout feature
    if (timeoutMin <= 0) {
      return () => {
        monitoredEvents.forEach(evt => {
          window.removeEventListener(evt, handleUserActivity);
        });
      };
    }

    const checkInterval = setInterval(() => {
      const timeElapsed = Date.now() - lastActivityRef.current;
      const allowedLimit = timeoutMin * 60 * 1000;
      
      if (timeElapsed >= allowedLimit) {
        // Automatically logout administrative session
        sessionStorage.removeItem("adminAuth");
        setIsAuthenticated(false);
        setActiveTab('dashboard'); // Force redirection to Login component
        setTimeoutMessage(`Sesi Anda telah berakhir otomatis karena tidak ada aktivitas selama ${timeoutMin} menit.`);
      }
    }, 5000); // Check every 5 seconds for best balance of reactivity and performance

    return () => {
      monitoredEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(checkInterval);
    };
  }, [isAuthenticated, config.adminTimeoutMinutes]);

  useEffect(() => {
    // Trigger initial load as soon as we have a GAS URL (IDs may be provided by the spreadsheet connected to GAS)
    if (config.gasUrl && !hasInitialLoad && !isLoading) {
      setHasInitialLoad(true);
      loadFiles();
    }
  }, [config.gasUrl, hasInitialLoad]);

  const loadFiles = async () => {
    if (!config.gasUrl) {
      setError("Silakan konfigurasi URL Apps Script terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Work with a local copy so subsequent setConfig doesn't affect this run unexpectedly
      let finalConfig = { ...config };

      // Fetch settings first (GAS can provide authoritative folder IDs & sheetId)
      try {
        const settingsResponse = await getSettingsFromGas(finalConfig);
        if (settingsResponse.success && settingsResponse.settings) {
          const parsedSettings = JSON.parse(settingsResponse.settings);

          // If spreadsheet returned an empty object or no keys, treat it as "not configured"
          const isEmptySettings = !parsedSettings || Object.keys(parsedSettings).length === 0;

          if (!isEmptySettings) {
            // Merge IDs and other settings into finalConfig
            finalConfig = {
              ...finalConfig,
              ebookFolderId: parsedSettings.ebookFolderId || finalConfig.ebookFolderId,
              coverFolderId: parsedSettings.coverFolderId || finalConfig.coverFolderId,
              sheetId: parsedSettings.sheetId || finalConfig.sheetId,
              sheetIdOffline: parsedSettings.sheetIdOffline || finalConfig.sheetIdOffline,
              libraryName: parsedSettings.libraryName || finalConfig.libraryName,
              libraryLogoUrl: parsedSettings.libraryLogoUrl || finalConfig.libraryLogoUrl,
              libraryLogoId: parsedSettings.libraryLogoId || finalConfig.libraryLogoId,
              adminTimeoutMinutes: parsedSettings.adminTimeoutMinutes !== undefined ? parsedSettings.adminTimeoutMinutes : finalConfig.adminTimeoutMinutes
            };

            // Persist merged config to state so UI reflects fetched IDs
            setConfig(prev => ({ ...prev, ...{
              ebookFolderId: finalConfig.ebookFolderId,
              coverFolderId: finalConfig.coverFolderId,
              sheetId: finalConfig.sheetId,
              sheetIdOffline: finalConfig.sheetIdOffline,
              libraryName: finalConfig.libraryName,
              libraryLogoUrl: finalConfig.libraryLogoUrl,
              libraryLogoId: finalConfig.libraryLogoId,
              adminTimeoutMinutes: finalConfig.adminTimeoutMinutes
            }}));

            if (parsedSettings.sliderItems) {
              try {
                const parsedSlides = JSON.parse(parsedSettings.sliderItems);
                if (Array.isArray(parsedSlides) && parsedSlides.length > 0) {
                  setSliderItems(parsedSlides);
                }
              } catch (e) {
                console.warn("Failed to parse slider items on start", e);
              }
            }
            if (parsedSettings.showSlider !== undefined) {
              setShowSlider(parsedSettings.showSlider === "true" || parsedSettings.showSlider === true);
            }
          } else {
            // No settings present in spreadsheet: persist current (baked-in) config to spreadsheet so other devices can load it
            try {
              const settingsToSave = {
                libraryName: finalConfig.libraryName || 'Perpustakaan Digital',
                libraryLogoUrl: finalConfig.libraryLogoUrl || '',
                libraryLogoId: finalConfig.libraryLogoId || '',
                ebookFolderId: finalConfig.ebookFolderId || '',
                coverFolderId: finalConfig.coverFolderId || '',
                sheetId: finalConfig.sheetId || '',
                sheetIdOffline: finalConfig.sheetIdOffline || finalConfig.sheetId || '',
                adminTimeoutMinutes: finalConfig.adminTimeoutMinutes !== undefined ? finalConfig.adminTimeoutMinutes : 15,
                sliderItems: sliderItems ? JSON.stringify(sliderItems) : JSON.stringify([]),
                showSlider: showSlider !== undefined ? String(showSlider) : 'true'
              };

              await saveSettingsToGas(finalConfig, settingsToSave);
              // After saving, persist to state to make sure subsequent loads read the same
              setConfig(prev => ({ ...prev, ...{
                ebookFolderId: finalConfig.ebookFolderId,
                coverFolderId: finalConfig.coverFolderId,
                sheetId: finalConfig.sheetId,
                sheetIdOffline: finalConfig.sheetIdOffline
              }}));
            } catch (e) {
              console.warn('Failed to write default settings to spreadsheet:', e);
            }
          }
        }
      } catch (settingsError) {
        console.warn("Could not fetch settings from GAS:", settingsError);
      }

      // Ensure ebookFolderId exists after attempting to fetch settings
      if (!finalConfig.ebookFolderId) {
        setError("Folder e-Book belum dikonfigurasi di spreadsheet. Silakan periksa konfigurasi di Apps Script / Spreadsheet.");
        setIsLoading(false);
        return;
      }

      // Use finalConfig for subsequent fetches
      const response = await fetchFilesFromGas(finalConfig);
      if (response.success && response.files) {
        setFiles(response.files);
      } else {
        setError(response.error || "Gagal mengambil file.");
      }

      try {
        const metadataResponse = await fetchMetadataFromGas(finalConfig);
        if (metadataResponse.success && metadataResponse.metadata) {
          const parsedMetadata = JSON.parse(metadataResponse.metadata);
          setMetadata(parsedMetadata);
        }
      } catch (metaErr) {
        console.warn("Could not fetch metadata from GAS", metaErr);
      }

    } catch (err: any) {
      setError(err.message || "Kesalahan jaringan. Periksa URL Apps Script Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorize = async (
    fileId: string, 
    title: string, 
    category: string,
    author?: string,
    publisher?: string,
    year?: string
  ) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      const newFileName = title.toLowerCase().endsWith('.pdf') ? title : `${title}.pdf`;
      let finalTitle = title;
      
      if (file.name !== newFileName) {
        const response = await renameFileViaGas(config, fileId, newFileName);
        if (!response.success) {
          setError(response.error || "Gagal mengubah nama file.");
          return;
        }
        
        setFiles(files.map(f => f.id === fileId ? { ...f, name: response.newName || newFileName, lastUpdated: new Date().toISOString() } : f));
        finalTitle = (response.newName || newFileName).replace(/\.pdf$/i, "");
      }

      setMetadata(prev => {
        const nextMetadata = {
          ...prev,
          [fileId]: {
            id: fileId,
            status: 'collection' as const,
            category,
            title: finalTitle,
            author,
            publisher,
            year,
            addedToCollectionAt: new Date().toISOString()
          }
        };
        saveMetadataToGas(config, nextMetadata).catch(err => console.error("Failed to save metadata to GAS:", err));
        return nextMetadata;
      });

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan jaringan.");
    }
  };

const handleUpdateBook = async (fileId: string, title: string, category: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      const newFileName = title.toLowerCase().endsWith('.pdf') ? title : `${title}.pdf`;
      let finalTitle = title;
      
      if (file.name !== newFileName) {
        const response = await renameFileViaGas(config, fileId, newFileName);
        if (!response.success) {
          setError(response.error || "Gagal mengubah nama file.");
          return;
        }
        
        setFiles(files.map(f => f.id === fileId ? { ...f, name: response.newName || newFileName, lastUpdated: new Date().toISOString() } : f));
        finalTitle = (response.newName || newFileName).replace(/\.pdf$/i, "");
      }

      setMetadata(prev => {
        const nextMetadata = {
          ...prev,
          [fileId]: {
            ...prev[fileId],
            category,
            title: finalTitle
          }
        };
        saveMetadataToGas(config, nextMetadata).catch(err => console.error("Failed to save metadata to GAS:", err));
        return nextMetadata;
      });
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan jaringan.");
    }
  };

  const handleUpdateMetadata = async (newMetadata: Record<string, BookMetadata>) => {
    setMetadata(newMetadata);
    try {
      await saveMetadataToGas(config, newMetadata);
    } catch (err: any) {
      setError(err.message || "Gagal menyelaraskan perubahan metadata ke Google Sheets.");
    }
  };

  const handleUploadSuccess = (newFile: DriveFile) => {
    setFiles(prev => [newFile, ...prev]);
    // It's uploaded, so it goes to stock by default
  };

  const handleGoToTab = (tab: any) => {
    if (tab === 'stock' || tab === 'collection' || tab === 'booklist') {
      setActiveTab('books_management');
      setBooksSubTab(tab);
    } else {
      setActiveTab(tab);
    }
  };

  // Only pass files to dashboard that are in the collection
  const collectionFiles = files.filter(f => metadata[f.id]?.status === 'collection');

  // When a GAS URL is provided, the app will attempt to pull folder/sheet IDs from the connected spreadsheet.
  // Do not force showing a setup portal; users should be able to visit and the site will auto-load settings from GAS.

  if (activeTab === 'visitor') {
    return (
      <VisitorView 
        files={files} 
        metadata={metadata} 
         
        onExit={() => setActiveTab('dashboard')} 
        isLoading={isLoading}
        config={config} 
        sliderItems={sliderItems}
        showSlider={showSlider}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Login 
        config={config} 
        timeoutMessage={timeoutMessage}
        onLoginSuccess={() => {
          sessionStorage.setItem("adminAuth", "true");
          setIsAuthenticated(true);
          setTimeoutMessage(""); // Clear warning on successful login
        }} 
        onCancel={() => {
          setActiveTab('visitor');
          setTimeoutMessage(""); // Clear warning when returning to visitor page
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 w-full max-w-full overflow-x-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        config={config}
        onLogout={() => {
          sessionStorage.removeItem("adminAuth");
          setIsAuthenticated(false);
          setActiveTab('visitor');
        }}
      />
      
      <main className={`flex-1 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'} flex flex-col min-h-screen transition-all duration-300 w-full max-w-full overflow-x-hidden`}>
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="hidden lg:flex p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="font-bold text-gray-900 flex items-center gap-2 text-lg">
              {config?.libraryLogoUrl || config?.libraryLogoId ? (
                <img src={getDriveImageUrl(config.libraryLogoId || config.libraryLogoUrl)} alt="Logo" className="w-6 h-6 object-contain rounded" />
              ) : (
                <BookOpen className="w-5 h-5 text-indigo-600" />
              )}
              <span className="truncate max-w-[180px] sm:max-w-none">
                {config.libraryName || "Perpustakaan Drive"}
              </span>
            </div>
          </div>

          {/* Quick Logout Button for Mobile */}
          <button
            onClick={() => {
              sessionStorage.removeItem("adminAuth");
              setIsAuthenticated(false);
              setActiveTab('visitor');
            }}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </header>

        <div className="p-4 sm:p-8 pb-28 sm:pb-12 lg:pb-8 flex-1">
          <div className="w-full mx-auto">
            
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">Error</h3>
                  <p className="text-sm mt-1 opacity-90">{error}</p>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <Dashboard 
                files={files} 
                metadata={metadata} 
                onGoToTab={handleGoToTab} 
                config={config} 
              />
            )}

            {activeTab === 'books_management' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Unified Sub-tab Header */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                      <button
                        onClick={() => setBooksSubTab('booklist')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                          booksSubTab === 'booklist'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span>Inventaris & Metadata</span>
                      </button>
                      
                      <button
                        onClick={() => setBooksSubTab('stock')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                          booksSubTab === 'stock'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Inbox className="w-4 h-4" />
                        <span>Arsip Drive Masuk</span>
                      </button>

                      <button
                        onClick={() => setBooksSubTab('collection')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                          booksSubTab === 'collection'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Library className="w-4 h-4" />
                        <span>Visualisasi Katalog</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {booksSubTab === 'stock' && (
                        <UploadButton 
                          config={config} 
                          disabled={!config.gasUrl || !config.ebookFolderId}
                          onUploadSuccess={handleUploadSuccess}
                          onError={setError}
                        />
                      )}
                      <button
                        onClick={loadFiles}
                        disabled={isLoading || !config.gasUrl || !config.ebookFolderId}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? "Menyinkronkan..." : "Sinkron Drive"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-tab Views */}
                {booksSubTab === 'booklist' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Inventaris & Metadata Buku</h2>
                        <p className="text-gray-500 text-xs mt-1">Kelola rincian metadata, sampul, jenis, deskripsi, dan status koleksi digital maupun fisik</p>
                      </div>
                    </div>
                    <BookTableList 
                      files={files} 
                      metadata={metadata}
                      config={config}
                      onUpdateBook={handleUpdateBook}
                      onUpdateMetadata={handleUpdateMetadata}
                    />
                  </div>
                )}

                {booksSubTab === 'stock' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Arsip Drive Masuk</h2>
                        <p className="text-gray-500 text-xs mt-1">Sinkronisasi dan kategorisasi file PDF dari Google Drive ke dalam katalog perpustakaan</p>
                      </div>
                    </div>
                    <StockList 
                      files={files} 
                      metadata={metadata}
                      isLoading={isLoading}
                      onCategorize={handleCategorize} 
                    />
                  </div>
                )}

                {booksSubTab === 'collection' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Visualisasi Katalog Umum</h2>
                        <p className="text-gray-500 text-xs mt-1">Pratinjau tampilan katalog buku digital dan fisik yang dapat dilihat oleh pengunjung</p>
                      </div>
                    </div>
                    <CollectionList 
                      files={files} 
                      metadata={metadata}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'traffic' && (
              <TrafficStats config={config} />
            )}

            {activeTab === 'settings' && (
              <div className="animate-in fade-in duration-300">
                <Settings 
                  config={config} 
                  setConfig={setConfig} 
                  slides={sliderItems}
                  showSlider={showSlider}
                  onSaveSlides={setSliderItems}
                  onToggleShowSlider={setShowSlider}
                />
              </div>
            )}

            {activeTab === 'borrow' && (
              <BorrowList config={config} />
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
