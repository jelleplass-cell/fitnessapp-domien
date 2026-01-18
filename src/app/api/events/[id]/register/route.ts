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
      registrations: {
        where: {
          status: "REGISTERED",
          isWaitlist: false,
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event niet gevonden" }, { status: 404 });
  }

  // Check registration deadline
  if (event.requiresRegistration) {
    const deadline = new Date(event.startDate);
    deadline.setHours(deadline.getHours() - event.registrationDeadlineHours);
    if (new Date() > deadline) {
      return NextResponse.json(
        { error: "Aanmeldingsdeadline is verstreken" },
        { status: 400 }
      );
    }
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

  // Check if event is full
  const registeredCount = event.registrations.length;
  const isFull = event.maxAttendees ? registeredCount >= event.maxAttendees : false;

  // If full and waitlist not allowed, reject
  if (isFull && !event.allowWaitlist) {
    return NextResponse.json({ error: "Event is vol" }, { status: 400 });
  }

  // Determine if this is a waitlist registration
  const isWaitlist = isFull && event.allowWaitlist;

  const registration = await db.eventRegistration.create({
    data: {
      userId: session.user.id,
      eventId,
      status: isWaitlist ? "WAITLIST" : "REGISTERED",
      isWaitlist,
    },
  });

  // Create notification
  await db.notification.create({
    data: {
      userId: session.user.id,
      type: "EVENT_REGISTRATION",
      title: isWaitlist ? "Op wachtlijst geplaatst" : "Aanmelding bevestigd",
      message: isWaitlist
        ? `Je staat op de wachtlijst voor '${event.title}'. We laten je weten als er een plek vrijkomt.`
        : `Je bent aangemeld voor '${event.title}'.`,
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

  const event = await db.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return NextResponse.json({ error: "Event niet gevonden" }, { status: 404 });
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

  // Check cancellation deadline (only for confirmed registrations, not waitlist)
  if (!registration.isWaitlist && event.requiresRegistration) {
    const cancellationDeadline = new Date(event.startDate);
    cancellationDeadline.setHours(cancellationDeadline.getHours() - event.registrationDeadlineHours);

    if (new Date() > cancellationDeadline) {
      return NextResponse.json(
        { error: `Je kunt je niet meer afmelden. De deadline was ${event.registrationDeadlineHours} uur voor het event.` },
        { status: 400 }
      );
    }
  }

  await db.eventRegistration.delete({
    where: { id: registration.id },
  });

  // If someone cancels, check if there's someone on the waitlist to promote
  if (!registration.isWaitlist && event.allowWaitlist) {
    const nextOnWaitlist = await db.eventRegistration.findFirst({
      where: {
        eventId,
        isWaitlist: true,
        status: "WAITLIST",
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (nextOnWaitlist) {
      // Promote from waitlist
      await db.eventRegistration.update({
        where: { id: nextOnWaitlist.id },
        data: {
          isWaitlist: false,
          status: "REGISTERED",
        },
      });

      // Notify the user
      await db.notification.create({
        data: {
          userId: nextOnWaitlist.userId,
          type: "EVENT_WAITLIST_PROMOTION",
          title: "Plek vrijgekomen!",
          message: `Er is een plek vrijgekomen voor '${event.title}'. Je bent nu aangemeld!`,
          link: "/client/events",
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
