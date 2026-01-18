import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId, programId, order, startDate } = body;

  // Verify client exists
  const client = await db.user.findUnique({
    where: { id: clientId, role: "CLIENT" },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Verify program exists and belongs to instructor
  const program = await db.program.findUnique({
    where: { id: programId, creatorId: session.user.id },
  });

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  // Check if already assigned
  const existing = await db.clientProgram.findUnique({
    where: {
      clientId_programId: { clientId, programId },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Program already assigned to client" },
      { status: 400 }
    );
  }

  // Get the highest current order for this client
  const maxOrder = await db.clientProgram.aggregate({
    where: { clientId },
    _max: { order: true },
  });

  const clientProgram = await db.clientProgram.create({
    data: {
      clientId,
      programId,
      order: order ?? (maxOrder._max.order ?? -1) + 1,
      startDate: startDate ? new Date(startDate) : null,
    },
    include: {
      program: true,
    },
  });

  return NextResponse.json(clientProgram);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  // Verify the client program exists and the program belongs to instructor
  const clientProgram = await db.clientProgram.findUnique({
    where: { id },
    include: { program: true },
  });

  if (!clientProgram || clientProgram.program.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.clientProgram.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
