import React, { useState, useEffect, useMemo } from "react";
import { GasConfig, BorrowLog } from "../types";
import { fetchBorrowLogsFromGas, updateBorrowStatusInGas } from "../api";
import { RefreshCw, BookOpen, Clock, User, Phone, MapPin, Calendar, CheckCircle, AlertCircle, Search, Filter, XCircle, TrendingUp, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BorrowListProps {
  config: GasConfig;
}

export function BorrowList({ config }: BorrowListProps) {
  const [logs, setLogs] = useState<BorrowLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    if (!config.gasUrl || !config.sheetId) {
      setError("Koneksi Google Sheets / Apps Script belum dikonfigurasi. Silakan masuk ke Menu Pengaturan untuk menyambungkan Spreadsheet.");
      setLogs([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchBorrowLogsFromGas(config);
      if (response.success && response.borrowLogs) {
        const sorted = [...response.borrowLogs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sorted);
      } else {
        setError(response.error || "Gagal mengambil data dari Google Spreadsheet.");
        setLogs([]);
      }
    } catch (err: any) {
      console.error("Error loading borrow logs:", err);
      setError(`Gagal memuat log dari Google Sheets: ${err.message || "Koneksi terputus."}`);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [config.gasUrl, config.sheetId]);

  const handleUpdateStatus = async (index: number, newStatus: string) => {
    const targetLog = logs[index];
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await updateBorrowStatusInGas(
        config,
        targetLog.timestamp,
        targetLog.namaPeminjam,
        newStatus
      );

      if (response.success) {
        // Update local state directly upon successful remote update
        const updatedLogs = [...logs];
        updatedLogs[index] = { ...targetLog, status: newStatus };
        setLogs(updatedLogs);
      } else {
        setError(response.error || "Gagal memperbarui status di Google Spreadsheet.");
      }
    } catch (err: any) {
      console.error("Gagal mengupdate status peminjaman:", err);
      setError(`Gagal memperbarui status di Google Spreadsheet: ${err.message || "Koneksi terputus."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      log.namaPeminjam.toLowerCase().includes(query) ||
      log.namaBuku.toLowerCase().includes(query) ||
      log.alamatPeminjam.toLowerCase().includes(query) ||
      log.nomorTelepon.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "Semua" ||
      log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const chartData = useMemo(() => {
    const dataMap = new Map();
    [...logs].reverse().forEach(log => {
      const d = new Date(log.timestamp);
      if (isNaN(d.getTime())) return;
      
      const monthYear = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      if (!dataMap.has(monthYear)) {
        dataMap.set(monthYear, { 
          name: monthYear, 
          Disetujui: 0, 
          Dikembalikan: 0, 
          Ditolak: 0, 
          Menunggu: 0 
        });
      }
      
      const current = dataMap.get(monthYear);
      if (log.status === 'Dipinjam') current.Disetujui += 1;
      else if (log.status === 'Kembali') current.Dikembalikan += 1;
      else if (log.status === 'Ditolak') current.Ditolak += 1;
      else current.Menunggu += 1;
    });
    
    return Array.from(dataMap.values());
  }, [logs]);

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ["Tanggal Peminjaman", "Nama Peminjam", "Judul Buku", "Alamat", "Nomor Telepon", "Durasi Peminjaman", "Status"];
    
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(log => {
        return [
          new Date(log.timestamp).toLocaleString("id-ID"),
          `"${log.namaPeminjam.replace(/"/g, '""')}"`,
          `"${log.namaBuku.replace(/"/g, '""')}"`,
          `"${log.alamat.replace(/"/g, '""')}"`,
          `"${log.nomorTelepon}"`,
          `"${log.durasiPeminjaman}"`,
          `"${log.status || "Menunggu Persetujuan"}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_peminjaman_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoryTabs = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Dipinjam', label: 'Disetujui' },
    { id: 'Menunggu Persetujuan', label: 'Menunggu' },
    { id: 'Ditolak', label: 'Ditolak' },
    { id: 'Kembali', label: 'Dikembalikan' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Peminjaman Buku</h2>
          <p className="text-gray-500 mt-1">Daftar pengunjung yang meminjam buku fisik (offline)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm shadow-indigo-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Catatan Koneksi</h3>
            <p className="text-xs mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Chart Visualization */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900">Tren Peminjaman Buku</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="Disetujui" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Menunggu" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Dikembalikan" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Ditolak" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {categoryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari nama peminjam, judul buku, alamat, atau nomor telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Log Aktivitas Peminjaman
          </h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {filteredLogs.length} Records
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Waktu Pinjam</th>
                <th className="px-6 py-4">Peminjam</th>
                <th className="px-6 py-4">L/P</th>
                <th className="px-6 py-4">Alamat</th>
                <th className="px-6 py-4">Buku yang Dipinjam</th>
                <th className="px-6 py-4">No. Telepon</th>
                <th className="px-6 py-4">Tanggal Peminjaman</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-semibold text-gray-700">Belum ada data peminjaman</p>
                    <p className="text-xs text-gray-400 mt-1">Data peminjaman buku akan muncul di sini setelah pengunjung mengisi formulir.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const absoluteIndex = logs.findIndex(
                    (l) => l.timestamp === log.timestamp && l.namaPeminjam === log.namaPeminjam
                  );
                  return (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-900 font-medium whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-800 font-semibold">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{log.namaPeminjam}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          log.jenisKelamin === 'Laki-laki' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : log.jenisKelamin === 'Perempuan' 
                              ? 'bg-pink-50 text-pink-700 border border-pink-100'
                              : 'bg-gray-50 text-gray-600'
                        }`}>
                          {log.jenisKelamin || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={log.alamatPeminjam}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{log.alamatPeminjam}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-bold max-w-[220px] truncate" title={log.namaBuku}>
                        {log.namaBuku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{log.nomorTelepon}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{log.durasiPeminjaman}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const status = log.status || "Menunggu Persetujuan";
                          if (status === "Kembali") {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Sudah Kembali
                              </span>
                            );
                          }
                          if (status === "Ditolak") {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                <XCircle className="w-3.5 h-3.5" />
                                Ditolak
                              </span>
                            );
                          }
                          if (status === "Dipinjam") {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <BookOpen className="w-3.5 h-3.5" />
                                Sedang Dipinjam
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              Menunggu Persetujuan
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {log.status === "Menunggu Persetujuan" && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(absoluteIndex, "Dipinjam")}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            >
                              Aprov
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(absoluteIndex, "Ditolak")}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                        {log.status === "Dipinjam" && (
                           <button
                             onClick={() => handleUpdateStatus(absoluteIndex, "Kembali")}
                             className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                           >
                             Tandai Kembali
                           </button>
                        )}
                        {(log.status === "Kembali" || log.status === "Ditolak") && (
                           <span className="text-xs text-gray-400 font-medium">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
