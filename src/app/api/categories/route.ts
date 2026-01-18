import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await db.category.findMany({
    where: { creatorId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { programs: true },
      },
    },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

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

    const category = await db.category.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        color: body.color || "#3B82F6",
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
