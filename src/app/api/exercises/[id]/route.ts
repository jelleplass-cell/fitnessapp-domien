import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
      exerciseCategories: true,
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

  try {
    // Update exercise fields + categories
    const updated = await db.exercise.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        youtubeUrl: body.youtubeUrl || null,
        audioUrl: body.audioUrl || null,
        durationMinutes: body.durationMinutes ?? null,
        sets: body.sets ?? null,
        reps: body.reps ?? null,
        holdSeconds: body.holdSeconds ?? null,
        requiresEquipment: body.requiresEquipment,
        equipment: body.equipment || null,
        locations: body.locations,
        ...(body.exerciseCategoryIds !== undefined
          ? { exerciseCategories: { set: body.exerciseCategoryIds.map((catId: string) => ({ id: catId })) } }
          : {}),
      },
      include: {
        exerciseCategories: true,
      },
    });

    // Update equipment links if provided (separate queries to avoid transaction timeout)
    if (body.equipmentLinks !== undefined) {
      await db.exerciseEquipment.deleteMany({ where: { exerciseId: id } });
      if (Array.isArray(body.equipmentLinks)) {
        const linksToCreate = body.equipmentLinks
          .filter((link: { equipmentId?: string }) => link.equipmentId)
          .map((link: { equipmentId: string; alternativeEquipmentId?: string; alternativeText?: string }, i: number) => ({
            exerciseId: id,
            equipmentId: link.equipmentId,
            order: i,
            alternativeEquipmentId: link.alternativeEquipmentId || null,
            alternativeText: link.alternativeText || null,
          }));
        if (linksToCreate.length > 0) {
          await db.exerciseEquipment.createMany({ data: linksToCreate });
        }
      }
    }

    revalidatePath("/instructor/trainingen/oefeningen");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating exercise:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van de oefening" },
      { status: 500 }
    );
  }
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
