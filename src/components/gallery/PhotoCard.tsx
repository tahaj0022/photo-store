import React, { useState } from 'react';
import { Photo } from '../../types';
import { getPhotoFileUrl, api } from '../../services/api';
import { formatBytes, formatTimeAgo, getFileExtension } from '../../utils/formatters';
import {
  Download,
  Trash2,
  Heart,
  Eye,
  Check,
  Calendar,
  HardDrive
} from 'lucide-react';

interface PhotoCardProps {
  photo: Photo;
  onSelect: (photo: Photo) => void;
  onDelete: (photoId: string) => void;
  onToggleFavorite: (photoId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (photoId: string) => void;
  selectionMode?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onSelect,
  onDelete,
  onToggleFavorite,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fileUrl = getPhotoFileUrl(photo.id);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    api.downloadPhoto(photo.id, photo.photoName);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(photo.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(photo.id);
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDelete(false);
  };

  const handleCardClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(photo.id);
    } else {
      onSelect(photo);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* Thumbnail Aspect Ratio Container */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
            <span className="text-xs text-slate-400">Loading...</span>
          </div>
        )}

        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
            <span className="text-xs font-medium">Failed to load preview</span>
          </div>
        ) : (
          <img
            src={fileUrl}
            alt={photo.photoName}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Top Floating Badges & Select */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5">
            {/* Format Badge */}
            <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase">
              {getFileExtension(photo.photoName)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Favorite Button */}
            <button
              type="button"
              onClick={handleFavorite}
              className={`p-1.5 rounded-xl backdrop-blur-md transition-all ${
                photo.isFavorite
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100'
              }`}
              title={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className="w-3.5 h-3.5"
                fill={photo.isFavorite ? 'currentColor' : 'none'}
              />
            </button>

            {/* Selection Checkbox */}
            {(selectionMode || isSelected) && onToggleSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(photo.id);
                }}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-black/40 text-transparent hover:bg-black/60 border border-white/60'
                }`}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium truncate max-w-[140px]" title={photo.photoName}>
              {photo.photoName}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="Download original"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-rose-600 text-white transition-colors"
                title="Delete photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {showConfirmDelete && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-white z-20 animate-in fade-in"
          >
            <p className="text-xs font-semibold text-center mb-1 text-rose-200">
              Delete this photo?
            </p>
            <p className="text-[11px] text-slate-300 text-center mb-3">
              Cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2.5 py-1 text-xs bg-rose-600 hover:bg-rose-700 rounded-lg text-white font-medium flex items-center gap-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Info Footer */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-slate-900 truncate" title={photo.photoName}>
          {photo.photoName}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {formatTimeAgo(photo.uploadDate)}
          </span>
          <span className="font-medium text-slate-600">
            {formatBytes(photo.fileSize)}
          </span>
        </div>
      </div>
    </div>
  );
};
