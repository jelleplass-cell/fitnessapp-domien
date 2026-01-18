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
      difficulty: body.difficulty || "BEGINNER",
      categoryId: body.categoryId || null,
      creatorId: session.user.id,
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
