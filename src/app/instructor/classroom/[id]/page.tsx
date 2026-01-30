import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import CourseForm from "../course-form";
import LessonsManager from "./lessons-manager";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const { id } = await params;

  const course = await db.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  if (course.creatorId !== session.user.id) {
    redirect("/instructor/classroom");
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Cursus bewerken</h1>

      <div className="space-y-8">
        <CourseForm
          course={{
            id: course.id,
            title: course.title,
            description: course.description,
            imageUrl: course.imageUrl,
            accessType: course.accessType,
            prerequisiteId: course.prerequisiteId,
            communityId: course.communityId,
            isPublished: course.isPublished,
            isArchived: course.isArchived,
          }}
        />

        <LessonsManager
          courseId={id}
          initialLessons={course.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            order: l.order,
            isPublished: l.isPublished,
          }))}
        />
      </div>
    </div>
  );
}
