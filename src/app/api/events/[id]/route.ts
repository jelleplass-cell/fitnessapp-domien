import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventType } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await db.event.findUnique({ where: { id } });

  if (!event) {
    return NextResponse.json({ error: "Event niet gevonden" }, { status: 404 });
  }

  if (event.creatorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.title || !body.startDate) {
    return NextResponse.json({ error: "Titel en datum zijn verplicht" }, { status: 400 });
  }

  const startDate = new Date(body.startDate);
  const endDate = body.endDate ? new Date(body.endDate) : null;

  const updated = await db.event.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description || null,
      eventType: (body.eventType as EventType) || event.eventType,
      startDate,
      endDate,
      location: body.location || null,
      locationDetails: body.locationDetails || null,
      meetingUrl: body.meetingUrl || null,
      meetingPlatform: body.meetingPlatform || null,
      imageUrl: body.imageUrl || null,
      videoUrl: body.videoUrl || null,
      equipment: body.equipment || null,
      difficulty: body.difficulty || null,
      maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees) : null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await db.event.findUnique({
    where: { id },
  });

  if (!event) {
    return NextResponse.json({ error: "Event niet gevonden" }, { status: 404 });
  }

  // Only organizer or admin can delete
  if (event.creatorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
  }

  // Delete registrations first
  await db.eventRegistration.deleteMany({
    where: { eventId: id },
  });

  await db.event.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
