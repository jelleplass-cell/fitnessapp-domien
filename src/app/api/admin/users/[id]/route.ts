import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Je kunt je eigen rol niet wijzigen" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { role } = body;

  if (!role || !["CLIENT", "INSTRUCTOR", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
  }

  try {
    await db.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Je kunt je eigen account niet verwijderen" },
      { status: 400 }
    );
  }

  try {
    // Delete all related data
    await db.sessionItem.deleteMany({
      where: { session: { userId: id } },
    });

    await db.session.deleteMany({
      where: { userId: id },
    });

    await db.scheduledProgram.deleteMany({
      where: { clientId: id },
    });

    await db.clientExerciseNote.deleteMany({
      where: { clientProgram: { clientId: id } },
    });

    await db.clientProgram.deleteMany({
      where: { clientId: id },
    });

    await db.notification.deleteMany({
      where: { userId: id },
    });

    await db.postComment.deleteMany({
      where: { authorId: id },
    });

    await db.communityPost.deleteMany({
      where: { authorId: id },
    });

    await db.eventRegistration.deleteMany({
      where: { userId: id },
    });

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
