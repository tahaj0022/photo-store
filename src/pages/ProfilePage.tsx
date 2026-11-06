import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatBytes, formatDate } from '../utils/formatters';
import {
  User,
  Mail,
  HardDrive,
  Calendar,
  Lock,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  KeyRound,
  FileArchive
} from 'lucide-react';

interface ProfilePageProps {
  onRefreshPhotos: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onRefreshPhotos }) => {
  const { user, stats, logout, updateProfile, refreshStats } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear library modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const totalUsed = stats?.totalBytesUsed || 0;
  const quota = stats?.quotaBytes || 52428800;
  const percentUsed = stats?.percentUsed || 0;
  const availableBytes = Math.max(0, quota - totalUsed);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setFeedback(null);

    try {
      await updateProfile({
        name,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setFeedback({ type: 'success', text: 'Profile details updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await api.clearAllPhotos();
      await refreshStats();
      onRefreshPhotos();
      setShowClearConfirm(false);
      setFeedback({ type: 'success', text: 'All photos have been removed from your storage.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to clear photos' });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account & Storage</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal credentials, storage limits, and library maintenance
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Storage Breakdown Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Cloud Storage Usage</h2>
              <p className="text-xs text-slate-500">Tier: Personal Free Tier (50 MB Quota)</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            {percentUsed}% Used
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 85
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-600'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{formatBytes(totalUsed)} used</span>
            <span>{formatBytes(availableBytes)} available of {formatBytes(quota)}</span>
          </div>
        </div>

        {/* Storage Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400">Total Photos</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{stats?.totalPhotos || 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400">JPEG Files</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{stats?.formatCounts.jpeg || 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400">PNG Files</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{stats?.formatCounts.png || 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400">WEBP Files</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{stats?.formatCounts.webp || 0}</p>
          </div>
        </div>
      </div>

      {/* Profile Details & Credentials */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Account Credentials</h2>
            <p className="text-xs text-slate-500">Update your display name or change password</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address (Permanent)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              Change Password (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/40 rounded-3xl p-6 sm:p-8 border border-rose-200 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-950">Library Management & Sign Out</h2>
            <p className="text-xs text-rose-700">Clear stored pictures or sign out of this session</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-rose-200/80">
          <div>
            <p className="text-xs font-semibold text-slate-900">Clear All Photos</p>
            <p className="text-xs text-slate-500">
              Permanently removes all photos from cloud storage and frees up your quota.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 bg-white text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-300 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            Clear Entire Library
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-rose-200/80">
          <div>
            <p className="text-xs font-semibold text-slate-900">Sign Out</p>
            <p className="text-xs text-slate-500">Sign out of your account on this device.</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Clear All Photos?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This will irreversibly delete all {stats?.totalPhotos || 0} photos from your private cloud storage.
                Are you sure you want to proceed?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50"
              >
                {isClearing ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
