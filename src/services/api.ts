import { User, Photo, StorageStats } from '../types';

const TOKEN_KEY = 'auraphoto_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generates an authenticated URL for <img> tags
export const getPhotoFileUrl = (photoId: string, download = false): string => {
  const token = getStoredToken();
  const base = `/api/photos/file/${photoId}`;
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (download) params.set('download', '1');
  return `${base}?${params.toString()}`;
};

export const api = {
  // Auth
  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    setStoredToken(data.token);
    return data;
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sign in');
    setStoredToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Session expired');
    return data;
  },

  async updateProfile(params: { name?: string; currentPassword?: string; newPassword?: string }): Promise<{ user: User }> {
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  // Photos
  async getPhotos(params?: { search?: string; favorite?: boolean; type?: string; sort?: string }): Promise<{ photos: Photo[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.favorite) query.set('favorite', 'true');
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.sort) query.set('sort', params.sort);

    const res = await fetch(`/api/photos?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch photos');
    return data;
  },

  async getStats(): Promise<StorageStats> {
    const res = await fetch('/api/photos/stats', {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch storage stats');
    return data;
  },

  // Upload with real progress reporting
  uploadPhotos(
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<{ message: string; photos: Photo[] }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      files.forEach(file => {
        formData.append('photos', file);
      });

      xhr.open('POST', '/api/photos/upload');
      const token = getStoredToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Upload failed'));
          }
        } catch {
          reject(new Error('Invalid response from server'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.send(formData);
    });
  },

  async deletePhoto(photoId: string): Promise<void> {
    const res = await fetch(`/api/photos/${photoId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete photo');
  },

  async bulkDeletePhotos(photoIds: string[]): Promise<{ count: number }> {
    const res = await fetch('/api/photos/bulk-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ ids: photoIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete photos');
    return data;
  },

  async toggleFavorite(photoId: string): Promise<{ isFavorite: boolean }> {
    const res = await fetch(`/api/photos/${photoId}/favorite`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update favorite status');
    return data;
  },

  async clearAllPhotos(): Promise<void> {
    const res = await fetch('/api/photos/clear-all', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to clear photos');
  },

  downloadPhoto(photoId: string, filename: string): void {
    const url = getPhotoFileUrl(photoId, true);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};
