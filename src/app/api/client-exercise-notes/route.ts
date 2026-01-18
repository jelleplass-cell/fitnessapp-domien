import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientProgramId, notes } = body as {
    clientProgramId: string;
    notes: { exerciseId: string; note: string }[];
  };

  if (!clientProgramId || !Array.isArray(notes)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Verify the client program exists and belongs to a program created by this instructor
  const clientProgram = await db.clientProgram.findUnique({
    where: { id: clientProgramId },
    include: { program: true },
  });

  if (!clientProgram || clientProgram.program.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete existing notes for this client program
  await db.clientExerciseNote.deleteMany({
    where: { clientProgramId },
  });

  // Create new notes
  if (notes.length > 0) {
    await db.clientExerciseNote.createMany({
      data: notes.map((note) => ({
        clientProgramId,
        exerciseId: note.exerciseId,
        note: note.note,
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
    return NextResponse.json({ error: "clientProgramId required" }, { status: 400 });
  }

  const notes = await db.clientExerciseNote.findMany({
    where: { clientProgramId },
    include: { exercise: true },
  });

  return NextResponse.json(notes);
}
