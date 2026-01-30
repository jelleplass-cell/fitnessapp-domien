"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, FileImage, File, Eye, Check } from "lucide-react";

export interface MediaItem {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface MediaGridProps {
  items: MediaItem[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onPreview?: (item: MediaItem) => void;
  selectable?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return FileSpreadsheet;
  if (mimeType.includes("image")) return FileImage;
  return File;
}

export function MediaGrid({ items, selectedIds = [], onToggleSelect, onPreview, selectable = false }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <FileImage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Nog geen media geüpload</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map((item) => {
        const isImage = item.mimeType.startsWith("image/");
        const isSelected = selectedIds.includes(item.id);
        const DocIcon = getDocIcon(item.mimeType);

        return (
          <div
            key={item.id}
            className={`group relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
              isSelected
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => {
              if (selectable && onToggleSelect) {
                onToggleSelect(item.id);
              } else if (onPreview) {
                onPreview(item);
              }
            }}
          >
            {/* Thumbnail */}
            <div className="aspect-square bg-gray-100 relative">
              {isImage ? (
                <img
                  src={item.url}
                  alt={item.originalName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                  <DocIcon className="w-8 h-8 text-gray-400" />
                  <span className="text-xs text-gray-500 text-center truncate w-full px-1">
                    {item.originalName.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                {!selectable && onPreview && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(item);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-700" />
                  </button>
                )}
              </div>

              {/* Selection checkbox */}
              {selectable && (
                <div className="absolute top-2 left-2">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-blue-500 border-blue-500"
                        : "bg-white/90 border-gray-300 group-hover:border-gray-400"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              )}
            </div>

            {/* File info */}
            <div className="p-2">
              <p className="text-xs text-gray-700 truncate">{item.originalName}</p>
              <p className="text-xs text-gray-400">{formatSize(item.size)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
