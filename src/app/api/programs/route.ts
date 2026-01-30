import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const programs = await db.program.findMany({
    where: { creatorId: session.user.id, isArchived: false },
    include: {
      items: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(programs);
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const program = await db.program.create({
    data: {
      name: body.name,
      description: body.description || null,
      shortDescription: body.shortDescription || null,
      imageUrl: body.imageUrl || null,
      difficulty: body.difficulty || "BEGINNER",
      location: body.location || "GYM",
      equipmentNeeded: body.equipmentNeeded || null,
      isPublic: body.isPublic || false,
      categories: body.categoryIds?.length ? { connect: body.categoryIds.map((id: string) => ({ id })) } : undefined,
      creatorId: session.user.id,
      items: {
        create: body.exercises.map(
          (item: {
            exerciseId: string;
            order: number;
            section?: string;
            sets?: number;
            reps?: string;
            holdSeconds?: number;
            durationMinutes?: number;
            restSeconds?: number;
            exerciseType?: string;
            weightPerSet?: string;
            intensity?: string;
            notes?: string;
          }) => ({
            exerciseId: item.exerciseId,
            order: item.order,
            section: item.section || null,
            sets: item.sets || null,
            reps: item.reps || null,
            holdSeconds: item.holdSeconds || null,
            durationMinutes: item.durationMinutes || null,
            restSeconds: item.restSeconds || null,
            exerciseType: item.exerciseType || null,
            weightPerSet: item.weightPerSet || null,
            intensity: item.intensity || null,
            notes: item.notes || null,
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
