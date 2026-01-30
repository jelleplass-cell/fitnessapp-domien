import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = await db.exerciseCategory.findFirst({
    where: {
      id,
      creatorId: session.user.id,
    },
    include: {
      exercises: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!category) {
    return NextResponse.json(
      { error: "Categorie niet gevonden" },
      { status: 404 }
    );
  }

  return NextResponse.json(category);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { error: "Niet geautoriseerd" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { error: "Naam is verplicht" },
        { status: 400 }
      );
    }

    // Check if category exists and belongs to user
    const existing = await db.exerciseCategory.findFirst({
      where: {
        id,
        creatorId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Categorie niet gevonden" },
        { status: 404 }
      );
    }

    const category = await db.exerciseCategory.update({
      where: { id },
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        color: body.color || existing.color,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating exercise category:", error);
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
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { error: "Niet geautoriseerd" },
        { status: 401 }
      );
    }

    // Check if category exists and belongs to user
    const existing = await db.exerciseCategory.findFirst({
      where: {
        id,
        creatorId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Categorie niet gevonden" },
        { status: 404 }
      );
    }

    await db.exerciseCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting exercise category:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
