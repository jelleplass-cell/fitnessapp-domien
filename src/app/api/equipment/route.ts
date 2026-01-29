import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EquipmentType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as EquipmentType | null;

  const where: { creatorId: string; type?: EquipmentType } = {
    creatorId: session.user.id,
  };

  if (type && (type === "MACHINE" || type === "ACCESSORY")) {
    where.type = type;
  }

  const equipment = await db.equipment.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { exercises: true },
      },
    },
  });

  return NextResponse.json({ equipment });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      (session.user.role !== "INSTRUCTOR" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json(
        { error: "Niet geautoriseerd. Log opnieuw in als instructeur." },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Naam is verplicht" },
        { status: 400 }
      );
    }

    const equipment = await db.equipment.create({
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type || "ACCESSORY",
        images: body.images || null,
        steps: body.steps || null,
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van het materiaal" },
      { status: 500 }
    );
  }
}
