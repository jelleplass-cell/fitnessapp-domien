import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trainingSession = await db.session.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!trainingSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.session.update({
    where: { id },
    data: {
      status: "CANCELLED",
      finishedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
