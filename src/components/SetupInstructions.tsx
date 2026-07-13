import React, { useState } from "react";
import { Copy, Check, Terminal, HelpCircle, Code2, CheckCircle2, ArrowRight, Lock, Settings, Globe, Info, Play, ShieldAlert } from "lucide-react";


const GAS_CODE = `function doGet(e) {
  var response = {
    status: 403,
    message: "Akses Ditolak: Endpoint ini dienskripsi dan hanya menerima koneksi dari sistem terotorisasi."
  };
  return ContentService.createTextOutput(Utilities.base64Encode(JSON.stringify(response)))
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    function returnJson(obj) {
      return ContentService.createTextOutput(Utilities.base64Encode(JSON.stringify(obj)))
        .setMimeType(ContentService.MimeType.TEXT);
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    // Helper to get or create a sheet
    function getOrCreateSheet(spreadsheet, sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        if (sheetName === 'EbookData') {
          sheet.appendRow(['File ID', 'Status', 'Kategori', 'Judul', 'Waktu Ditambahkan']);
          sheet.getRange("A1:E1").setFontWeight("bold");
        } else if (sheetName === 'PhysicalBookData') {
          sheet.appendRow(['ID', 'Status', 'Kategori', 'Judul', 'Waktu Ditambahkan', 'Offline', 'Penulis', 'Penerbit', 'Tahun', 'Stok', 'Lokasi', 'URL Cover']);
          sheet.getRange("A1:L1").setFontWeight("bold");
        } else if (sheetName === 'Logs') {
          sheet.appendRow(['Timestamp', 'File ID', 'Nama Lama', 'Nama Baru', 'User Email']);
          sheet.getRange("A1:L1").setFontWeight("bold");
        } else if (sheetName === 'VisitorLogs') {
          sheet.appendRow(['Timestamp', 'Nama Pengunjung', 'Jenis Kelamin', 'Tujuan', 'Status Member', 'User Agent', 'Kategori Usia', 'Pekerjaan']);
          sheet.getRange("A1:H1").setFontWeight("bold");
        } else if (sheetName === 'Config') {
          sheet.appendRow(['Key', 'Value']);
          sheet.getRange("A1:B1").setFontWeight("bold");
        } else if (sheetName === 'BorrowLogs') {
          sheet.appendRow(['Timestamp', 'Nama Peminjam', 'Jenis Kelamin', 'Alamat Peminjam', 'Nama Buku', 'Nomor Telepon', 'Tanggal Pinjam s/d Kembali', 'Status']);
          sheet.getRange("A1:H1").setFontWeight("bold");
        }
      }
      return sheet;
    }

    if (action === 'getFiles') {
      var folderId = data.folderId;
      var folder = DriveApp.getFolderById(folderId);
      var files = folder.getFilesByType(MimeType.PDF);
      var fileList = [];
      
      while (files.hasNext()) {
        var file = files.next();
        fileList.push({
          id: file.getId(),
          name: file.getName(),
          url: file.getUrl(),
          lastUpdated: file.getLastUpdated().toISOString()
        });
      }
      
      return returnJson({
        success: true,
        files: fileList
      });
      
    } else if (action === 'renameFile') {
      var fileId = data.fileId;
      var newName = data.newName;
       
      var file = DriveApp.getFileById(fileId);
      file.setName(newName);
      
      return returnJson({
        success: true,
        id: fileId,
        newName: newName
      });
    
    } else if (action === 'deleteFile') {
      var fileId = data.fileId;
      var file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      return returnJson({
        success: true,
        id: fileId
      });
    
    } else if (action === 'uploadFile') {
      var folderId = data.folderId;
      var fileName = data.fileName;
      var base64Data = data.base64Data;
      
      var folder = DriveApp.getFolderById(folderId);
      
      var base64Str = base64Data;
      var mimeType = MimeType.PDF; // Default
      
      if (base64Data.indexOf(',') > -1) {
        var match = base64Data.match(/^data:([A-Za-z-+\/]+);base64,/);
        if (match) {
          mimeType = match[1];
        }
        base64Str = base64Data.split(',')[1];
      }
      
      var decodedData = Utilities.base64Decode(base64Str);
      var blob = Utilities.newBlob(decodedData, mimeType, fileName);
      
      var newFile = folder.createFile(blob);
      
      return returnJson({
        success: true,
        file: {
          id: newFile.getId(),
          name: newFile.getName(),
          url: newFile.getUrl(),
          lastUpdated: newFile.getLastUpdated().toISOString()
        }
      });
    
    } else if (action === 'saveMetadata') {
      var sheetId = data.sheetId;
      var sheetIdOffline = data.sheetIdOffline || sheetId;
      var metadataStr = data.metadata;
      
      if (!sheetId) {
        return returnJson({
          success: false,
          error: "Sheet ID is required to save metadata"
        });
      }
      
      var spreadsheetOnline = SpreadsheetApp.openById(sheetId);
      var spreadsheetOffline;
      if (sheetIdOffline && sheetIdOffline !== sheetId) {
        try {
          spreadsheetOffline = SpreadsheetApp.openById(sheetIdOffline);
        } catch (e) {
          spreadsheetOffline = spreadsheetOnline;
        }
      } else {
        spreadsheetOffline = spreadsheetOnline;
      }
      
      var sheetOnline = getOrCreateSheet(spreadsheetOnline, 'EbookData');
      var sheetOffline = getOrCreateSheet(spreadsheetOffline, 'PhysicalBookData');
      
      var metadata = JSON.parse(metadataStr);
      
      // Clear old data and write new
      sheetOnline.clear();
      sheetOnline.appendRow(['File ID', 'Status', 'Kategori', 'Judul', 'Waktu Ditambahkan', 'Penulis', 'Penerbit', 'Tahun', 'Stok', 'Lokasi', 'URL Cover']);
      sheetOnline.getRange("A1:K1").setFontWeight("bold");

      sheetOffline.clear();
      sheetOffline.appendRow(['ID', 'Status', 'Kategori', 'Judul', 'Waktu Ditambahkan', 'Offline', 'Penulis', 'Penerbit', 'Tahun', 'Stok', 'Lokasi', 'URL Cover']);
      sheetOffline.getRange("A1:L1").setFontWeight("bold");
      
      var rowsOnline = [];
      var rowsOffline = [];
      for (var key in metadata) {
        var item = metadata[key];
        if (item.isOffline) {
          rowsOffline.push([item.id, item.status, item.category, item.title, item.addedToCollectionAt || new Date().toISOString(), true, item.author || '', item.publisher || '', item.year || '', item.stock || 0, item.location || '', item.coverUrl || '']);
        } else {
          rowsOnline.push([item.id, item.status, item.category, item.title, item.addedToCollectionAt || new Date().toISOString(), item.author || '', item.publisher || '', item.year || '', item.stock || 0, item.location || '', item.coverUrl || '']);
        }
      }
      
      if (rowsOnline.length > 0) {
        sheetOnline.getRange(2, 1, rowsOnline.length, rowsOnline[0].length).setValues(rowsOnline);
      }
      if (rowsOffline.length > 0) {
        sheetOffline.getRange(2, 1, rowsOffline.length, rowsOffline[0].length).setValues(rowsOffline);
      }
      
      return returnJson({
        success: true
      });
    } else if (action === 'getMetadata') {
      var sheetId = data.sheetId;
      var sheetIdOffline = data.sheetIdOffline || sheetId;
      if (!sheetId) {
        return returnJson({
          success: true,
          metadata: "{}"
        });
      }
      
      var spreadsheetOnline = SpreadsheetApp.openById(sheetId);
      var spreadsheetOffline;
      if (sheetIdOffline && sheetIdOffline !== sheetId) {
        try {
          spreadsheetOffline = SpreadsheetApp.openById(sheetIdOffline);
        } catch (e) {
          spreadsheetOffline = spreadsheetOnline;
        }
      } else {
        spreadsheetOffline = spreadsheetOnline;
      }
      
      var sheetOnline = getOrCreateSheet(spreadsheetOnline, 'EbookData');
      var sheetOffline = getOrCreateSheet(spreadsheetOffline, 'PhysicalBookData');
      
      var metadata = {};
      
      var dataRangeOnline = sheetOnline.getDataRange();
      var valuesOnline = dataRangeOnline.getValues();
      if (valuesOnline.length > 1) {
        for (var i = 1; i < valuesOnline.length; i++) {
          var row = valuesOnline[i];
          metadata[row[0]] = {
            id: row[0],
            status: row[1],
            category: row[2],
            title: row[3],
            addedToCollectionAt: row[4],
            isOffline: false,
            author: row[5] || '',
            publisher: row[6] || '',
            year: row[7] || '',
            stock: row[8] || 0,
            location: row[9] || '',
            coverUrl: row[10] || ''
          };
        }
      }

      var dataRangeOffline = sheetOffline.getDataRange();
      var valuesOffline = dataRangeOffline.getValues();
      if (valuesOffline.length > 1) {
        for (var i = 1; i < valuesOffline.length; i++) {
          var row = valuesOffline[i];
          metadata[row[0]] = {
            id: row[0],
            status: row[1],
            category: row[2],
            title: row[3],
            addedToCollectionAt: row[4],
            isOffline: true,
            author: row[6] || '',
            publisher: row[7] || '',
            year: row[8] || '',
            stock: row[9] || 0,
            location: row[10] || '',
            coverUrl: row[11] || ''
          };
        }
      }
      
      return returnJson({
        success: true,
        metadata: JSON.stringify(metadata)
      });
    } else if (action === 'logVisitor') {
      var sheetId = data.sheetId;
      var userAgent = data.userAgent;
      var timestamp = data.timestamp;
      var nama = data.nama || "";
      var jenisKelamin = data.jenisKelamin || "";
      var tujuan = data.tujuan || "";
      var member = data.member || "";
      var kategoriUsia = data.kategoriUsia || "";
      var pekerjaan = data.pekerjaan || "";
      
      if (!sheetId) {
        return returnJson({
          success: false,
          error: "Sheet ID is required"
        });
      }
      
      try {
        var spreadsheet = SpreadsheetApp.openById(sheetId);
        var sheet = getOrCreateSheet(spreadsheet, 'VisitorLogs');
        sheet.appendRow([
          timestamp || new Date().toISOString(),
          nama,
          jenisKelamin,
          tujuan,
          member,
          userAgent || "Unknown Device",
          kategoriUsia,
          pekerjaan
        ]);
        
        return returnJson({
          success: true
        });
      } catch (err) {
        return returnJson({
          success: false,
          error: err.toString()
        });
      }
    
    } else if (action === 'getVisitorLogs') {
      var sheetId = data.sheetId;
      if (!sheetId) {
        return returnJson({
          success: false,
          error: "Sheet ID is required"
        });
      }
      
      try {
        var spreadsheet = SpreadsheetApp.openById(sheetId);
        var sheet = getOrCreateSheet(spreadsheet, 'VisitorLogs');
        
        var dataRange = sheet.getDataRange();
        var values = dataRange.getValues();
        var logs = [];
        
        if (values.length > 1) {
          for (var i = 1; i < values.length; i++) {
            var row = values[i];
            logs.push({
              timestamp: row[0],
              nama: row[1] || "",
              jenisKelamin: row[2] || "",
              tujuan: row[3] || "",
              member: row[4] || "",
              userAgent: row[5] || "",
              kategoriUsia: row[6] || "",
              pekerjaan: row[7] || ""
            });
          }
        }
        
        return returnJson({
          success: true,
          visitorLogs: logs
        });
      } catch (err) {
        return returnJson({
          success: false,
          error: err.toString()
        });
      }
    } else if (action === 'logBorrow') {
      var sheetId = data.sheetId;
      var sheetIdOffline = data.sheetIdOffline || sheetId;
      var timestamp = data.timestamp;
      var namaPeminjam = data.namaPeminjam || "";
      var jenisKelamin = data.jenisKelamin || "";
      var alamatPeminjam = data.alamatPeminjam || "";
      var namaBuku = data.namaBuku || "";
      var nomorTelepon = data.nomorTelepon || "";
      var durasiPeminjaman = data.durasiPeminjaman || "";
      var status = data.status || "Dipinjam";
      
      if (!sheetIdOffline) {
        return returnJson({
          success: false,
          error: "Sheet ID is required"
        });
      }
      
      try {
        var spreadsheet = SpreadsheetApp.openById(sheetIdOffline);
        var sheet = getOrCreateSheet(spreadsheet, 'BorrowLogs');
        sheet.appendRow([
          timestamp || new Date().toISOString(),
          namaPeminjam,
          jenisKelamin,
          alamatPeminjam,
          namaBuku,
          nomorTelepon,
          durasiPeminjaman,
          status
        ]);
        
        return returnJson({
          success: true
        });
      } catch (err) {
        return returnJson({
          success: false,
          error: err.toString()
        });
      }
     
    } else if (action === 'getBorrowLogs') {
      var sheetId = data.sheetId;
      var sheetIdOffline = data.sheetIdOffline || sheetId;
      if (!sheetIdOffline) {
        return returnJson({
          success: false,
          error: "Sheet ID is required"
        });
      }
      
      try {
        var spreadsheet = SpreadsheetApp.openById(sheetIdOffline);
        var sheet = getOrCreateSheet(spreadsheet, 'BorrowLogs');
        
        var dataRange = sheet.getDataRange();
        var values = dataRange.getValues();
        var logs = [];
        
        if (values.length > 1) {
          for (var i = 1; i < values.length; i++) {
            var row = values[i];
            logs.push({
              timestamp: row[0],
              namaPeminjam: row[1] || "",
              jenisKelamin: row[2] || "",
              alamatPeminjam: row[3] || "",
              namaBuku: row[4] || "",
              nomorTelepon: row[5] || "",
              durasiPeminjaman: row[6] || "",
              status: row[7] || ""
            });
          }
        }
        
        return returnJson({
          success: true,
          borrowLogs: logs
        });
      } catch (err) {
        return returnJson({
          success: false,
          error: err.toString()
        });
      }
    } else if (action === 'updateBorrowStatus') {
      var sheetId = data.sheetId;
      var sheetIdOffline = data.sheetIdOffline || sheetId;
      var timestamp = data.timestamp;
      var namaPeminjam = data.namaPeminjam;
      var newStatus = data.status;
      
      if (!sheetIdOffline) {
        return returnJson({
          success: false,
          error: "Sheet ID is required"
        });
      }
      
      try {
        var spreadsheet = SpreadsheetApp.openById(sheetIdOffline);
        var sheet = getOrCreateSheet(spreadsheet, 'BorrowLogs');
        var dataRange = sheet.getDataRange();
        var values = dataRange.getValues();
        var found = false;
        
        for (var i = 1; i < values.length; i++) {
          var rowTime = values[i][0];
          var rowName = values[i][1];
          var rowTimeStr = rowTime instanceof Date ? rowTime.toISOString() : rowTime.toString();
          
          if (rowName === namaPeminjam && (rowTimeStr === timestamp || new Date(rowTime).getTime() === new Date(timestamp).getTime())) {
            sheet.getRange(i + 1, 8).setValue(newStatus);
            found = true;
            break;
          }
        }
        
        return returnJson({
          success: found,
          error: found ? undefined : "Data peminjaman tidak ditemukan di Spreadsheet"
        });
      } catch (err) {
        return returnJson({
          success: false,
          error: err.toString()
        });
      }
    } else if (action === 'saveSettings') {
      var sheetId = data.sheetId;
      var settingsStr = data.settings;
      
      if (!sheetId) {
        try {
          var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
          if (activeSpreadsheet) {
            sheetId = activeSpreadsheet.getId();
          }
        } catch (e) {}
        
        if (!sheetId) {
          try {
            sheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
          } catch (e) {}
        }
      }
      
      if (!sheetId) {
        return returnJson({
          success: false,
          error: "Spreadsheet ID tidak ditemukan. Harap sertakan sheetId saat menyimpan."
        });
      }
      
      // Simpan backup ke Script Properties
      try {
        PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", sheetId);
      } catch (e) {}
      
      var spreadsheet = SpreadsheetApp.openById(sheetId);
      var sheet = getOrCreateSheet(spreadsheet, 'Config');
      var settings = JSON.parse(settingsStr);
      
      // Clear old data and write new
      sheet.clear();
      sheet.appendRow(['Key', 'Value']);
      sheet.getRange("A1:B1").setFontWeight("bold");
      
      var rows = [];
      for (var key in settings) {
        rows.push([key, settings[key]]);
      }
      
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      
      return returnJson({
        success: true,
        sheetId: sheetId
      });
      
    } else if (action === 'getSettings') {
      var sheetId = data.sheetId;
      if (!sheetId) {
        try {
          var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
          if (activeSpreadsheet) {
            sheetId = activeSpreadsheet.getId();
          }
        } catch (e) {}
        
        if (!sheetId) {
          try {
            sheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
          } catch (e) {}
        }
      }
      
      if (!sheetId) {
        return returnJson({
          success: true,
          settings: "{}",
          message: "Belum ada konfigurasi. ID Spreadsheet Utama tidak terdeteksi."
        });
      }
      
      try {
        var spreadsheet = SpreadsheetApp.openById(sheetId);
        var sheet = getOrCreateSheet(spreadsheet, 'Config');
        
        var dataRange = sheet.getDataRange();
        var values = dataRange.getValues();
        
        var settings = {};
        if (values.length > 1) {
          for (var i = 1; i < values.length; i++) {
            var row = values[i];
            if (row[0]) {
              settings[row[0]] = row[1];
            }
          }
        }
        
        // Pastikan sheetId tersimpan juga di settings yang dikembalikan
        settings.sheetId = sheetId;
        
        return returnJson({
          success: true,
          settings: JSON.stringify(settings)
        });
      } catch (err) {
        return returnJson({
          success: true,
          settings: "{}",
          error: err.toString()
        });
      }
    } else if (action === "authenticateAdmin") {
      try {
        var props = PropertiesService.getScriptProperties();
        var storedUser = props.getProperty("ADMIN_USER");
        var storedPass = props.getProperty("ADMIN_PASS");
        
        if (!storedUser || !storedPass) {
          // Initialize if empty
          props.setProperty("ADMIN_USER", "admin");
          props.setProperty("ADMIN_PASS", "12345");
          storedUser = "admin";
          storedPass = "12345";
        }
        
        var providedUser = data.username;
        var providedPass = data.password;
        
        if (providedUser === storedUser && providedPass === storedPass) {
          return returnJson({
            success: true,
            authenticated: true
          });
        } else {
          return returnJson({
            success: true,
            authenticated: false
          });
        }
      } catch (err) {
        return returnJson({
          success: false,
          error: err.toString()
        });
      }
    } else if (action === "changeAdminPassword") {
      try {
        var props = PropertiesService.getScriptProperties();
        var storedUser = props.getProperty("ADMIN_USER") || "admin";
        var storedPass = props.getProperty("ADMIN_PASS") || "12345";
        
        var oldPass = data.oldPassword;
        var newUsername = data.newUsername || "admin";
        var newPassword = data.newPassword;
        
        if (!newPassword || newPassword.trim() === "") {
          return returnJson({
            success: false,
            error: "Password baru tidak boleh kosong"
          });
        }
        
        if (oldPass !== storedPass) {
          return returnJson({
            success: false,
            error: "Password lama tidak sesuai"
          });
        }
        
        props.setProperty("ADMIN_USER", newUsername);
        props.setProperty("ADMIN_PASS", newPassword);
        
        return returnJson({
          success: true,
          message: "Kredensial admin (username/password) berhasil diperbarui!"
        });
      } catch (err) {
        return returnJson({
          success: false,
          error: err.toString()
        });
      }
    } else {
      return returnJson({
        success: false,
        error: "Unknown action"
      });
    }
  
  } catch (error) {
    return ContentService.createTextOutput(Utilities.base64Encode(JSON.stringify({
      success: false,
      error: error.toString()
    }))).setMimeType(ContentService.MimeType.TEXT);
  }
}`;

export function SetupInstructions() {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(GAS_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      id: 1,
      title: "Buka Google Spreadsheet & Apps Script",
      desc: "Buka Google Spreadsheet aktif Anda, lalu masuk ke menu Ekstensi > Apps Script (atau Extensions > Apps Script) untuk meluncurkan editor skrip Google.",
      badge: "Spreadsheet",
      icon: Globe
    },
    {
      id: 2,
      title: "Salin & Tempel Kode Backend",
      desc: "Hapus seluruh kode bawaan yang ada di dalam berkas Code.gs, kemudian salin seluruh baris kode Google Apps Script (GAS) di panel bawah dan tempelkan ke editor.",
      badge: "Code.gs",
      icon: Code2
    },
    {
      id: 3,
      title: "Lakukan Deployment Baru",
      desc: "Klik tombol simpan (ikon disket), lalu pilih Terapkan (Deploy) > Deployment baru di pojok kanan atas layar Apps Script.",
      badge: "Deploy",
      icon: Play
    },
    {
      id: 4,
      title: "Konfigurasikan Sebagai Aplikasi Web",
      desc: "Pilih jenis deployment Aplikasi Web (klik ikon gerigi di sebelah kiri 'Pilih Jenis' dan pilih Aplikasi Web).",
      badge: "Web App",
      icon: Settings
    },
    {
      id: 5,
      title: "Atur Hak Akses Publik",
      desc: "Konfigurasikan setelan: Jalankan aplikasi sebagai: 'Saya (email Anda)' dan Siapa yang memiliki akses: 'Siapa saja (Anyone)'. Ini wajib agar Kiosk Penguji/Pengunjung dapat berkomunikasi langsung.",
      badge: "Hak Akses",
      icon: Lock
    },
    {
      id: 6,
      title: "Deploy & Selesaikan Otorisasi",
      desc: "Klik Deploy, lalu selesaikan langkah Otorisasi Izin. Klik akun Google Anda, pilih Advanced / Lanjutan, lalu klik 'Go to Untitled project' (atau Buka Proyek) untuk memberikan persetujuan akses.",
      badge: "Otorisasi",
      icon: CheckCircle2
    },
    {
      id: 7,
      title: "Salin URL Aplikasi Web & Pasang",
      desc: "Setelah berhasil dideploy, salin URL Aplikasi Web yang dihasilkan (berakhiran /exec) lalu simpan URL tersebut ke form 'Google Apps Script Web App URL' pada menu Konfigurasi.",
      badge: "URL Exec",
      icon: ArrowRight
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden flex-shrink-0">
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/20 border border-indigo-400/20 rounded-xl">
            <Terminal className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500 text-white uppercase tracking-wider">
                Integrasi Otomatis
              </span>
              <span className="text-xs text-slate-300 font-mono">v2.1.0-secure</span>
            </div>
            <h2 className="text-lg font-bold">Panduan Instalasi Google Apps Script (GAS)</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Portal Kiosk ini dirancang tanpa server (serverless) yang memanfaatkan kekuatan cloud Google Sheets sebagai database utama dan Google Drive untuk penyimpanan dokumen PDF. Ikuti 7 langkah praktis berikut untuk menautkan sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Steps Timeline Grid */}
      <div className="flex flex-col gap-6 overflow-y-auto flex-1 pb-4 pr-2">
        
        {/* Timeline (Steps 1-7) */}
        <div className="space-y-3">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-950 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Langkah-Langkah Setup Database & Cloud
            </h3>
            
            <div className="space-y-3 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {steps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div 
                    key={step.id}
                    onMouseEnter={() => setActiveStep(step.id)}
                    onMouseLeave={() => setActiveStep(null)}
                    className={`relative pl-12 pr-4 py-3.5 rounded-xl border transition-all duration-200 cursor-default ${
                      activeStep === step.id 
                        ? "border-indigo-200 bg-indigo-50/20 translate-x-1" 
                        : "border-gray-200/60 bg-white"
                    }`}
                  >
                    {/* Circle Step Number */}
                    <div className={`absolute left-2.5 top-[15px] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all ${
                      activeStep === step.id
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {step.id}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <StepIcon className={`w-3.5 h-3.5 ${activeStep === step.id ? "text-indigo-600" : "text-gray-400"}`} />
                          {step.title}
                        </span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-50 border border-gray-200 text-slate-500 uppercase tracking-wider">
                          {step.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secure Admin Propertis Tip */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Penting: Amankan Kredensial Admin</p>
              <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                Secara bawaan, aplikasi menggunakan username <strong>admin</strong> dan password <strong>12345</strong>. Setelah berhasil masuk ke Dashboard Admin, segera ganti kredensial bawaan ini melalui menu <strong>Pengaturan &gt; Kredensial Admin</strong> demi keamanan portal Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Copy Script Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-transparent flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-500" />
                  Salin Kode Sumber Code.gs
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Tempelkan seluruh kode ini ke Apps Script</p>
              </div>
              
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-100"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-300 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Tersalin!" : "Salin Kode"}
              </button>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-auto max-h-[460px] border-b border-slate-900 flex-1 rounded-b-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[10px] text-slate-500 uppercase tracking-wider">
                <span>Code.gs (Javascript)</span>
                <span>Lines: {GAS_CODE.split('\n').length}</span>
              </div>
              <pre className="leading-relaxed select-all">
                <code>{GAS_CODE}</code>
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
