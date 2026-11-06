import React from 'react';
import { Photo } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatBytes } from '../utils/formatters';
import { PhotoCard } from '../components/gallery/PhotoCard';
import {
  Upload,
  Images,
  HardDrive,
  Heart,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  FolderOpen
} from 'lucide-react';

interface DashboardPageProps {
  photos: Photo[];
  onOpenUpload: () => void;
  onSelectPhoto: (photo: Photo) => void;
  onDeletePhoto: (photoId: string) => void;
  onToggleFavorite: (photoId: string) => void;
  onNavigateToGallery: (filterFavorites?: boolean) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  photos,
  onOpenUpload,
  onSelectPhoto,
  onDeletePhoto,
  onToggleFavorite,
  onNavigateToGallery,
}) => {
  const { user, stats } = useAuth();

  const totalUsed = stats?.totalBytesUsed || 0;
  const quota = stats?.quotaBytes || 52428800;
  const percentUsed = stats?.percentUsed || 0;
  const availableBytes = Math.max(0, quota - totalUsed);
  const favoriteCount = photos.filter(p => p.isFavorite).length;

  const recentPhotos = [...photos]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Personal Cloud Photo Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Photographer'}!
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Your personal library has <span className="font-semibold text-white">{photos.length} photos</span> securely stored. Upload new memories or browse your collection anytime.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenUpload}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-sm hover:bg-indigo-50 shadow-lg shadow-black/10 transition-all active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Upload Photos</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToGallery(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all"
            >
              <span>View Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Storage and Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Photos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Photos</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{photos.length}</h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              All securely stored
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Images className="w-6 h-6" />
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Storage Used</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatBytes(totalUsed)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {percentUsed}% of {formatBytes(quota)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        {/* Free Space */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Available Space</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatBytes(availableBytes)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Free for new uploads</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* Favorites */}
        <div
          onClick={() => onNavigateToGallery(true)}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between cursor-pointer hover:border-rose-200 hover:bg-rose-50/20 transition-all"
        >
          <div>
            <p className="text-xs font-medium text-slate-500">Favorites</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{favoriteCount}</h3>
            <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
              View starred photos →
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <Heart className="w-6 h-6" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Storage Visual Breakdown Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900">Storage Distribution</h3>
            <p className="text-xs text-slate-500">
              Breakdown of file types stored in your account
            </p>
          </div>
          <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 self-start sm:self-auto">
            {formatBytes(totalUsed)} of {formatBytes(quota)} ({percentUsed}%)
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {stats?.formatBytes.jpeg ? (
            <div
              className="bg-indigo-500 h-full transition-all"
              style={{ width: `${(stats.formatBytes.jpeg / quota) * 100}%` }}
              title={`JPEG: ${formatBytes(stats.formatBytes.jpeg)}`}
            />
          ) : null}
          {stats?.formatBytes.png ? (
            <div
              className="bg-violet-500 h-full transition-all"
              style={{ width: `${(stats.formatBytes.png / quota) * 100}%` }}
              title={`PNG: ${formatBytes(stats.formatBytes.png)}`}
            />
          ) : null}
          {stats?.formatBytes.webp ? (
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${(stats.formatBytes.webp / quota) * 100}%` }}
              title={`WEBP: ${formatBytes(stats.formatBytes.webp)}`}
            />
          ) : null}
          {stats?.formatBytes.other ? (
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${(stats.formatBytes.other / quota) * 100}%` }}
              title={`Other: ${formatBytes(stats.formatBytes.other)}`}
            />
          ) : null}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>JPEG ({stats?.formatCounts.jpeg || 0}) • {formatBytes(stats?.formatBytes.jpeg || 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span>PNG ({stats?.formatCounts.png || 0}) • {formatBytes(stats?.formatBytes.png || 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>WEBP ({stats?.formatCounts.webp || 0}) • {formatBytes(stats?.formatBytes.webp || 0)}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span>Available ({formatBytes(availableBytes)})</span>
          </div>
        </div>
      </div>

      {/* Recently Uploaded Photos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recently Uploaded</h2>
            <p className="text-xs text-slate-500">Your most recent photographs</p>
          </div>
          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateToGallery(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              <span>See all {photos.length} photos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">Your photo library is empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start uploading your personal pictures to preserve them securely in your cloud vault.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Your First Photo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentPhotos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onSelect={onSelectPhoto}
                onDelete={onDeletePhoto}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
