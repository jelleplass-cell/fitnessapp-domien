import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: eventId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      _count: { select: { registrations: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event niet gevonden" }, { status: 404 });
  }

  // Check if already registered
  const existingRegistration = await db.eventRegistration.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: session.user.id,
      },
    },
  });

  if (existingRegistration) {
    return NextResponse.json({ error: "Je bent al aangemeld" }, { status: 400 });
  }

  // Check max participants
  if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
    return NextResponse.json({ error: "Event is vol" }, { status: 400 });
  }

  const registration = await db.eventRegistration.create({
    data: {
      userId: session.user.id,
      eventId,
    },
  });

  // Create notification
  await db.notification.create({
    data: {
      userId: session.user.id,
      type: "EVENT_REGISTRATION",
      title: "Aanmelding bevestigd",
      message: `Je bent aangemeld voor '${event.title}'.`,
      link: "/client/events",
    },
  });

  return NextResponse.json(registration);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: eventId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const registration = await db.eventRegistration.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: session.user.id,
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Niet aangemeld" }, { status: 404 });
  }

  await db.eventRegistration.delete({
    where: { id: registration.id },
  });

  return NextResponse.json({ success: true });
}
