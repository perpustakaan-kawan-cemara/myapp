import React, { useState } from "react";
import { authenticateAdmin } from "../api";
import { GasConfig } from "../types";
import { Lock, User, KeyRound, Loader2, AlertCircle, Clock } from "lucide-react";

interface LoginProps {
  config: GasConfig;
  onLoginSuccess: () => void;
  onCancel?: () => void;
  timeoutMessage?: string;
}

export function Login({ config, onLoginSuccess, onCancel, timeoutMessage }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Allow local override if GAS config is not set up
    if (!config.gasUrl) {
      if (username === "admin" && password === "12345") {
        onLoginSuccess();
        return;
      } else {
        setError("Username atau password salah (Local auth fallback).");
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await authenticateAdmin(config, username, password);
      if (result.success && result.authenticated) {
        onLoginSuccess();
      } else {
        setError("Username atau password salah.");
      }
    } catch (err: any) {
      // Fallback in case the new script hasn't been deployed yet
      if (username === "admin" && password === "12345") {
        onLoginSuccess();
      } else {
        setError("Koneksi gagal atau kredensial salah.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8 text-center bg-indigo-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Lock className="w-32 h-32 transform translate-x-8 -translate-y-8" />
          </div>
          <div className="relative z-10">
            <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Admin Panel</h2>
            <p className="mt-2 text-indigo-100 font-medium">Masuk untuk mengelola perpustakaan</p>
          </div>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {timeoutMessage && !error && (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl flex items-start gap-3 border border-amber-100 animate-in slide-in-from-top-2">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                <p className="text-sm font-semibold">{timeoutMessage}</p>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 border border-red-100 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  placeholder="admin"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-200 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              {isLoading ? "Mengautentikasi..." : "Masuk ke Dashboard"}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-center py-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                &larr; Kembali ke Halaman Pengunjung
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
