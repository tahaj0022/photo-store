import React, { useState, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatBytes } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Trash2,
  Loader2,
  Sparkles
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string;
  sizeFormatted: string;
  error?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { stats, refreshStats } = useAuth();
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'];
  const maxFileSizeBytes = 15 * 1024 * 1024; // 15MB

  const handleFiles = (incomingFiles: FileList | File[]) => {
    setGlobalError(null);
    setSuccessMessage(null);
    const newQueue: QueuedFile[] = [];

    Array.from(incomingFiles).forEach(file => {
      let error: string | undefined;

      const ext = file.name.split('.').pop()?.toLowerCase();
      const isValidType =
        allowedMimes.includes(file.type) ||
        ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext || '');

      if (!isValidType) {
        error = 'Unsupported format. Use JPG, PNG, or WEBP.';
      } else if (file.size > maxFileSizeBytes) {
        error = `File exceeds 15MB limit (${formatBytes(file.size)}).`;
      }

      newQueue.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        sizeFormatted: formatBytes(file.size),
        error,
      });
    });

    setQueuedFiles(prev => [...prev, ...newQueue]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setQueuedFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAll = () => {
    queuedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setQueuedFiles([]);
    setGlobalError(null);
    setSuccessMessage(null);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    const validFiles = queuedFiles.filter(f => !f.error).map(f => f.file);

    if (validFiles.length === 0) {
      setGlobalError('Please select at least one valid image to upload.');
      return;
    }

    const totalBatchBytes = validFiles.reduce((acc, f) => acc + f.size, 0);
    const availableBytes = (stats?.quotaBytes || 52428800) - (stats?.totalBytesUsed || 0);

    if (totalBatchBytes > availableBytes) {
      setGlobalError(
        `Not enough storage space. You need ${formatBytes(totalBatchBytes)}, but only have ${formatBytes(availableBytes)} remaining.`
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setGlobalError(null);

    try {
      const response = await api.uploadPhotos(validFiles, percent => {
        setUploadProgress(percent);
      });

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      setSuccessMessage(response.message || `Uploaded ${validFiles.length} photo(s) successfully!`);
      await refreshStats();
      onSuccess();

      // Clean up after 1.5 seconds
      setTimeout(() => {
        clearAll();
        onClose();
      }, 1400);
    } catch (err: any) {
      setGlobalError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = queuedFiles.filter(f => !f.error).length;
  const totalUploadBytes = queuedFiles.filter(f => !f.error).reduce((acc, f) => acc + f.file.size, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Upload Photos</h3>
              <p className="text-xs text-slate-500">Supports JPG, PNG, and WEBP up to 15MB each</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isUploading) {
                clearAll();
                onClose();
              }
            }}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60 bg-slate-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={e => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-800 text-sm mb-1">
              Click to select or drag and drop photos here
            </p>
            <p className="text-xs text-slate-500">
              Select multiple photos at once • Auto-organized in your private library
            </p>
          </div>

          {/* Global Alert Messages */}
          {globalError && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{globalError}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Uploading {validCount} photo(s)...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Preview Queue List */}
          {queuedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>
                  Ready to upload: {validCount} file(s) ({formatBytes(totalUploadBytes)})
                </span>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    Clear queue
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {queuedFiles.map(q => (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      q.error
                        ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                        : 'bg-white border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {q.error ? (
                          <div className="w-full h-full flex items-center justify-center text-rose-400">
                            <FileImage className="w-5 h-5" />
                          </div>
                        ) : (
                          <img
                            src={q.previewUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate max-w-xs">{q.file.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {q.sizeFormatted} {q.error && <span className="text-rose-600 font-medium ml-2">{q.error}</span>}
                        </p>
                      </div>
                    </div>

                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(q.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {stats && (
              <span>
                Available: {formatBytes(stats.quotaBytes - stats.totalBytesUsed)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                clearAll();
                onClose();
              }}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || validCount === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload {validCount > 0 ? `(${validCount})` : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
