import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { BookOpen, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EnrollButton } from "./enroll-button";

export default async function ClassroomPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  // Fetch enrolled courses
  const enrollments = await db.courseEnrollment.findMany({
    where: { clientId: session.user.id },
    include: {
      course: {
        include: {
          lessons: {
            where: { isPublished: true },
            select: { id: true },
          },
          creator: { select: { name: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Fetch lesson progress
  const lessonProgress = await db.lessonProgress.findMany({
    where: { clientId: session.user.id },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(lessonProgress.map((lp) => lp.lessonId));

  // Fetch available courses (OPEN + published, not yet enrolled)
  const enrolledCourseIds = enrollments.map((e) => e.courseId);
  const client = await db.user.findUnique({
    where: { id: session.user.id },
    select: { instructorId: true },
  });

  const availableCourses = client?.instructorId
    ? await db.course.findMany({
        where: {
          creatorId: client.instructorId,
          isPublished: true,
          isArchived: false,
          id: { notIn: enrolledCourseIds },
          accessType: "OPEN",
        },
        include: {
          _count: { select: { lessons: true } },
          creator: { select: { name: true } },
        },
        orderBy: { order: "asc" },
      })
    : [];

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Classroom</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bekijk en volg je cursussen
        </p>
      </div>

      {/* Mijn cursussen */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Mijn cursussen
        </h2>

        {enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium">
              Je bent nog niet ingeschreven voor cursussen.
            </p>
            <p className="text-sm mt-1">
              Bekijk de beschikbare cursussen hieronder om te beginnen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;
              const totalLessons = course.lessons.length;
              const completedCount = course.lessons.filter((l) =>
                completedLessonIds.has(l.id)
              ).length;
              const progressPercent =
                totalLessons > 0
                  ? Math.round((completedCount / totalLessons) * 100)
                  : 0;
              const isCompleted = !!enrollment.completedAt;

              return (
                <Link
                  key={enrollment.id}
                  href={`/client/classroom/${course.id}`}
                  className="block group"
                >
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                    {course.imageUrl ? (
                      <div
                        className="h-40 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{
                          backgroundImage: `url(${course.imageUrl})`,
                        }}
                      />
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </h3>
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800 border-0 shrink-0">
                            Voltooid
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Door {course.creator.name}
                      </p>

                      {/* Progress bar */}
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
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Beschikbare cursussen */}
      {availableCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Beschikbare cursussen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {course.imageUrl ? (
                  <div
                    className="h-40 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${course.imageUrl})`,
                    }}
                  />
                ) : (
                  <div className="h-40 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <GraduationCap className="w-12 h-12 text-white/50" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Door {course.creator.name}
                  </p>
                  {course.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {course._count.lessons} lessen
                  </p>
                  <div className="mt-3">
                    <EnrollButton courseId={course.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
