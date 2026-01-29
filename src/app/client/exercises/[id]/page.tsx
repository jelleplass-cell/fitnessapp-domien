import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import ExerciseDetailView from "./exercise-detail-view";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/login");
  }

  const exercise = await db.exercise.findUnique({
    where: { id },
    include: {
      exerciseEquipment: {
        include: {
          equipment: true,
          alternativeEquipment: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!exercise) notFound();

  // Access check: client must have access via a program, or be the creator
  const hasAccess = await db.clientProgram.findFirst({
    where: {
      clientId: session.user.id,
      program: { items: { some: { exerciseId: id } } },
    },
  });

  if (!hasAccess && exercise.creatorId !== session.user.id) notFound();

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <ExerciseDetailView exercise={exercise} />
      </div>
    </div>
  );
}
