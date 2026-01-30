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
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { enrollments: true },
        },
        prerequisite: {
          select: { id: true, title: true },
        },
        community: {
          select: { id: true, name: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Cursus niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { error: "Niet geautoriseerd" },
        { status: 401 }
      );
    }

    // Check if course exists and belongs to user
    const existing = await db.course.findFirst({
      where: {
        id,
        creatorId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cursus niet gevonden" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const course = await db.course.update({
      where: { id },
      data: {
        title: body.title?.trim() || existing.title,
        description: body.description?.trim() ?? existing.description,
        imageUrl: body.imageUrl ?? existing.imageUrl,
        accessType: body.accessType ?? existing.accessType,
        prerequisiteId: body.prerequisiteId !== undefined ? body.prerequisiteId : existing.prerequisiteId,
        communityId: body.communityId !== undefined ? body.communityId : existing.communityId,
        isPublished: body.isPublished ?? existing.isPublished,
        isArchived: body.isArchived ?? existing.isArchived,
        order: body.order ?? existing.order,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
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
    const { id } = await params;

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { error: "Niet geautoriseerd" },
        { status: 401 }
      );
    }

    // Check if course exists and belongs to user
    const existing = await db.course.findFirst({
      where: {
        id,
        creatorId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cursus niet gevonden" },
        { status: 404 }
      );
    }

    await db.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
