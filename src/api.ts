import { GasResponse, GasConfig } from "./types";

export async function fetchFilesFromGas(config: GasConfig): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "getFiles",
        folderId: config.ebookFolderId,
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }

  return response.json();
}

export async function uploadFileToGas(
  config: GasConfig,
  fileName: string,
  base64Data: string,
  folderType: 'ebook' | 'cover' = 'ebook'
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "uploadFile",
        folderId: folderType === 'cover' ? config.coverFolderId : config.ebookFolderId,
        fileName: fileName,
        base64Data: base64Data
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }

  return response.json();
}

export async function renameFileViaGas(
  config: GasConfig,
  fileId: string,
  newName: string
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "renameFile",
        fileId: fileId,
        newName: newName,
        sheetId: config.sheetId || undefined,
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }

  return response.json();
}


export async function deleteFileViaGas(
  config: GasConfig,
  fileId: string
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "deleteFile",
        fileId: fileId,
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }

  return response.json();
}


export async function saveMetadataToGas(
  config: GasConfig,
  metadata: Record<string, any>
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "saveMetadata",
        sheetId: config.sheetId,
        sheetIdOffline: config.sheetIdOffline || config.sheetId,
        metadata: JSON.stringify(metadata)
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }
  return response.json();
}

export async function fetchMetadataFromGas(
  config: GasConfig
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "getMetadata",
        sheetId: config.sheetId,
        sheetIdOffline: config.sheetIdOffline || config.sheetId
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }
  return response.json();
}

export async function logVisitorToGas(
  config: GasConfig,
  userAgent: string,
  nama?: string,
  jenisKelamin?: string,
  tujuan?: string,
  member?: string,
  kategoriUsia?: string,
  pekerjaan?: string
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "logVisitor",
        sheetId: config.sheetId,
        userAgent: userAgent,
        timestamp: new Date().toISOString(),
        nama,
        jenisKelamin,
        tujuan,
        member,
        kategoriUsia,
        pekerjaan
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }
  return response.json();
}

export async function fetchVisitorLogsFromGas(
  config: GasConfig
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "getVisitorLogs",
        sheetId: config.sheetId
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }
  return response.json();
}

export async function logBorrowToGas(
  config: GasConfig,
  namaPeminjam: string,
  jenisKelamin: string,
  alamatPeminjam: string,
  namaBuku: string,
  nomorTelepon: string,
  durasiPeminjaman: string
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "logBorrow",
        sheetId: config.sheetId,
        sheetIdOffline: config.sheetIdOffline || config.sheetId,
        timestamp: new Date().toISOString(),
        namaPeminjam,
        jenisKelamin,
        alamatPeminjam,
        namaBuku,
        nomorTelepon,
        durasiPeminjaman,
        status: "Menunggu Persetujuan"
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }
  return response.json();
}

export async function fetchBorrowLogsFromGas(
  config: GasConfig
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "getBorrowLogs",
        sheetId: config.sheetId,
        sheetIdOffline: config.sheetIdOffline || config.sheetId
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }
  return response.json();
}

export async function updateBorrowStatusInGas(
  config: GasConfig,
  timestamp: string,
  namaPeminjam: string,
  newStatus: string
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "updateBorrowStatus",
        sheetId: config.sheetId,
        sheetIdOffline: config.sheetIdOffline || config.sheetId,
        timestamp,
        namaPeminjam,
        status: newStatus
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }
  return response.json();
}
export async function authenticateAdmin(config: GasConfig, username: string, password: string): Promise<GasResponse> { const response = await fetch("/api/gas-proxy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: config.gasUrl, payload: { action: "authenticateAdmin", username, password } }) }); if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  } return response.json(); }

export async function saveSettingsToGas(config: GasConfig, settings: any): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "saveSettings",
        sheetId: config.sheetId,
        settings: JSON.stringify(settings)
      }
    })
  });
  
  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }
  
  return response.json();
}

export async function getSettingsFromGas(config: GasConfig): Promise<{settings?: string, success: boolean, error?: string}> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "getSettings",
        sheetId: config.sheetId
      }
    })
  });
  
  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch(e) {
      try {
        errorDetail = await response.clone().text();
      } catch(e2){}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }
  
  return response.json();
}

export async function changeAdminPassword(
  config: GasConfig,
  oldPassword: string,
  newUsername: string,
  newPassword: string
): Promise<GasResponse> {
  const response = await fetch("/api/gas-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: config.gasUrl,
      payload: {
        action: "changeAdminPassword",
        oldPassword,
        newUsername,
        newPassword
      }
    })
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.clone().json();
      errorDetail = errJson.error || errJson.details || errorDetail;
    } catch (e) {
      try {
        errorDetail = await response.clone().text();
      } catch (e2) {}
    }
    throw new Error(`Proxy error: ${errorDetail}`);
  }

  return response.json();
}
