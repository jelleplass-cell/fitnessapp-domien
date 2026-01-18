import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientProgramId, scheduledDate, scheduledTime } = body as {
    clientProgramId: string;
    scheduledDate: string;
    scheduledTime?: string | null;
  };

  if (!clientProgramId || !scheduledDate) {
    return NextResponse.json(
      { error: "Programma en datum zijn verplicht" },
      { status: 400 }
    );
  }

  // Verify the client program belongs to this user
  const clientProgram = await db.clientProgram.findFirst({
    where: {
      id: clientProgramId,
      clientId: session.user.id,
    },
  });

  if (!clientProgram) {
    return NextResponse.json(
      { error: "Programma niet gevonden" },
      { status: 404 }
    );
  }

  // Create the scheduled program
  const scheduledProgram = await db.scheduledProgram.create({
    data: {
      clientId: session.user.id,
      clientProgramId,
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime || null,
    },
  });

  return NextResponse.json(scheduledProgram);
}
