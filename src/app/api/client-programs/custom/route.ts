import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, exercises } = body as {
    name: string;
    description?: string;
    exercises: {
      exerciseId: string;
      order: number;
      customSets?: number;
      customReps?: number;
    }[];
  };

  if (!name || !exercises || exercises.length === 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Calculate total duration and calories
  const exerciseDetails = await db.exercise.findMany({
    where: { id: { in: exercises.map((e) => e.exerciseId) } },
  });

  let totalDuration = 0;
  let totalCalories = 0;

  exercises.forEach((e) => {
    const exercise = exerciseDetails.find((ed) => ed.id === e.exerciseId);
    if (exercise) {
      const sets = e.customSets || exercise.sets;
      totalDuration += exercise.durationMinutes + (sets - 1) * (exercise.restSeconds / 60);
      totalCalories += (exercise.caloriesPerSet || 0) * sets;
    }
  });

  // Create the program (owned by the client)
  const program = await db.program.create({
    data: {
      name,
      description,
      creatorId: session.user.id,
      durationMinutes: Math.round(totalDuration),
      caloriesBurn: Math.round(totalCalories),
      isPublic: false, // Client-created programs are private
      items: {
        create: exercises.map((e) => ({
          exerciseId: e.exerciseId,
          order: e.order,
          customSets: e.customSets,
          customReps: e.customReps,
        })),
      },
    },
  });

  // Get max order for client programs
  const maxOrder = await db.clientProgram.aggregate({
    where: { clientId: session.user.id },
    _max: { order: true },
  });

  // Assign the program to the client
  const clientProgram = await db.clientProgram.create({
    data: {
      clientId: session.user.id,
      programId: program.id,
      order: (maxOrder._max.order ?? -1) + 1,
      assignedBy: "SELF",
    },
    include: {
      program: true,
    },
  });

  // Create notification
  await db.notification.create({
    data: {
      userId: session.user.id,
      type: "PROGRAM_CREATED",
      title: "Programma aangemaakt",
      message: `Je hebt '${name}' succesvol aangemaakt.`,
      link: "/client/programs",
    },
  });

  return NextResponse.json(clientProgram);
}
