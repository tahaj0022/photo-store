import React, { useState, useEffect, useCallback } from 'react';
import { Photo } from '../../types';
import { getPhotoFileUrl, api } from '../../services/api';
import { formatBytes, formatDate, formatTimeAgo, getFileExtension } from '../../utils/formatters';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Heart,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Calendar,
  HardDrive,
  FileText,
  Clock,
  RotateCw
} from 'lucide-react';

interface PhotoLightboxProps {
  photos: Photo[];
  activePhotoId: string | null;
  onClose: () => void;
  onDelete: (photoId: string) => void;
  onToggleFavorite: (photoId: string) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  activePhotoId,
  onClose,
  onDelete,
  onToggleFavorite,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentIndex = photos.findIndex(p => p.id === activePhotoId);
  const activePhoto = currentIndex !== -1 ? photos[currentIndex] : null;

  // Reset zoom & rotation when switching photos
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
    setConfirmDelete(false);
  }, [activePhotoId]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      const nextPhoto = photos[currentIndex + 1];
      if (nextPhoto) {
        // Change photo by calling window custom event or state
        window.dispatchEvent(new CustomEvent('change-active-photo', { detail: nextPhoto.id }));
      }
    }
  }, [currentIndex, photos]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevPhoto = photos[currentIndex - 1];
      if (prevPhoto) {
        window.dispatchEvent(new CustomEvent('change-active-photo', { detail: prevPhoto.id }));
      }
    }
  }, [currentIndex, photos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePhoto) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto, handleNext, handlePrev, onClose]);

  if (!activePhoto) return null;

  const fileUrl = getPhotoFileUrl(activePhoto.id);

  const handleDownload = () => {
    api.downloadPhoto(activePhoto.id, activePhoto.photoName);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(activePhoto.id);
    if (photos.length <= 1) {
      onClose();
    } else {
      if (currentIndex < photos.length - 1) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-200">
      {/* Top Bar Controls */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/10 text-white shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-slate-200">
            {currentIndex + 1} / {photos.length}
          </span>
          <h3 className="text-sm font-medium text-slate-200 truncate max-w-xs md:max-w-md">
            {activePhoto.photoName}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Zoom In / Out */}
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

          {/* Favorite */}
          <button
            type="button"
            onClick={() => onToggleFavorite(activePhoto.id)}
            className={`p-2 rounded-xl transition-colors ${
              activePhoto.isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white'
            }`}
            title="Toggle Favorite"
          >
            <Heart className="w-4 h-4" fill={activePhoto.isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* Download Original */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            title="Download Original File"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Info toggle */}
          <button
            type="button"
            onClick={() => setShowInfoSidebar(!showInfoSidebar)}
            className={`p-2 rounded-xl transition-colors ${
              showInfoSidebar ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
            title="View Photo Details"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            className={`p-2 rounded-xl transition-colors ${
              confirmDelete ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-rose-600/80 text-slate-200'
            }`}
            title={confirmDelete ? 'Click again to confirm delete' : 'Delete Photo'}
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative flex items-stretch overflow-hidden">
        {/* Navigation arrow Left */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10 transition-transform active:scale-95"
            title="Previous Photo (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Navigation arrow Right */}
        {currentIndex < photos.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10 transition-transform active:scale-95"
            style={showInfoSidebar ? { right: '340px' } : {}}
            title="Next Photo (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Canvas / Image Display */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto">
          <div
            className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={fileUrl}
              alt={activePhoto.photoName}
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg shadow-2xl pointer-events-auto"
            />
          </div>
        </div>

        {/* Metadata Details Sidebar */}
        {showInfoSidebar && (
          <div className="w-80 bg-slate-900 border-l border-white/10 p-5 text-white overflow-y-auto shrink-0 z-30 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                Photo Details
              </h4>
              <button
                type="button"
                onClick={() => setShowInfoSidebar(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">File Name</span>
                <p className="font-semibold text-slate-100 break-words bg-white/5 p-2.5 rounded-xl border border-white/5">
                  {activePhoto.photoName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                    File Size
                  </span>
                  <p className="font-bold text-slate-100">{formatBytes(activePhoto.fileSize)}</p>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Format
                  </span>
                  <p className="font-bold text-slate-100 uppercase">
                    {getFileExtension(activePhoto.photoName)}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
                <div>
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Upload Date
                  </span>
                  <p className="font-semibold text-slate-100">{formatDate(activePhoto.uploadDate)}</p>
                </div>
                <div>
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Relative Time
                  </span>
                  <p className="text-slate-300">{formatTimeAgo(activePhoto.uploadDate)}</p>
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">MIME Type</span>
                <p className="text-slate-200 font-mono text-[11px]">{activePhoto.fileType}</p>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Original</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium transition-colors ${
                    confirmDelete
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/10 hover:bg-rose-600/20 text-rose-300'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{confirmDelete ? 'Confirm Permanent Delete' : 'Delete Photo'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation prompt banner if triggered */}
      {confirmDelete && (
        <div className="bg-rose-600/95 text-white px-6 py-2.5 flex items-center justify-between text-xs font-medium z-30">
          <span>Are you sure you want to delete &quot;{activePhoto.photoName}&quot;? This cannot be undone.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-white text-rose-700 font-bold rounded-lg hover:bg-slate-100"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
