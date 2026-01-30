"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2, X, FileText } from "lucide-react";
import type { MediaItem } from "./media-grid";

interface MediaPreviewModalProps {
  item: MediaItem | null;
  items?: MediaItem[];
  open: boolean;
  onClose: () => void;
  onSelect?: (item: MediaItem) => void;
  onDelete?: (item: MediaItem) => void;
  onNavigate?: (item: MediaItem) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MediaPreviewModal({
  item,
  items = [],
  open,
  onClose,
  onSelect,
  onDelete,
  onNavigate,
}: MediaPreviewModalProps) {
  if (!item) return null;

  const isImage = item.mimeType.startsWith("image/");
  const currentIndex = items.findIndex((m) => m.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const navigate = (direction: -1 | 1) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < items.length && onNavigate) {
      onNavigate(items[newIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Preview area */}
          <div className="flex-1 bg-gray-950 relative flex items-center justify-center min-h-[300px] md:min-h-[500px]">
            {isImage ? (
              <img
                src={item.url}
                alt={item.originalName}
                className="max-w-full max-h-[80vh] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/70">
                <FileText className="w-16 h-16" />
                <p className="text-sm">{item.originalName}</p>
              </div>
            )}

            {/* Navigation arrows */}
            {items.length > 1 && (
              <>
                {hasPrev && (
                  <button
                    onClick={() => navigate(-1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {hasNext && (
                  <button
                    onClick={() => navigate(1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Info sidebar */}
          <div className="w-full md:w-64 bg-white p-4 border-t md:border-t-0 md:border-l border-gray-200">
            <h3 className="font-medium text-sm text-gray-900 break-words mb-4">
              {item.originalName}
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Type</p>
                <p className="text-gray-700">{item.mimeType}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Grootte</p>
                <p className="text-gray-700">{formatSize(item.size)}</p>
              </div>
              {item.width && item.height && (
                <div>
                  <p className="text-gray-400 text-xs">Afmetingen</p>
                  <p className="text-gray-700">
                    {item.width} x {item.height} px
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-xs">Geüpload</p>
                <p className="text-gray-700">{formatDate(item.createdAt)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              {onSelect && (
                <Button
                  onClick={() => onSelect(item)}
                  className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl"
                  size="sm"
                >
                  Selecteren
                </Button>
              )}
              {onDelete && (
                <Button
                  onClick={() => onDelete(item)}
                  variant="outline"
                  className="w-full rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                  size="sm"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Verwijderen
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
