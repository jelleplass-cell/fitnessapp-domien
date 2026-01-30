import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { error: "Niet geautoriseerd" },
        { status: 401 }
      );
    }

    const courses = await db.course.findMany({
      where: { creatorId: session.user.id },
      include: {
        _count: {
          select: { lessons: true, enrollments: true },
        },
        prerequisite: {
          select: { id: true, title: true },
        },
        community: {
          select: { id: true, name: true },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
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

    if (!body.title || body.title.trim() === "") {
      return NextResponse.json(
        { error: "Titel is verplicht" },
        { status: 400 }
      );
    }

    const course = await db.course.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        imageUrl: body.imageUrl || null,
        accessType: body.accessType || undefined,
        prerequisiteId: body.prerequisiteId || null,
        communityId: body.communityId || null,
        isPublished: body.isPublished ?? false,
        order: body.order ?? 0,
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
