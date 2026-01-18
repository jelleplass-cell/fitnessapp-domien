import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    await db.scheduledProgram.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled program:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const body = await req.json();

    const updated = await db.scheduledProgram.update({
      where: { id },
      data: {
        completed: body.completed ?? undefined,
        notes: body.notes ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating scheduled program:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
