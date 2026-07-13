import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Proxy endpoint to bypass CORS when talking to Google Apps Script
  app.post("/api/gas-proxy", async (req, res) => {
    const { url, payload } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "GAS Web App URL is required" });
    }

    try {
      const cleanUrl = url.trim();
      if (!cleanUrl.endsWith('/exec')) {
        return res.status(400).json({ error: "URL Salah", details: "URL Apps Script harus diakhiri dengan '/exec'. Pastikan Anda menyalin URL dari jendela 'Deployment baru', bukan dari address bar browser." });
      }
      const response = await fetch(cleanUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      
      let textData = await response.text();
      try {
        const trimmedText = textData.trim();
        
        // Deteksi jika Google Apps Script mengembalikan halaman HTML (misalnya halaman Login Google karena script tidak di-set "Anyone")
        if (trimmedText.toLowerCase().startsWith('<!doctype html>') || trimmedText.toLowerCase().startsWith('<html')) {
          return res.status(500).json({ error: "Akses Ditolak / Apps Script Error", details: "Google Apps Script mengembalikan halaman HTML. Pastikan Web App di-deploy dengan akses 'Anyone' (Siapa saja)." });
        }

        // Cek jika response merupakan text Base64 (tidak dimulai dengan '{' atau '[')
        if (!trimmedText.startsWith('{') && !trimmedText.startsWith('[')) {
          try {
            textData = Buffer.from(trimmedText, 'base64').toString('utf-8');
          } catch (decodeErr) {
            console.error("Failed to decode base64:", decodeErr);
          }
        }
        
        const jsonData = JSON.parse(textData);
        res.json(jsonData);
      } catch (e) {
        console.error("Invalid JSON from Apps Script:", textData);
        res.status(500).json({ error: "Invalid JSON from Apps Script", details: textData.substring(0, 500) + (textData.length > 500 ? "..." : "") });
      }

    } catch (error: any) {
      console.error("Proxy request failed:", error);
      res.status(500).json({ error: "Proxy request failed", details: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 4 wildcard catch-all for SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
