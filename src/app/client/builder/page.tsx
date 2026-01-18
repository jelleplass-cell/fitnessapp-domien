import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProgramBuilder } from "./program-builder";

export default async function BuilderPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  // Get all available exercises (from the user's instructor)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { instructor: true },
  });

  let exercises;
  if (user?.instructorId) {
    // Get exercises created by their instructor
    exercises = await db.exercise.findMany({
      where: { creatorId: user.instructorId },
      orderBy: { name: "asc" },
    });
  } else {
    // Get all exercises if no instructor linked
    exercises = await db.exercise.findMany({
      orderBy: { name: "asc" },
    });
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Programma maken</h1>
        <p className="text-sm text-gray-500">
          Stel je eigen trainingsprogramma samen
        </p>
      </div>

      <ProgramBuilder
        exercises={exercises.map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          durationMinutes: e.durationMinutes,
          sets: e.sets,
          reps: e.reps,
          holdSeconds: e.holdSeconds,
          restSeconds: e.restSeconds,
          caloriesPerSet: e.caloriesPerSet,
          equipment: e.equipment,
          location: e.location,
          muscleGroups: e.muscleGroups,
        }))}
        userId={session.user.id}
      />
    </div>
  );
}
