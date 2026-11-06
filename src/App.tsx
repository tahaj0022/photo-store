import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Photo } from './types';
import { api } from './services/api';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { GalleryPage } from './pages/GalleryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { UploadModal } from './components/upload/UploadModal';
import { PhotoLightbox } from './components/gallery/PhotoLightbox';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isLoading, refreshStats } = useAuth();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'gallery' | 'favorites' | 'profile'>('dashboard');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isFetchingPhotos, setIsFetchingPhotos] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [activeLightboxPhotoId, setActiveLightboxPhotoId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Fetch photos
  const fetchPhotos = useCallback(async () => {
    if (!user) return;
    setIsFetchingPhotos(true);
    try {
      const res = await api.getPhotos();
      setPhotos(res.photos);
    } catch (err) {
      console.warn('Failed to load photos:', err);
    } finally {
      setIsFetchingPhotos(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPhotos();
      refreshStats();
    }
  }, [user, fetchPhotos, refreshStats]);

  // Listen to custom events
  useEffect(() => {
    const handleActivePhotoChange = (e: any) => {
      if (e.detail) {
        setActiveLightboxPhotoId(e.detail);
      }
    };

    const handlePhotosUpdated = () => {
      fetchPhotos();
      refreshStats();
    };

    window.addEventListener('change-active-photo', handleActivePhotoChange);
    window.addEventListener('photos-updated', handlePhotosUpdated);

    return () => {
      window.removeEventListener('change-active-photo', handleActivePhotoChange);
      window.removeEventListener('photos-updated', handlePhotosUpdated);
    };
  }, [fetchPhotos, refreshStats]);

  // Delete photo handler
  const handleDeletePhoto = async (photoId: string) => {
    try {
      await api.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      if (activeLightboxPhotoId === photoId) {
        setActiveLightboxPhotoId(null);
      }
      await refreshStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo');
    }
  };

  // Toggle favorite handler
  const handleToggleFavorite = async (photoId: string) => {
    try {
      const res = await api.toggleFavorite(photoId);
      setPhotos(prev =>
        prev.map(p => (p.id === photoId ? { ...p, isFavorite: res.isFavorite } : p))
      );
    } catch (err: any) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // If session is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <span className="text-xs font-semibold text-slate-500">Loading your photo vault...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, show Auth Page
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        currentTab={currentTab}
        onSelectTab={(tab: any) => setCurrentTab(tab)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab: any) => setCurrentTab(tab)}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardPage
              photos={photos}
              onOpenUpload={() => setIsUploadOpen(true)}
              onSelectPhoto={(photo) => setActiveLightboxPhotoId(photo.id)}
              onDeletePhoto={handleDeletePhoto}
              onToggleFavorite={handleToggleFavorite}
              onNavigateToGallery={(filterFavs) => {
                setCurrentTab(filterFavs ? 'favorites' : 'gallery');
              }}
            />
          )}

          {currentTab === 'gallery' && (
            <GalleryPage
              photos={photos}
              onSelectPhoto={(photo) => setActiveLightboxPhotoId(photo.id)}
              onDeletePhoto={handleDeletePhoto}
              onToggleFavorite={handleToggleFavorite}
              onOpenUpload={() => setIsUploadOpen(true)}
              initialFilterFavorites={false}
            />
          )}

          {currentTab === 'favorites' && (
            <GalleryPage
              photos={photos}
              onSelectPhoto={(photo) => setActiveLightboxPhotoId(photo.id)}
              onDeletePhoto={handleDeletePhoto}
              onToggleFavorite={handleToggleFavorite}
              onOpenUpload={() => setIsUploadOpen(true)}
              initialFilterFavorites={true}
            />
          )}

          {currentTab === 'profile' && (
            <ProfilePage
              onRefreshPhotos={() => {
                fetchPhotos();
                refreshStats();
              }}
            />
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          fetchPhotos();
          refreshStats();
        }}
      />

      {/* Full-Screen Lightbox */}
      <PhotoLightbox
        photos={photos}
        activePhotoId={activeLightboxPhotoId}
        onClose={() => setActiveLightboxPhotoId(null)}
        onDelete={handleDeletePhoto}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
