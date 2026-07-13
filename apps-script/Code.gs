function doGet(e) {
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

    // Support both JSON POST (e.postData.contents) and form-urlencoded POST (e.parameter.payload)
    var data = null;
    try {
      if (e && e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
      }
    } catch (err) {
      data = null;
    }
    if (!data && e && e.parameter && e.parameter.payload) {
      try {
        data = JSON.parse(e.parameter.payload);
      } catch (err) {
        data = null;
      }
    }

    if (!data) {
      return returnJson({ success: false, error: 'No payload provided' });
    }

    var action = data.action;
    
    // Helper to get or create a sheet
    function getOrCreateSheet(spreadsheet, sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        if (sheetName === 'BookData') {
          sheet.appendRow(['File ID', 'Status', 'Kategori', 'Judul', 'Waktu Ditambahkan', 'Offline', 'Penulis', 'Penerbit', 'Tahun', 'Stok', 'Lokasi', 'URL Cover']);
          sheet.getRange("A1:L1").setFontWeight("bold");
        } else if (sheetName === 'EbookData') {
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
      var sheetId = data.sheetId;
       
      var file = DriveApp.getFileById(fileId);
      var oldName = file.getName();
      file.setName(newName);
      
      // Log to spreadsheet if provided
      if (sheetId) {
        try {
          var spreadsheet = SpreadsheetApp.openById(sheetId);
          var sheet = getOrCreateSheet(spreadsheet, 'Logs');
          sheet.appendRow([new Date(), fileId, oldName, newName, Session.getActiveUser().getEmail()]);
        } catch (sheetErr) {
          // Ignore sheet errors if sheet is inaccessible
        }
      }
      
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
