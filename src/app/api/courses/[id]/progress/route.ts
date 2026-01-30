import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: courseId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enrollment = await db.courseEnrollment.findUnique({
      where: {
        clientId_courseId: {
          clientId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({
        enrolled: false,
        enrolledAt: null,
        completedAt: null,
        totalLessons: 0,
        completedLessons: 0,
        percentage: 0,
        completedLessonIds: [],
      });
    }

    // Get total published lessons count
    const totalLessons = await db.lesson.count({
      where: {
        courseId,
        isPublished: true,
      },
    });

    // Get completed lesson progress records
    const progressRecords = await db.lessonProgress.findMany({
      where: {
        clientId: session.user.id,
        lesson: {
          courseId,
          isPublished: true,
        },
      },
      select: {
        lessonId: true,
      },
    });

    const completedLessons = progressRecords.length;
    const percentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return NextResponse.json({
      enrolled: true,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      totalLessons,
      completedLessons,
      percentage,
      completedLessonIds: progressRecords.map((p) => p.lessonId),
    });
  } catch (error) {
    console.error("Error fetching course progress:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
