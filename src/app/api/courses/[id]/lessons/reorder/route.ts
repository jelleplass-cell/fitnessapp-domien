import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "INSTRUCTOR" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    const course = await db.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json({ error: "Cursus niet gevonden" }, { status: 404 });
    }

    if (course.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    const body = await req.json();
    const { lessonIds } = body as { lessonIds: string[] };

    if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
      return NextResponse.json({ error: "lessonIds is verplicht" }, { status: 400 });
    }

    for (let i = 0; i < lessonIds.length; i++) {
      await db.lesson.update({
        where: { id: lessonIds[i] },
        data: { order: i },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LESSONS_REORDER]", error);
    return NextResponse.json({ error: "Interne serverfout" }, { status: 500 });
  }
}
