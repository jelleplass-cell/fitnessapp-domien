import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: clientProgramId } = await params;

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Soft delete by setting isActive to false
  await db.clientProgram.update({
    where: { id: clientProgramId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
