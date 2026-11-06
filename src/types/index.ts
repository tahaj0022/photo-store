export interface User {
  id: string;
  name: string;
  email: string;
  storageQuotaBytes: number;
  createdAt: string;
}

export interface Photo {
  id: string;
  userId: string;
  photoName: string;
  storedFilename: string;
  photoUrl: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  isFavorite?: boolean;
}

export interface StorageStats {
  totalPhotos: number;
  totalBytesUsed: number;
  quotaBytes: number;
  percentUsed: number;
  formatCounts: {
    jpeg: number;
    png: number;
    webp: number;
    other: number;
  };
  formatBytes: {
    jpeg: number;
    png: number;
    webp: number;
    other: number;
  };
}

export interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: Photo;
}
