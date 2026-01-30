import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { del } from "@vercel/blob";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const media = await db.media.findUnique({ where: { id } });

  if (!media || media.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Delete from Vercel Blob
    await del(media.url);
  } catch (error) {
    console.error("Failed to delete blob:", error);
    // Continue with DB deletion even if Blob delete fails
  }

  await db.media.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
