import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Geen items geselecteerd" }, { status: 400 });
    }

    const result = await db.exercise.deleteMany({
      where: {
        id: { in: ids },
        creatorId: session.user.id,
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Bulk delete exercises failed:", error);
    return NextResponse.json({ error: "Verwijderen mislukt" }, { status: 500 });
  }
}
