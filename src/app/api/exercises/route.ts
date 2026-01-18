import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exercises = await db.exercise.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Niet geautoriseerd. Log opnieuw in als instructeur." }, { status: 401 });
    }

    const body = await req.json();

    if (!body.name || !body.durationMinutes || !body.sets) {
      return NextResponse.json({ error: "Vul alle verplichte velden in" }, { status: 400 });
    }

    const exercise = await db.exercise.create({
      data: {
        name: body.name,
        description: body.description || null,
        youtubeUrl: body.youtubeUrl || null,
        audioUrl: body.audioUrl || null,
        durationMinutes: body.durationMinutes,
        sets: body.sets,
        reps: body.reps || null,
        holdSeconds: body.holdSeconds || null,
        requiresEquipment: body.requiresEquipment || false,
        equipment: body.equipment || null,
        location: body.location || "GYM",
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(exercise);
  } catch (error) {
    console.error("Error creating exercise:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden bij het aanmaken van de oefening" }, { status: 500 });
  }
}
