import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const equipment = await db.equipment.findUnique({
    where: { id },
    include: {
      _count: {
        select: { exercises: true },
      },
      exercises: {
        include: {
          exercise: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!equipment) {
    return NextResponse.json(
      { error: "Materiaal niet gevonden" },
      { status: 404 }
    );
  }

  return NextResponse.json(equipment);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const equipment = await db.equipment.findUnique({
    where: { id },
  });

  if (!equipment) {
    return NextResponse.json(
      { error: "Materiaal niet gevonden" },
      { status: 404 }
    );
  }

  if (
    equipment.creatorId !== session.user.id &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json(
      { error: "Je hebt geen toegang om dit materiaal te bewerken" },
      { status: 403 }
    );
  }

  const body = await req.json();

  if (!body.name) {
    return NextResponse.json(
      { error: "Naam is verplicht" },
      { status: 400 }
    );
  }

  try {
    const updated = await db.equipment.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type || undefined,
        images: body.images || null,
        steps: body.steps || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van het materiaal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const equipment = await db.equipment.findUnique({
    where: { id },
  });

  if (!equipment) {
    return NextResponse.json(
      { error: "Materiaal niet gevonden" },
      { status: 404 }
    );
  }

  if (
    equipment.creatorId !== session.user.id &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json(
      { error: "Je hebt geen toegang om dit materiaal te verwijderen" },
      { status: 403 }
    );
  }

  try {
    await db.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwijderen van het materiaal" },
      { status: 500 }
    );
  }
}
