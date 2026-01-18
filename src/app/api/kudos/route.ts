import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, emoji, message } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  // Verify the session belongs to one of the instructor's clients
  const trainingSession = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
    },
  });

  if (!trainingSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (trainingSession.user.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not your client" }, { status: 403 });
  }

  // Create or update kudos
  const kudos = await db.activityKudos.upsert({
    where: {
      sessionId_instructorId: {
        sessionId,
        instructorId: session.user.id,
      },
    },
    update: {
      emoji: emoji || "💪",
      message: message || null,
    },
    create: {
      sessionId,
      instructorId: session.user.id,
      emoji: emoji || "💪",
      message: message || null,
    },
  });

  // Create a notification for the client
  await db.notification.create({
    data: {
      userId: trainingSession.userId,
      type: "KUDOS_RECEIVED",
      title: `${emoji || "💪"} Kudos van je trainer!`,
      message: message || "Je trainer heeft je een compliment gegeven voor je training!",
      link: "/client/dashboard",
    },
  });

  return NextResponse.json(kudos);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  await db.activityKudos.deleteMany({
    where: {
      sessionId,
      instructorId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
