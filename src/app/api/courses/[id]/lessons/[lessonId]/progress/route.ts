import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await auth();
    const { id: courseId, lessonId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify lesson exists and belongs to this course
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== courseId) {
      return NextResponse.json(
        { error: "Les niet gevonden in deze cursus" },
        { status: 404 }
      );
    }

    // Upsert lesson progress
    await db.lessonProgress.upsert({
      where: {
        clientId_lessonId: {
          clientId: session.user.id,
          lessonId,
        },
      },
      update: {},
      create: {
        clientId: session.user.id,
        lessonId,
      },
    });

    // Check if all published lessons in this course are now completed
    const totalPublishedLessons = await db.lesson.count({
      where: {
        courseId,
        isPublished: true,
      },
    });

    const completedLessons = await db.lessonProgress.count({
      where: {
        clientId: session.user.id,
        lesson: {
          courseId,
          isPublished: true,
        },
      },
    });

    const courseCompleted = completedLessons >= totalPublishedLessons;

    if (courseCompleted) {
      await db.courseEnrollment.updateMany({
        where: {
          clientId: session.user.id,
          courseId,
          completedAt: null,
        },
        data: {
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ completed: true, courseCompleted });
  } catch (error) {
    console.error("Error marking lesson as completed:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await auth();
    const { id: courseId, lessonId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify lesson belongs to this course
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== courseId) {
      return NextResponse.json(
        { error: "Les niet gevonden in deze cursus" },
        { status: 404 }
      );
    }

    // Delete lesson progress
    await db.lessonProgress.deleteMany({
      where: {
        clientId: session.user.id,
        lessonId,
      },
    });

    // Reset course completion if it was set
    await db.courseEnrollment.updateMany({
      where: {
        clientId: session.user.id,
        courseId,
        completedAt: { not: null },
      },
      data: {
        completedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unmarking lesson completion:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
