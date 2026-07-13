import { GasConfig } from "./types";

// DEFAULT_GAS_CONFIG: Edit these values if you want to change the baked-in public defaults.
// These values are used when a browser has no local stored configuration (first-time visitors)
// and act as the global "public" default for the frontend-only deployment.

export const DEFAULT_GAS_CONFIG: GasConfig = {
  gasUrl: "https://script.google.com/macros/s/AKfycbzwtvV-q8o90tm_ciIUDc2GKYlVA21CzwC7o7KN0N7zaZ3dI2h0ULaTgEdRT9tHX3cA/exec",
  ebookFolderId: "1jQwL_UF0uGQg6eDxx6ohC932G9LwwYXI",
  coverFolderId: "17H0okwBVtRAs_PuTjxUoZkT9vuE-H01Y",
  sheetId: "1woxvK6t1A0whP0bm08G-zumpschMvP55Ny4kVpvAc",
  sheetIdOffline: "",
};
