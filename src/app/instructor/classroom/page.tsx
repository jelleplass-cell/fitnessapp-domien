import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

const accessTypeBadge: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-green-100 text-green-700" },
  SEQUENTIAL: { label: "Sequentieel", className: "bg-orange-100 text-orange-700" },
  COMMUNITY: { label: "Community", className: "bg-blue-100 text-blue-700" },
  PRIVATE: { label: "Priv\u00e9", className: "bg-purple-100 text-purple-700" },
};

export default async function ClassroomPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const courses = await db.course.findMany({
    where: { creatorId: session.user.id },
    include: {
      _count: { select: { lessons: true, enrollments: true } },
      prerequisite: { select: { title: true } },
      community: { select: { name: true } },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">Classroom</h1>
          <p className="text-sm text-gray-500 hidden md:block">
            Beheer je cursussen
          </p>
        </div>
        <Link href="/instructor/classroom/nieuw" className="flex-shrink-0">
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 rounded-xl md:size-default">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Nieuwe cursus</span>
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen cursussen</h3>
          <p className="text-gray-500 mb-4">
            Maak je eerste cursus aan
          </p>
          <Link href="/instructor/classroom/nieuw">
            <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Cursus aanmaken
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const badge = accessTypeBadge[course.accessType] || accessTypeBadge.OPEN;

            return (
              <Link
                key={course.id}
                href={`/instructor/classroom/${course.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gray-100 relative">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {course.description}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        course.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {course.isPublished ? "Gepubliceerd" : "Concept"}
                    </span>
                  </div>

                  {/* Stats */}
                  <p className="text-xs text-gray-400">
                    {course._count.lessons} lessen &middot; {course._count.enrollments} inschrijvingen
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
