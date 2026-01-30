import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json({ error: "Cursus niet gevonden" }, { status: 404 });
    }

    const lessons = await db.lesson.findMany({
      where: { courseId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("[LESSONS_GET]", error);
    return NextResponse.json({ error: "Interne serverfout" }, { status: 500 });
  }
}

export async function POST(
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
    const { title, content, videoUrl, imageUrl, attachments, isPublished } = body;

    if (!title) {
      return NextResponse.json({ error: "Titel is verplicht" }, { status: 400 });
    }

    const lastLesson = await db.lesson.findFirst({
      where: { courseId: id },
      orderBy: { order: "desc" },
    });

    const order = lastLesson ? lastLesson.order + 1 : 0;

    const lesson = await db.lesson.create({
      data: {
        title,
        content: content || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        attachments: attachments || null,
        isPublished: isPublished || false,
        order,
        courseId: id,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("[LESSONS_POST]", error);
    return NextResponse.json({ error: "Interne serverfout" }, { status: 500 });
  }
}
