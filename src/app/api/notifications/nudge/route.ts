import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId, message } = body;

  if (!clientId) {
    return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
  }

  // Verify the client belongs to this instructor
  const client = await db.user.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (client.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not your client" }, { status: 403 });
  }

  // Get instructor name
  const instructor = await db.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, name: true },
  });

  const instructorName = instructor?.firstName || instructor?.name || "Je trainer";

  // Create notification
  const notification = await db.notification.create({
    data: {
      userId: clientId,
      type: "INSTRUCTOR_NUDGE",
      title: `Bericht van ${instructorName}`,
      message: message || "Je trainer mist je! Tijd voor een nieuwe training?",
      link: "/client/trainings",
    },
  });

  return NextResponse.json(notification);
}
