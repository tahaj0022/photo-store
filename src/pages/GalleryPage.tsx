import React, { useState, useMemo } from 'react';
import { Photo } from '../types';
import { PhotoCard } from '../components/gallery/PhotoCard';
import { api } from '../services/api';
import { formatBytes } from '../utils/formatters';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Heart,
  Grid3X3,
  LayoutGrid,
  List,
  Trash2,
  CheckSquare,
  Square,
  Upload,
  FolderOpen,
  Filter,
  X
} from 'lucide-react';

interface GalleryPageProps {
  photos: Photo[];
  onSelectPhoto: (photo: Photo) => void;
  onDeletePhoto: (photoId: string) => void;
  onToggleFavorite: (photoId: string) => void;
  onOpenUpload: () => void;
  initialFilterFavorites?: boolean;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  photos,
  onSelectPhoto,
  onDeletePhoto,
  onToggleFavorite,
  onOpenUpload,
  initialFilterFavorites = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'favorites' | 'jpeg' | 'png' | 'webp'>(
    initialFilterFavorites ? 'favorites' : 'all'
  );
  const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc'>('date_desc');
  const [viewLayout, setViewLayout] = useState<'grid' | 'compact' | 'list'>('grid');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Filter and Sort Photos
  const filteredPhotos = useMemo(() => {
    return photos
      .filter(p => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          if (!p.photoName.toLowerCase().includes(q)) return false;
        }

        // Tab filter
        if (activeTypeTab === 'favorites') {
          return !!p.isFavorite;
        }
        if (activeTypeTab === 'jpeg') {
          return p.fileType.toLowerCase().includes('jpeg') || p.fileType.toLowerCase().includes('jpg');
        }
        if (activeTypeTab === 'png') {
          return p.fileType.toLowerCase().includes('png');
        }
        if (activeTypeTab === 'webp') {
          return p.fileType.toLowerCase().includes('webp');
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'date_desc') {
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        }
        if (sortOption === 'date_asc') {
          return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
        }
        if (sortOption === 'name_asc') {
          return a.photoName.localeCompare(b.photoName);
        }
        if (sortOption === 'name_desc') {
          return b.photoName.localeCompare(a.photoName);
        }
        if (sortOption === 'size_desc') {
          return b.fileSize - a.fileSize;
        }
        if (sortOption === 'size_asc') {
          return a.fileSize - b.fileSize;
        }
        return 0;
      });
  }, [photos, searchQuery, activeTypeTab, sortOption]);

  const toggleSelectPhoto = (photoId: string) => {
    setSelectedPhotoIds(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  const selectAll = () => {
    if (selectedPhotoIds.length === filteredPhotos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(filteredPhotos.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirmBulkDelete) {
      setConfirmBulkDelete(true);
      return;
    }

    setIsBulkDeleting(true);
    try {
      await api.bulkDeletePhotos(selectedPhotoIds);
      // Trigger parent reload
      window.dispatchEvent(new CustomEvent('photos-updated'));
      setSelectedPhotoIds([]);
      setSelectionMode(false);
      setConfirmBulkDelete(false);
    } catch (err: any) {
      alert(err.message || 'Failed to delete photos');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Controls: Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Photo Gallery</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredPhotos.length} of {photos.length} photos
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by photo name..."
              className="w-full pl-9 pr-9 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs, Sort, and View Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Category / Type Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTypeTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTypeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All ({photos.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTypeTab('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTypeTab === 'favorites'
                ? 'bg-rose-500 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={activeTypeTab === 'favorites' ? 'currentColor' : 'none'} />
            <span>Favorites ({photos.filter(p => p.isFavorite).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTypeTab('jpeg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTypeTab === 'jpeg'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            JPG / JPEG
          </button>

          <button
            type="button"
            onClick={() => setActiveTypeTab('png')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTypeTab === 'png'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            PNG
          </button>

          <button
            type="button"
            onClick={() => setActiveTypeTab('webp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTypeTab === 'webp'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            WEBP
          </button>
        </div>

        {/* Right side: Sorting & Layout Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Batch Selection Mode Button */}
          <button
            type="button"
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) setSelectedPhotoIds([]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              selectionMode
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {selectionMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Select</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="size_desc">Size (Largest)</option>
              <option value="size_asc">Size (Smallest)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewLayout === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Standard Grid (3-4 cols)"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('compact')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewLayout === 'compact' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Compact Grid (5-6 cols)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (When selection mode is active) */}
      {selectionMode && (
        <div className="bg-indigo-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-semibold underline text-indigo-200 hover:text-white"
            >
              {selectedPhotoIds.length === filteredPhotos.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-xs text-indigo-200">
              {selectedPhotoIds.length} of {filteredPhotos.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectionMode(false);
                setSelectedPhotoIds([]);
                setConfirmBulkDelete(false);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-medium"
            >
              Cancel
            </button>

            {selectedPhotoIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {confirmBulkDelete
                    ? `Confirm Delete (${selectedPhotoIds.length})`
                    : `Delete Selected (${selectedPhotoIds.length})`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Gallery Grid or Empty State */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No photos found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No pictures matching "${searchQuery}". Try a different keyword.`
              : activeTypeTab === 'favorites'
              ? 'You have not favorited any photos yet. Click the heart icon on any photo to save it here.'
              : 'No photos match the selected filter.'}
          </p>
          {(searchQuery || activeTypeTab !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTypeTab('all');
              }}
              className="text-xs font-semibold text-indigo-600 hover:underline inline-block mt-2"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            viewLayout === 'compact'
              ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4'
          }`}
        >
          {filteredPhotos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onSelect={onSelectPhoto}
              onDelete={onDeletePhoto}
              onToggleFavorite={onToggleFavorite}
              selectionMode={selectionMode}
              isSelected={selectedPhotoIds.includes(photo.id)}
              onToggleSelect={toggleSelectPhoto}
            />
          ))}
        </div>
      )}
    </div>
  );
};
