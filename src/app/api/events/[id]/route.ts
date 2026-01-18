import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await db.event.findUnique({
    where: { id },
  });

  if (!event) {
    return NextResponse.json({ error: "Event niet gevonden" }, { status: 404 });
  }

  // Only organizer or admin can delete
  if (event.creatorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
  }

  // Delete registrations first
  await db.eventRegistration.deleteMany({
    where: { eventId: id },
  });

  await db.event.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
