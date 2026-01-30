import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { del } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = (await req.json()) as { ids: string[] };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Geen bestanden geselecteerd" }, { status: 400 });
  }

  // Fetch media records owned by user
  const mediaItems = await db.media.findMany({
    where: {
      id: { in: ids },
      creatorId: session.user.id,
    },
  });

  // Delete from Vercel Blob
  const blobUrls = mediaItems.map((m) => m.url);
  try {
    if (blobUrls.length > 0) {
      await del(blobUrls);
    }
  } catch (error) {
    console.error("Failed to delete blobs:", error);
  }

  // Delete from database
  const result = await db.media.deleteMany({
    where: {
      id: { in: mediaItems.map((m) => m.id) },
    },
  });

  return NextResponse.json({ deleted: result.count });
}
