import { GasResponse, GasConfig } from "./types";

async function sendToGasEndpoint(gasUrl: string, payload: any): Promise<GasResponse> {
  // First try server-side proxy (if available). This keeps original behavior when running with the Node server.
  try {
    const proxyResp = await fetch("/api/gas-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: gasUrl, payload }),
    });
    if (proxyResp.ok) return proxyResp.json();
    // If proxy returns 405 or other non-ok, fall back to direct request below
  } catch (e) {
    // ignore and try direct
  }

  // Fallback: call Google Apps Script Web App directly from browser.
  // To avoid CORS preflight (OPTIONS), send form-urlencoded payload (a simple request) instead of JSON.
  const form = new URLSearchParams();
  form.append('payload', JSON.stringify(payload));

  const directResp = await fetch(gasUrl, {
    method: 'POST',
    body: form,
    // no custom headers so browser will use application/x-www-form-urlencoded and avoid preflight
  });

  if (!directResp.ok) {
    const text = await directResp.text().catch(() => directResp.statusText);
    throw new Error(`Direct GAS error: ${text}`);
  }

  const text = await directResp.text();
  // The GAS sample returns base64-encoded JSON text. Try to decode; if not base64, parse as JSON directly.
  try {
    // atob exists in browser; Node builds won't run this path when proxy is present
    const decoded = typeof atob === 'function' ? atob(text) : Buffer.from(text, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (e) {
    try {
      return JSON.parse(text);
    } catch (e2) {
      throw new Error('Unable to parse response from Apps Script');
    }
  }
}

export async function fetchFilesFromGas(config: GasConfig): Promise<GasResponse> {
  return sendToGasEndpoint(config.gasUrl, { action: 'getFiles', folderId: config.ebookFolderId });
}

export async function uploadFileToGas(
  config: GasConfig,
  fileName: string,
  base64Data: string,
  folderType: 'ebook' | 'cover' = 'ebook'
): Promise<GasResponse> {
  return sendToGasEndpoint(config.gasUrl, {
    action: 'uploadFile',
    folderId: folderType === 'cover' ? config.coverFolderId : config.ebookFolderId,
    fileName,
    base64Data,
  });
}

export async function renameFileViaGas(
  config: GasConfig,
  fileId: string,
  newName: string
): Promise<GasResponse> {
  return sendToGasEndpoint(config.gasUrl, { action: 'renameFile', fileId, newName, sheetId: config.sheetId || undefined });
}

export async function deleteFileViaGas(
  config: GasConfig,
  fileId: string
): Promise<GasResponse> {
  return sendToGasEndpoint(config.gasUrl, { action: 'deleteFile', fileId });
}

export async function saveMetadataToGas(
  config: GasConfig,
  metadata: Record<string, any>
): Promise<GasResponse> {
  return sendToGasEndpoint(config.gasUrl, { action: 'saveMetadata', sheetId: config.sheetId, sheetIdOffline: config.sheetIdOffline || config.sheetId, metadata: JSON.stringify(metadata) });
}

export async function fetchMetadataFromGas(
  config: GasConfig
): Promise<GasResponse> {
  return sendToGasEndpoint(config.gasUrl, { action: 'getMetadata', sheetId: config.sheetId, sheetIdOffline: config.sheetIdOffline || config.sheetId });
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
  return sendToGasEndpoint(config.gasUrl, { action: 'logVisitor', sheetId: config.sheetId, userAgent, timestamp: new Date().toISOString(), nama, jenisKelamin, tujuan, member, kategoriUsia, pekerjaan });
}

export async function fetchVisitorLogsFromGas(
  config: GasConfig
): Promise<GasResponse> {
  return sendToGasEndpoint(config.gasUrl, { action: 'getVisitorLogs', sheetId: config.sheetId });
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
  return sendToGasEndpoint(config.gasUrl, { action: 'logBorrow', sheetId: config.sheetId, sheetIdOffline: config.sheetIdOffline || config.sheetId, timestamp: new Date().toISOString(), namaPeminjam, jenisKelamin, alamatPeminjam, namaBuku, nomorTelepon, durasiPeminjaman, status: 'Menunggu Persetujuan' });
}

export async function fetchBorrowLogsFromGas(
  config: GasConfig
): Promise<GasResponse> {
  return sendToGasEndpoint(config.gasUrl, { action: 'getBorrowLogs', sheetId: config.sheetId, sheetIdOffline: config.sheetIdOffline || config.sheetId });
}

export async function updateBorrowStatusInGas(
  config: GasConfig,
  timestamp: string,
  namaPeminjam: string,
  newStatus: string
): Promise<GasResponse> {
  return sendToGasEndpoint(config.gasUrl, { action: 'updateBorrowStatus', sheetId: config.sheetId, sheetIdOffline: config.sheetIdOffline || config.sheetId, timestamp, namaPeminjam, status: newStatus });
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
