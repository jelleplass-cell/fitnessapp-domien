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

  const program = await db.program.findUnique({
    where: { id },
    include: {
      items: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!program) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(program);
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

  // Verify ownership
  const existing = await db.program.findUnique({
    where: { id, creatorId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  // Delete existing items and recreate
  await db.programItem.deleteMany({
    where: { programId: id },
  });

  const program = await db.program.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
      shortDescription: body.shortDescription || null,
      imageUrl: body.imageUrl || null,
      difficulty: body.difficulty || existing.difficulty,
      location: body.location || existing.location,
      equipmentNeeded: body.equipmentNeeded || null,
      isPublic: body.isPublic ?? existing.isPublic,
      categoryId: body.categoryId || null,
      items: {
        create: body.exercises.map(
          (item: { exerciseId: string; order: number }) => ({
            exerciseId: item.exerciseId,
            order: item.order,
          })
        ),
      },
    },
    include: {
      items: true,
    },
  });

  return NextResponse.json(program);
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

  // Verify ownership
  const existing = await db.program.findUnique({
    where: { id, creatorId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.program.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
