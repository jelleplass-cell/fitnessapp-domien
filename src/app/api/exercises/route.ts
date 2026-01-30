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
    include: {
      exerciseCategories: true,
    },
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

    if (!body.name) {
      return NextResponse.json({ error: "Vul alle verplichte velden in" }, { status: 400 });
    }

    const exercise = await db.exercise.create({
      data: {
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        youtubeUrl: body.youtubeUrl || null,
        audioUrl: body.audioUrl || null,
        durationMinutes: body.durationMinutes || null,
        sets: body.sets || null,
        reps: body.reps || null,
        holdSeconds: body.holdSeconds || null,
        restSeconds: body.restSeconds ?? null,
        requiresEquipment: body.requiresEquipment || false,
        equipment: body.equipment || null,
        locations: body.locations || ["GYM"],
        creatorId: session.user.id,
        ...(body.exerciseCategoryIds?.length
          ? { exerciseCategories: { connect: body.exerciseCategoryIds.map((id: string) => ({ id })) } }
          : {}),
      },
      include: {
        exerciseCategories: true,
      },
    });

    // Create equipment links if provided
    if (body.equipmentLinks && Array.isArray(body.equipmentLinks)) {
      for (let i = 0; i < body.equipmentLinks.length; i++) {
        const link = body.equipmentLinks[i];
        if (link.equipmentId) {
          await db.exerciseEquipment.create({
            data: {
              exerciseId: exercise.id,
              equipmentId: link.equipmentId,
              order: i,
              alternativeEquipmentId: link.alternativeEquipmentId || null,
              alternativeText: link.alternativeText || null,
            },
          });
        }
      }
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error("Error creating exercise:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden bij het aanmaken van de oefening" }, { status: 500 });
  }
}
