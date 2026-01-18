import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Get all members of a community
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check ownership
  const community = await db.community.findUnique({
    where: { id, creatorId: session.user.id },
  });

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const members = await db.communityMember.findMany({
    where: { communityId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          phone: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(members);
}

// POST - Add member(s) to community
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userIds } = body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json(
      { error: "userIds array is required" },
      { status: 400 }
    );
  }

  // Check ownership
  const community = await db.community.findUnique({
    where: { id, creatorId: session.user.id },
  });

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  if (community.isDefault) {
    return NextResponse.json(
      { error: "Cannot manually add members to the default community" },
      { status: 400 }
    );
  }

  // Verify all users are clients of this instructor
  const validClients = await db.user.findMany({
    where: {
      id: { in: userIds },
      role: "CLIENT",
      instructorId: session.user.id,
    },
    select: { id: true },
  });

  const validIds = validClients.map((c) => c.id);

  // Add members (skip if already member)
  const results = await Promise.all(
    validIds.map(async (userId) => {
      try {
        return await db.communityMember.upsert({
          where: {
            communityId_userId: {
              communityId: id,
              userId,
            },
          },
          create: {
            communityId: id,
            userId,
          },
          update: {}, // No update needed
        });
      } catch {
        return null;
      }
    })
  );

  const added = results.filter(Boolean).length;

  return NextResponse.json({ success: true, added });
}

// DELETE - Remove member from community
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  // Check ownership
  const community = await db.community.findUnique({
    where: { id, creatorId: session.user.id },
  });

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  // Remove member
  await db.communityMember.deleteMany({
    where: {
      communityId: id,
      userId,
    },
  });

  return NextResponse.json({ success: true });
}
