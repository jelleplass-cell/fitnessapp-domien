import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import LessonForm from "../lesson-form";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const { id, lessonId } = await params;

  const course = await db.course.findUnique({
    where: { id },
    select: { id: true, creatorId: true },
  });

  if (!course) {
    notFound();
  }

  if (course.creatorId !== session.user.id) {
    redirect("/instructor/classroom");
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
  });

  if (!lesson || lesson.courseId !== id) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Les bewerken</h1>
      <LessonForm
        courseId={id}
        lesson={{
          id: lesson.id,
          title: lesson.title,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          imageUrl: lesson.imageUrl,
          attachments: lesson.attachments,
          isPublished: lesson.isPublished,
        }}
      />
    </div>
  );
}
