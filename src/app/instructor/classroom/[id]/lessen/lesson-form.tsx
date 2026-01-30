"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/media/media-picker";
import { X, Plus } from "lucide-react";

interface LessonFormProps {
  courseId: string;
  lesson?: {
    id: string;
    title: string;
    content: string | null;
    videoUrl: string | null;
    imageUrl: string | null;
    attachments: string | null;
    isPublished: boolean;
  };
}

export default function LessonForm({ courseId, lesson }: LessonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);

  const parseAttachments = (attachments: string | null): string[] => {
    if (!attachments) return [];
    try {
      return JSON.parse(attachments);
    } catch {
      return [];
    }
  };

  const [formData, setFormData] = useState({
    title: lesson?.title || "",
    content: lesson?.content || "",
    videoUrl: lesson?.videoUrl || "",
    imageUrl: lesson?.imageUrl || "",
    isPublished: lesson?.isPublished || false,
  });

  const [attachments, setAttachments] = useState<string[]>(
    parseAttachments(lesson?.attachments ?? null)
  );

  const addAttachment = (url: string) => {
    if (url && !attachments.includes(url)) {
      setAttachments((prev) => [...prev, url]);
    }
    setShowAttachmentPicker(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = lesson
        ? `/api/courses/${courseId}/lessons/${lesson.id}`
        : `/api/courses/${courseId}/lessons`;
      const method = lesson ? "PUT" : "POST";

      const body = {
        title: formData.title,
        content: formData.content || null,
        videoUrl: formData.videoUrl || null,
        imageUrl: formData.imageUrl || null,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
        isPublished: formData.isPublished,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSuccess("Les opgeslagen");
        setTimeout(() => {
          router.push(`/instructor/classroom/${courseId}`);
          router.refresh();
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Er is een fout opgetreden bij het opslaan");
      }
    } catch {
      setError("Er is een fout opgetreden bij het opslaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Lesinhoud */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Lesinhoud</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="bijv. Introductie tot voeding"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label>Afbeelding</Label>
            <MediaPicker
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              accept="image/*"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Inhoud</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Schrijf hier de lesinhoud..."
              rows={12}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Bijlagen */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Bijlagen</h3>
        </div>
        <div className="p-6 space-y-4">
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((url, index) => {
                const fileName = url.split("/").pop() || url;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl"
                  >
                    <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">
                      {fileName}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {showAttachmentPicker ? (
            <div className="space-y-2">
              <MediaPicker
                value=""
                onChange={(url) => addAttachment(url)}
                accept="*/*"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowAttachmentPicker(false)}
              >
                Annuleren
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowAttachmentPicker(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Bijlage toevoegen
            </Button>
          )}
        </div>
      </div>

      {/* Section 3: Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Status</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Gepubliceerd</Label>
              <p className="text-sm text-gray-500">Les is zichtbaar voor ingeschreven clients</p>
            </div>
            <Switch
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4 pt-2 pb-6">
        <Button
          type="submit"
          disabled={loading || !!success}
          className="bg-blue-500 hover:bg-blue-600 rounded-xl px-6"
        >
          {loading ? "Opslaan..." : "Opslaan"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.back()}
        >
          Annuleren
        </Button>
      </div>
    </form>
  );
}
