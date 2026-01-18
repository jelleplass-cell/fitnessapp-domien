import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Verify session belongs to user
  const trainingSession = await db.session.findFirst({
    where: { id: body.sessionId, userId: session.user.id },
  });

  if (!trainingSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check if already exists
  const existing = await db.sessionItem.findFirst({
    where: {
      sessionId: body.sessionId,
      programItemId: body.programItemId,
    },
  });

  if (existing) {
    // Update existing
    await db.sessionItem.update({
      where: { id: existing.id },
      data: { skipped: body.skipped },
    });
  } else {
    // Create new
    await db.sessionItem.create({
      data: {
        sessionId: body.sessionId,
        programItemId: body.programItemId,
        skipped: body.skipped,
      },
    });
  }

  return NextResponse.json({ success: true });
}
