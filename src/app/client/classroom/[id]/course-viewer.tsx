"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Download,
  Play,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface CourseViewerProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    lessons: Array<{
      id: string;
      title: string;
      content: string | null;
      videoUrl: string | null;
      imageUrl: string | null;
      attachments: string | null;
      order: number;
    }>;
    creator: { name: string | null };
  };
  completedLessonIds: string[];
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    // Handle youtu.be format
    const shortMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/
    );
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    // Handle youtube.com/watch?v= format
    const longMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/
    );
    if (longMatch) {
      return `https://www.youtube.com/embed/${longMatch[1]}`;
    }

    // Handle youtube.com/embed/ format (already embedded)
    const embedMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
    );
    if (embedMatch) {
      return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }

    return null;
  } catch {
    return null;
  }
}

function parseAttachments(
  attachments: string | null
): Array<{ name: string; url: string }> {
  if (!attachments) return [];
  try {
    const parsed = JSON.parse(attachments);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === "string") {
          const fileName = item.split("/").pop() || "Download";
          return { name: fileName, url: item };
        }
        return { name: item.name || "Download", url: item.url || item };
      });
    }
    return [];
  } catch {
    // If not JSON, treat as comma-separated URLs
    return attachments.split(",").map((url) => {
      const trimmed = url.trim();
      const fileName = trimmed.split("/").pop() || "Download";
      return { name: fileName, url: trimmed };
    });
  }
}

export function CourseViewer({ course, completedLessonIds }: CourseViewerProps) {
  const [activeLesson, setActiveLesson] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(completedLessonIds)
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const router = useRouter();

  const currentLesson = course.lessons[activeLesson];
  const totalLessons = course.lessons.length;
  const completedCount = course.lessons.filter((l) =>
    completed.has(l.id)
  ).length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const handleMarkComplete = useCallback(async () => {
    if (!currentLesson || completed.has(currentLesson.id)) return;

    setMarkingComplete(true);
    try {
      const res = await fetch(
        `/api/courses/${course.id}/lessons/${currentLesson.id}/progress`,
        { method: "POST" }
      );
      if (res.ok) {
        setCompleted((prev) => {
          const next = new Set(prev);
          next.add(currentLesson.id);
          return next;
        });
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingComplete(false);
    }
  }, [currentLesson, completed, course.id, router]);

  const goToPrevious = () => {
    if (activeLesson > 0) {
      setActiveLesson(activeLesson - 1);
    }
  };

  const goToNext = () => {
    if (activeLesson < totalLessons - 1) {
      setActiveLesson(activeLesson + 1);
    }
  };

  const selectLesson = (index: number) => {
    setActiveLesson(index);
    setSidebarOpen(false);
  };

  if (totalLessons === 0) {
    return (
      <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
        <div className="max-w-md mx-auto mt-20 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Geen lessen beschikbaar
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Deze cursus heeft nog geen gepubliceerde lessen.
            </p>
            <Link
              href="/client/classroom"
              className="inline-flex items-center text-sm text-blue-500 hover:text-blue-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Terug naar Classroom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = currentLesson?.videoUrl
    ? getYouTubeEmbedUrl(currentLesson.videoUrl)
    : null;
  const attachments = parseAttachments(currentLesson?.attachments ?? null);
  const isCurrentCompleted = currentLesson
    ? completed.has(currentLesson.id)
    : false;

  // Sidebar content (reused in both desktop and mobile)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 truncate">
          {course.title}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Door {course.creator.name}
        </p>
        <div className="mt-3">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {completedCount} van {totalLessons} lessen voltooid
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {course.lessons.map((lesson, index) => {
          const isActive = index === activeLesson;
          const isDone = completed.has(lesson.id);

          return (
            <button
              key={lesson.id}
              onClick={() => selectLesson(index)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-blue-50 border-r-2 border-blue-500"
                  : "hover:bg-gray-50"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 shrink-0" />
              )}
              <span
                className={`text-sm truncate ${
                  isActive
                    ? "font-medium text-blue-700"
                    : isDone
                    ? "text-gray-500"
                    : "text-gray-700"
                }`}
              >
                {lesson.title}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <Link
          href="/client/classroom"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Terug naar Classroom
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - mobile (slide-over) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-100 shadow-lg transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Sidebar - desktop */}
      <div className="hidden md:flex w-80 bg-white border-r border-gray-100 flex-col shrink-0">
        {sidebarContent}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="font-medium text-gray-900 truncate text-sm">
            {currentLesson?.title}
          </h2>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Lesson title */}
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            {currentLesson?.title}
          </h1>

          {/* Video embed */}
          {embedUrl && (
            <div className="mb-6">
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={embedUrl}
                  title={currentLesson?.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Video URL without embed (non-YouTube) */}
          {currentLesson?.videoUrl && !embedUrl && (
            <div className="mb-6">
              <a
                href={currentLesson.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 bg-blue-50 rounded-xl px-4 py-3"
              >
                <Play className="w-5 h-5" />
                <span className="text-sm font-medium">Bekijk video</span>
              </a>
            </div>
          )}

          {/* Image */}
          {currentLesson?.imageUrl && (
            <div className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentLesson.imageUrl}
                alt={currentLesson.title}
                className="w-full rounded-xl object-cover max-h-96"
              />
            </div>
          )}

          {/* Content */}
          {currentLesson?.content && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {currentLesson.content}
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Bijlagen
              </h3>
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Download className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {attachment.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Mark as complete button */}
          <div className="mb-6">
            {isCurrentCompleted ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-100 text-green-700 font-medium cursor-default"
              >
                <CheckCircle2 className="w-5 h-5" />
                Voltooid
              </button>
            ) : (
              <Button
                onClick={handleMarkComplete}
                disabled={markingComplete}
                className="w-full bg-green-500 hover:bg-green-600 rounded-xl py-3 h-auto text-base"
              >
                {markingComplete
                  ? "Bezig..."
                  : "Markeer als voltooid"}
              </Button>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-4 pb-8">
            <Button
              onClick={goToPrevious}
              disabled={activeLesson === 0}
              variant="outline"
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Vorige les
            </Button>
            <span className="text-sm text-gray-500">
              {activeLesson + 1} / {totalLessons}
            </span>
            <Button
              onClick={goToNext}
              disabled={activeLesson === totalLessons - 1}
              variant="outline"
              className="rounded-xl"
            >
              Volgende les
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
