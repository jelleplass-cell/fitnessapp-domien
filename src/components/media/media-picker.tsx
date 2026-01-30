"use client";

import { useState, useRef } from "react";
import { Upload, ImageIcon, Link2, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaLibraryModal } from "./media-library-modal";

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
}

export function MediaPicker({ value, onChange, accept = "image/*", label = "Afbeelding" }: MediaPickerProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = accept.includes("image");
  const hasValue = value && value.trim() !== "";

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("files", files[0]);

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload mislukt");
        return;
      }

      if (data.errors && data.errors.length > 0) {
        setUploadError(data.errors[0].error);
        return;
      }

      if (data.media && data.media.length > 0) {
        onChange(data.media[0].url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError("Geen bestand ontvangen van de server");
      }
    } catch (e) {
      console.error("Upload failed:", e);
      setUploadError("Upload mislukt. Controleer je verbinding.");
    } finally {
      setUploading(false);
      // Reset file input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      onChange(urlValue.trim());
      setShowUrlInput(false);
      setUrlValue("");
    }
  };

  const handleRemove = () => {
    onChange("");
    setUploadSuccess(false);
    setUploadError(null);
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />

      {/* Upload progress indicator */}
      {uploading && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-700">Bezig met uploaden...</p>
            <div className="mt-1.5 h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {uploadSuccess && hasValue && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">Afbeelding succesvol geüpload</p>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{uploadError}</p>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="ml-auto p-0.5 hover:bg-red-100 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* Preview */}
      {hasValue && !uploading && (
        <div className="relative inline-block">
          {isImage ? (
            <div className="relative group">
              <img
                src={value}
                alt={label}
                className="h-24 w-24 object-cover rounded-xl border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
              <span className="text-sm text-gray-600 truncate max-w-[200px]">{value}</span>
              <button
                type="button"
                onClick={handleRemove}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action buttons - show when no value and not uploading */}
      {!hasValue && !showUrlInput && !uploading && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload nieuw
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLibrary(true)}
            className="rounded-xl"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Kies uit bibliotheek
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUrlInput(true)}
            className="rounded-xl"
          >
            <Link2 className="w-4 h-4 mr-2" />
            URL invoeren
          </Button>
        </div>
      )}

      {/* URL input */}
      {showUrlInput && !hasValue && !uploading && (
        <div className="flex gap-2">
          <Input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlSubmit())}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlValue.trim()}
            className="bg-blue-500 hover:bg-blue-600 rounded-xl"
          >
            OK
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowUrlInput(false);
              setUrlValue("");
            }}
            className="rounded-xl"
          >
            Annuleren
          </Button>
        </div>
      )}

      {/* Has value: small change buttons */}
      {hasValue && !uploading && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-blue-600 hover:underline"
          >
            Vervangen
          </button>
          <span className="text-xs text-gray-300">|</span>
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            Uit bibliotheek
          </button>
        </div>
      )}

      {/* Media library modal */}
      <MediaLibraryModal
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={(url) => {
          onChange(url);
          setShowLibrary(false);
        }}
        accept={accept}
      />
    </div>
  );
}
