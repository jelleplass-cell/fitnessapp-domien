"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ChevronUp, ChevronDown, Trash2, Pencil } from "lucide-react";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  order: number;
  isPublished: boolean;
}

interface LessonsManagerProps {
  courseId: string;
  initialLessons: Lesson[];
}

export default function LessonsManager({ courseId, initialLessons }: LessonsManagerProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [reordering, setReordering] = useState(false);

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;

    const reordered = [...lessons];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setLessons(reordered);
    setReordering(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonIds: reordered.map((l) => l.id) }),
      });

      if (!res.ok) {
        // Revert on failure
        setLessons(lessons);
      } else {
        router.refresh();
      }
    } catch {
      setLessons(lessons);
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async (lessonId: string, title: string) => {
    if (!window.confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) return;

    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLessons((prev) => prev.filter((l) => l.id !== lessonId));
        router.refresh();
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Lessen</h3>
        <Link href={`/instructor/classroom/${courseId}/lessen/nieuw`}>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe les
          </Button>
        </Link>
      </div>

      <div className="p-6">
        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Nog geen lessen. Voeg je eerste les toe.</p>
            <Link href={`/instructor/classroom/${courseId}/lessen/nieuw`}>
              <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Les toevoegen
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl"
              >
                {/* Order number */}
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                  {index + 1}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate block">
                    {lesson.title}
                  </span>
                </div>

                {/* Status badge */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    lesson.isPublished
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {lesson.isPublished ? "Gepubliceerd" : "Concept"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleReorder(index, "up")}
                    disabled={index === 0 || reordering}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleReorder(index, "down")}
                    disabled={index === lessons.length - 1 || reordering}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Link href={`/instructor/classroom/${courseId}/lessen/${lesson.id}`}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(lesson.id, lesson.title)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
