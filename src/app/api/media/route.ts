import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "all"; // "all" | "image" | "document"
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = {
    creatorId: session.user.id,
  };

  if (search) {
    where.originalName = { contains: search, mode: "insensitive" };
  }

  if (type === "image") {
    where.mimeType = { startsWith: "image/" };
  } else if (type === "document") {
    where.mimeType = { not: { startsWith: "image/" } };
  }

  const [media, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        url: true,
        originalName: true,
        mimeType: true,
        size: true,
        width: true,
        height: true,
        createdAt: true,
      },
    }),
    db.media.count({ where }),
  ]);

  return NextResponse.json({ media, total });
}
