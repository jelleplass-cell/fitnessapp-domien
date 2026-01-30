import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import LessonForm from "../lesson-form";

export default async function NieuweLesPage({
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
    select: { id: true, creatorId: true, title: true },
  });

  if (!course) {
    notFound();
  }

  if (course.creatorId !== session.user.id) {
    redirect("/instructor/classroom");
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Nieuwe les</h1>
      <LessonForm courseId={id} />
    </div>
  );
}
