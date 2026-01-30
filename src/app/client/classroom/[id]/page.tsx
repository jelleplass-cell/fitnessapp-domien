import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { CourseViewer } from "./course-viewer";

export default async function CourseViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const course = await db.course.findUnique({
    where: { id },
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
      },
      creator: { select: { name: true } },
    },
  });

  if (!course || !course.isPublished) {
    notFound();
  }

  // Check enrollment
  const enrollment = await db.courseEnrollment.findUnique({
    where: {
      clientId_courseId: {
        clientId: session.user.id,
        courseId: id,
      },
    },
  });

  if (!enrollment) {
    return (
      <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
        <div className="max-w-md mx-auto mt-20 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Geen toegang
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Je bent niet ingeschreven voor deze cursus.
            </p>
            <Link
              href="/client/classroom"
              className="inline-flex items-center text-sm text-blue-500 hover:text-blue-600"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Terug naar Classroom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch lesson progress
  const progress = await db.lessonProgress.findMany({
    where: {
      clientId: session.user.id,
      lessonId: { in: course.lessons.map((l) => l.id) },
    },
    select: { lessonId: true },
  });
  const completedLessonIds = progress.map((p) => p.lessonId);

  return (
    <CourseViewer
      course={{
        id: course.id,
        title: course.title,
        description: course.description,
        lessons: course.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          content: l.content,
          videoUrl: l.videoUrl,
          imageUrl: l.imageUrl,
          attachments: l.attachments,
          order: l.order,
        })),
        creator: { name: course.creator.name },
      }}
      completedLessonIds={completedLessonIds}
    />
  );
}
