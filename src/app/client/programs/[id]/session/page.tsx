import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SessionView } from "./session-view";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientProgramId } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  // Get clientProgram with program details
  const clientProgram = await db.clientProgram.findFirst({
    where: { id: clientProgramId, clientId: userId },
    include: {
      program: {
        include: {
          items: {
            include: { exercise: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!clientProgram) {
    notFound();
  }

  // Get or create active session
  let activeSession = await db.session.findFirst({
    where: { clientProgramId, userId, status: "IN_PROGRESS" },
    include: {
      completedItems: true,
    },
  });

  if (!activeSession) {
    // Create new session
    activeSession = await db.session.create({
      data: {
        clientProgramId,
        userId: userId!,
        status: "IN_PROGRESS",
      },
      include: {
        completedItems: true,
      },
    });
  }

  if (!activeSession) {
    notFound();
  }

  // Transform data for client component
  const sessionData = {
    id: activeSession.id,
    startedAt: activeSession.startedAt.toISOString(),
    programName: clientProgram.program.name,
    items: clientProgram.program.items.map((item) => ({
      id: item.id,
      order: item.order,
      exercise: {
        id: item.exercise.id,
        name: item.exercise.name,
        description: item.exercise.description,
        youtubeUrl: item.exercise.youtubeUrl,
        audioUrl: item.exercise.audioUrl,
        durationMinutes: item.exercise.durationMinutes,
        sets: item.exercise.sets,
        reps: item.exercise.reps,
        holdSeconds: item.exercise.holdSeconds,
        equipment: item.exercise.equipment,
        locations: item.exercise.locations,
      },
      completed: activeSession.completedItems.some(
        (ci) => ci.programItemId === item.id && !ci.skipped
      ),
      skipped: activeSession.completedItems.some(
        (ci) => ci.programItemId === item.id && ci.skipped
      ),
    })),
  };

  return <SessionView session={sessionData} clientProgramId={clientProgramId} />;
}
