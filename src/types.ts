export interface GasConfig {
  gasUrl: string;
  ebookFolderId: string;
  coverFolderId: string;
  sheetId?: string;
  sheetIdOffline?: string;
  libraryName?: string;
  libraryLogoUrl?: string;
  libraryLogoId?: string;
  adminTimeoutMinutes?: number;
}

export interface DriveFile {
  id: string;
  name: string;
  url: string;
  lastUpdated: string;
}


export interface VisitorLog {
  timestamp: string;
  nama?: string;
  jenisKelamin?: string;
  tujuan?: string;
  member?: string;
  kategoriUsia?: string;
  pekerjaan?: string;
  userAgent: string;
}

export interface BorrowLog {
  timestamp: string;
  namaPeminjam: string;
  jenisKelamin?: string;
  alamatPeminjam: string;
  namaBuku: string;
  nomorTelepon: string;
  durasiPeminjaman: string;
  status: string;
}

export interface GasResponse {
  visitorLogs?: VisitorLog[];
  borrowLogs?: BorrowLog[];
  success: boolean;
  files?: DriveFile[];
  file?: DriveFile;
  error?: string;
  id?: string;
  newName?: string;
  metadata?: string;
  authenticated?: boolean;
  message?: string;
}

export type BookStatus = 'stock' | 'collection';

export interface SliderItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  linkUrl?: string;
  isActive: boolean;
  isGradientBg?: boolean;
  gradientClass?: string;
  hideOverlayText?: boolean;
}

export interface BookMetadata {
  id: string;
  status: BookStatus;
  category: string;
  title: string;
  addedToCollectionAt?: string;
  isOffline?: boolean;
  author?: string;
  publisher?: string;
  year?: string;
  stock?: number;
  location?: string;
  coverUrl?: string;
}

export type TabType = 'dashboard' | 'books_management' | 'traffic' | 'settings' | 'visitor' | 'borrow';

