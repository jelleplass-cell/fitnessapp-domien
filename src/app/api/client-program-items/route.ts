import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientProgramId, items } = body;

  if (!clientProgramId || !Array.isArray(items)) {
    return NextResponse.json(
      { error: "clientProgramId and items are required" },
      { status: 400 }
    );
  }

  // Verify the client program belongs to this instructor
  const clientProgram = await db.clientProgram.findUnique({
    where: { id: clientProgramId },
    include: {
      program: {
        select: { creatorId: true },
      },
      client: {
        select: { instructorId: true },
      },
    },
  });

  if (!clientProgram) {
    return NextResponse.json(
      { error: "Client program not found" },
      { status: 404 }
    );
  }

  // Check if the instructor owns the program or the client
  if (
    clientProgram.program.creatorId !== session.user.id &&
    clientProgram.client.instructorId !== session.user.id
  ) {
    return NextResponse.json(
      { error: "Not authorized to modify this program" },
      { status: 403 }
    );
  }

  // Delete existing custom items for this client program
  await db.clientProgramItem.deleteMany({
    where: { clientProgramId },
  });

  // Create new custom items
  if (items.length > 0) {
    // Get the max order from the program items for added exercises
    const programItems = await db.programItem.findMany({
      where: { programId: clientProgram.programId },
      orderBy: { order: "desc" },
      take: 1,
    });
    const maxOrder = programItems[0]?.order ?? 0;

    await db.clientProgramItem.createMany({
      data: items.map((item: {
        exerciseId: string;
        customSets: number | null;
        customReps: number | null;
        customDuration: number | null;
        notes: string | null;
        isRemoved: boolean;
        isAdded: boolean;
      }, index: number) => ({
        clientProgramId,
        exerciseId: item.exerciseId,
        customSets: item.customSets,
        customReps: item.customReps,
        customDuration: item.customDuration,
        notes: item.notes,
        isRemoved: item.isRemoved,
        isAdded: item.isAdded,
        order: item.isAdded ? maxOrder + index + 1 : index,
      })),
    });
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientProgramId = searchParams.get("clientProgramId");

  if (!clientProgramId) {
    return NextResponse.json(
      { error: "clientProgramId is required" },
      { status: 400 }
    );
  }

  // Verify access
  const clientProgram = await db.clientProgram.findUnique({
    where: { id: clientProgramId },
    include: {
      program: {
        select: { creatorId: true },
      },
      client: {
        select: { instructorId: true, id: true },
      },
    },
  });

  if (!clientProgram) {
    return NextResponse.json(
      { error: "Client program not found" },
      { status: 404 }
    );
  }

  // Check access: instructor who owns it or client who it belongs to
  const isInstructor =
    session.user.role === "INSTRUCTOR" &&
    (clientProgram.program.creatorId === session.user.id ||
      clientProgram.client.instructorId === session.user.id);
  const isClient =
    session.user.role === "CLIENT" &&
    clientProgram.client.id === session.user.id;

  if (!isInstructor && !isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const customItems = await db.clientProgramItem.findMany({
    where: { clientProgramId },
    include: {
      exercise: {
        select: {
          id: true,
          name: true,
          sets: true,
          reps: true,
          holdSeconds: true,
          durationMinutes: true,
        },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(customItems);
}
