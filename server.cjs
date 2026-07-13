var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/gas-proxy", async (req, res) => {
    const { url, payload } = req.body;
    if (!url) {
      return res.status(400).json({ error: "GAS Web App URL is required" });
    }
    try {
      const cleanUrl = url.trim();
      if (!cleanUrl.endsWith("/exec")) {
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
        if (trimmedText.toLowerCase().startsWith("<!doctype html>") || trimmedText.toLowerCase().startsWith("<html")) {
          return res.status(500).json({ error: "Akses Ditolak / Apps Script Error", details: "Google Apps Script mengembalikan halaman HTML. Pastikan Web App di-deploy dengan akses 'Anyone' (Siapa saja)." });
        }
        if (!trimmedText.startsWith("{") && !trimmedText.startsWith("[")) {
          try {
            textData = Buffer.from(trimmedText, "base64").toString("utf-8");
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
    } catch (error) {
      console.error("Proxy request failed:", error);
      res.status(500).json({ error: "Proxy request failed", details: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
