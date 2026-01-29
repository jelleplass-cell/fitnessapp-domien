import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ExerciseForm } from "../exercise-form";

export default async function EditOefeningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const exercise = await db.exercise.findUnique({
    where: { id },
  });

  if (!exercise) {
    notFound();
  }

  if (exercise.creatorId !== session.user.id) {
    redirect("/instructor/trainingen/oefeningen");
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Oefening bewerken</h1>
      <ExerciseForm exercise={exercise} />
    </div>
  );
}
