import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ExerciseForm } from "../exercise-form";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const exercise = await db.exercise.findUnique({
    where: { id },
  });

  if (!exercise) {
    notFound();
  }

  if (exercise.creatorId !== session?.user?.id) {
    redirect("/instructor/exercises");
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Oefening bewerken</h1>
      <ExerciseForm exercise={exercise} />
    </div>
  );
}
