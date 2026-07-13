import React, { useState, useEffect } from "react";
import { GasConfig, VisitorLog } from "../types";
import { fetchVisitorLogsFromGas } from "../api";
import { RefreshCw, Users, Clock, AlertCircle, Search, Filter, Calendar, Award, Download } from "lucide-react";

interface TrafficStatsProps {
  config: GasConfig;
}

export function TrafficStats({ config }: TrafficStatsProps) {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("Semua");
  const [memberFilter, setMemberFilter] = useState("Semua");

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
      const response = await fetchVisitorLogsFromGas(config);
      if (response.success && response.visitorLogs) {
        const sorted = [...response.visitorLogs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sorted);
      } else {
        setError(response.error || "Gagal mengambil data dari Google Spreadsheet.");
        setLogs([]);
      }
    } catch (err: any) {
      console.error("Error loading visitor logs:", err);
      setError(`Gagal memuat log dari Google Sheets: ${err.message || "Koneksi terputus."}`);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [config.gasUrl, config.sheetId]);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (log.nama || "").toLowerCase().includes(query) ||
      (log.tujuan || "").toLowerCase().includes(query) ||
      (log.userAgent || "").toLowerCase().includes(query);

    const matchesGender =
      genderFilter === "Semua" ||
      (log.jenisKelamin || "").toLowerCase() === genderFilter.toLowerCase();

    const matchesMember =
      memberFilter === "Semua" ||
      (log.member || "").toLowerCase() === memberFilter.toLowerCase();

    return matchesSearch && matchesGender && matchesMember;
  });

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ["Waktu Kunjungan", "Nama Lengkap", "Jenis Kelamin", "Kategori Usia", "Pekerjaan", "Tujuan Utama", "Keanggotaan", "Perangkat / Browser"];
    
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(log => {
        return [
          new Date(log.timestamp).toLocaleString("id-ID"),
          `"${(log.nama || "Tanpa Nama").replace(/"/g, '""')}"`,
          `"${(log.jenisKelamin || "-").replace(/"/g, '""')}"`,
          `"${(log.kategoriUsia || "-").replace(/"/g, '""')}"`,
          `"${(log.pekerjaan || "-").replace(/"/g, '""')}"`,
          `"${(log.tujuan || "-").replace(/"/g, '""')}"`,
          `"${(log.member || "Non-Member").replace(/"/g, '""')}"`,
          `"${(log.userAgent || "").replace(/"/g, '""')}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `data_pengunjung_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statistik & Log Kunjungan</h2>
          <p className="text-gray-500 mt-1">Daftar lengkap pengunjung yang mendaftar melalui buku tamu mandiri (Kiosk)</p>
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

      {/* Grid of quick summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Kunjungan</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{logs.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Anggota Terdaftar</p>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {logs.filter(l => (l.member || "").toLowerCase() === "member").length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Tamu Umum (Non-Member)</p>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {logs.filter(l => (l.member || "").toLowerCase().includes("non")).length}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari nama pengunjung, tujuan kunjungan, atau perangkat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <div className="flex items-center gap-2 min-w-[150px]">
            <span className="text-xs font-semibold text-gray-400">Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="block w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Semua">Semua</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div className="flex items-center gap-2 min-w-[150px]">
            <span className="text-xs font-semibold text-gray-400">Status:</span>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="block w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Semua">Semua</option>
              <option value="Member">Member</option>
              <option value="Non-Member">Non-Member</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-gray-400" />
            Log Aktivitas Pengunjung Terkini
          </h3>
          <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {filteredLogs.length} Records
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Waktu Kunjungan</th>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Jenis Kelamin</th>
                <th className="px-6 py-4">Kategori Usia</th>
                <th className="px-6 py-4">Pekerjaan</th>
                <th className="px-6 py-4">Tujuan Utama</th>
                <th className="px-6 py-4">Keanggotaan</th>
                <th className="px-6 py-4">Perangkat / Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-bold text-gray-700">Belum ada data kunjungan</p>
                    <p className="text-xs text-gray-400 mt-1">Daftar kunjungan akan terekam otomatis saat pengunjung mengisi formulir buku tamu di halaman portal.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs text-gray-900 font-medium whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-800 font-bold">{log.nama || "Tanpa Nama"}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.jenisKelamin || "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {log.kategoriUsia || "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {log.pekerjaan || "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-700 font-medium max-w-[220px] truncate" title={log.tujuan}>
                      {log.tujuan || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold leading-none ${
                          (log.member || "").toLowerCase() === "member"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {log.member || "Non-Member"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 truncate max-w-[200px]" title={log.userAgent}>
                      {log.userAgent}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
