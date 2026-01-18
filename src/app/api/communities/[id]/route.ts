import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Get single community with members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const community = await db.community.findUnique({
    where: { id, creatorId: session.user.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
      _count: {
        select: { posts: true },
      },
    },
  });

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  return NextResponse.json(community);
}

// PUT - Update community
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, color, icon, order } = body;

  // Check ownership
  const existing = await db.community.findUnique({
    where: { id, creatorId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const community = await db.community.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      description: description !== undefined ? description : existing.description,
      color: color ?? existing.color,
      icon: icon !== undefined ? icon : existing.icon,
      order: order ?? existing.order,
    },
  });

  return NextResponse.json(community);
}

// DELETE - Archive community (or delete if no posts)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check ownership and if it's the default
  const existing = await db.community.findUnique({
    where: { id, creatorId: session.user.id },
    include: {
      _count: { select: { posts: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  if (existing.isDefault) {
    return NextResponse.json(
      { error: "Cannot delete the default community" },
      { status: 400 }
    );
  }

  // If no posts, delete completely. Otherwise archive.
  if (existing._count.posts === 0) {
    await db.community.delete({ where: { id } });
  } else {
    await db.community.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  return NextResponse.json({ success: true });
}
