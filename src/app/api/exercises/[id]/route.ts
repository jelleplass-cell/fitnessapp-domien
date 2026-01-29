import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exercise = await db.exercise.findUnique({
    where: { id },
    include: {
      exerciseEquipment: {
        include: {
          equipment: { select: { id: true, name: true, type: true } },
          alternativeEquipment: { select: { id: true, name: true, type: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(exercise);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exercise = await db.exercise.findUnique({
    where: { id },
  });

  if (!exercise || exercise.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  const updated = await db.$transaction(async (tx) => {
    const ex = await tx.exercise.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        youtubeUrl: body.youtubeUrl || null,
        audioUrl: body.audioUrl || null,
        durationMinutes: body.durationMinutes,
        sets: body.sets,
        reps: body.reps || null,
        holdSeconds: body.holdSeconds || null,
        requiresEquipment: body.requiresEquipment,
        equipment: body.equipment || null,
        locations: body.locations,
      },
    });

    // Update equipment links if provided
    if (body.equipmentLinks !== undefined) {
      await tx.exerciseEquipment.deleteMany({ where: { exerciseId: id } });
      if (Array.isArray(body.equipmentLinks)) {
        for (let i = 0; i < body.equipmentLinks.length; i++) {
          const link = body.equipmentLinks[i];
          if (link.equipmentId) {
            await tx.exerciseEquipment.create({
              data: {
                exerciseId: id,
                equipmentId: link.equipmentId,
                order: i,
                alternativeEquipmentId: link.alternativeEquipmentId || null,
                alternativeText: link.alternativeText || null,
              },
            });
          }
        }
      }
    }

    return ex;
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exercise = await db.exercise.findUnique({
    where: { id },
  });

  if (!exercise || exercise.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.exercise.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
