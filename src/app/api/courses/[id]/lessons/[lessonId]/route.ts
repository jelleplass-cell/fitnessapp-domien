import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await auth();
    const { id, lessonId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== id) {
      return NextResponse.json({ error: "Les niet gevonden" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("[LESSON_GET]", error);
    return NextResponse.json({ error: "Interne serverfout" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await auth();
    const { id, lessonId } = await params;

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

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== id) {
      return NextResponse.json({ error: "Les niet gevonden" }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, videoUrl, imageUrl, attachments, isPublished, order } = body;

    const updated = await db.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(attachments !== undefined && { attachments }),
        ...(isPublished !== undefined && { isPublished }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[LESSON_PUT]", error);
    return NextResponse.json({ error: "Interne serverfout" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await auth();
    const { id, lessonId } = await params;

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

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== id) {
      return NextResponse.json({ error: "Les niet gevonden" }, { status: 404 });
    }

    await db.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LESSON_DELETE]", error);
    return NextResponse.json({ error: "Interne serverfout" }, { status: 500 });
  }
}
