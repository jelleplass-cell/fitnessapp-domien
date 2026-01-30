import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessCourse } from "@/lib/classroom-access";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: courseId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        isPublished: true,
        accessType: true,
        prerequisiteId: true,
        communityId: true,
        creatorId: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Cursus niet gevonden" },
        { status: 404 }
      );
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: "Deze cursus is niet gepubliceerd" },
        { status: 400 }
      );
    }

    const access = await canAccessCourse(session.user.id, course);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason },
        { status: 403 }
      );
    }

    const enrollment = await db.courseEnrollment.upsert({
      where: {
        clientId_courseId: {
          clientId: session.user.id,
          courseId,
        },
      },
      update: {},
      create: {
        clientId: session.user.id,
        courseId,
      },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error enrolling in course:", error);
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
      return NextResponse.json(
        { error: "Je bent niet ingeschreven voor deze cursus" },
        { status: 404 }
      );
    }

    // Get all lesson IDs for this course to delete progress
    const lessons = await db.lesson.findMany({
      where: { courseId },
      select: { id: true },
    });

    const lessonIds = lessons.map((l) => l.id);

    // Delete lesson progress and enrollment in a transaction
    await db.$transaction([
      db.lessonProgress.deleteMany({
        where: {
          clientId: session.user.id,
          lessonId: { in: lessonIds },
        },
      }),
      db.courseEnrollment.delete({
        where: {
          clientId_courseId: {
            clientId: session.user.id,
            courseId,
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unenrolling from course:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
