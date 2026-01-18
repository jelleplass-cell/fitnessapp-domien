import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET public programs from the library
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const difficulty = searchParams.get("difficulty");
  const location = searchParams.get("location");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {
    isPublic: true,
    isArchived: false,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  if (location) {
    where.location = location;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const programs = await db.program.findMany({
    where,
    include: {
      category: true,
      creator: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
        },
      },
      items: {
        include: {
          exercise: true,
        },
        orderBy: { order: "asc" },
      },
      _count: {
        select: { clientPrograms: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get categories for filtering
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ programs, categories });
}

// POST - Add a library program to client's programs
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { programId } = body;

  // Verify program is public
  const program = await db.program.findUnique({
    where: { id: programId, isPublic: true },
  });

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  // Check if already added
  const existing = await db.clientProgram.findUnique({
    where: {
      clientId_programId: {
        clientId: session.user.id,
        programId,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Programma al toegevoegd" },
      { status: 400 }
    );
  }

  // Get max order
  const maxOrder = await db.clientProgram.aggregate({
    where: { clientId: session.user.id },
    _max: { order: true },
  });

  const clientProgram = await db.clientProgram.create({
    data: {
      clientId: session.user.id,
      programId,
      order: (maxOrder._max.order ?? -1) + 1,
      assignedBy: "LIBRARY",
    },
    include: {
      program: true,
    },
  });

  // Create notification
  await db.notification.create({
    data: {
      userId: session.user.id,
      type: "PROGRAM_ADDED",
      title: "Programma toegevoegd",
      message: `Je hebt '${clientProgram.program.name}' toegevoegd aan je programma's.`,
      link: "/client/programs",
    },
  });

  return NextResponse.json(clientProgram);
}
