import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { uploadFileToGas } from '../api';
import { GasConfig, DriveFile } from '../types';

interface UploadButtonProps {
  config: GasConfig;
  onUploadSuccess: (file: DriveFile) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function UploadButton({ config, onUploadSuccess, onError, disabled }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      onError('Hanya file PDF yang diperbolehkan.');
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          const response = await uploadFileToGas(config, file.name, base64Data);
          
          if (response.success && response.file) {
            onUploadSuccess(response.file);
          } else {
            onError(response.error || 'Gagal mengunggah file.');
          }
        } catch (error: any) {
          onError(error.message || 'Terjadi kesalahan saat mengunggah.');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.onerror = () => {
        onError('Gagal membaca file lokal.');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      onError(error.message || 'Terjadi kesalahan saat memproses file.');
      setIsUploading(false);
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept="application/pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {isUploading ? "Mengunggah..." : "Tambah Buku"}
      </button>
    </>
  );
}
