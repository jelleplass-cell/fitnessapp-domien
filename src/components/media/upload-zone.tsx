"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onUpload: (media: UploadedMedia[]) => void;
  maxFiles?: number;
  accept?: string;
  compact?: boolean;
}

export interface UploadedMedia {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
}

interface UploadProgress {
  name: string;
  progress: number;
  error?: string;
}

export function UploadZone({ onUpload, maxFiles = 100, accept, compact = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).slice(0, maxFiles);
    if (files.length === 0) return;

    setUploading(true);
    setProgress(files.map((f) => ({ name: f.name, progress: 0 })));

    // Upload in batches of 5 to avoid overwhelming the server
    const batchSize = 5;
    const allResults: UploadedMedia[] = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const formData = new FormData();
      batch.forEach((file) => formData.append("files", file));

      try {
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          allResults.push(...(data.media || []));

          // Update progress
          setProgress((prev) =>
            prev.map((p, idx) => {
              if (idx >= i && idx < i + batchSize) {
                const error = data.errors?.find((e: { name: string }) => e.name === p.name);
                return { ...p, progress: 100, error: error?.error };
              }
              return p;
            })
          );
        } else {
          setProgress((prev) =>
            prev.map((p, idx) =>
              idx >= i && idx < i + batchSize
                ? { ...p, progress: 100, error: "Upload mislukt" }
                : p
            )
          );
        }
      } catch {
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx >= i && idx < i + batchSize
              ? { ...p, progress: 100, error: "Upload mislukt" }
              : p
          )
        );
      }
    }

    if (allResults.length > 0) {
      onUpload(allResults);
    }

    setTimeout(() => {
      setUploading(false);
      setProgress([]);
    }, 1500);
  }, [maxFiles, onUpload]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  if (compact) {
    return (
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploaden..." : "Upload nieuw"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-600">
              {progress.filter((p) => p.progress === 100).length} / {progress.length} bestanden geüpload
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-medium text-gray-700">
              Sleep bestanden hierheen of klik om te uploaden
            </p>
            <p className="text-xs text-gray-400">
              Maximaal {maxFiles} bestanden, max 10MB per bestand
            </p>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {progress.length > 0 && (
        <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
          {progress.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs px-2 py-1">
              {p.error ? (
                <X className="w-3 h-3 text-red-500 flex-shrink-0" />
              ) : p.progress === 100 ? (
                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
              ) : (
                <Loader2 className="w-3 h-3 animate-spin text-blue-500 flex-shrink-0" />
              )}
              <span className="truncate text-gray-600">{p.name}</span>
              {p.error && <span className="text-red-500 flex-shrink-0">{p.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
