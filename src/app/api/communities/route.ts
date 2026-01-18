import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - List all communities for instructor, or accessible communities for client
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "INSTRUCTOR") {
    // Instructor sees all their communities
    const communities = await db.community.findMany({
      where: {
        creatorId: session.user.id,
        isArchived: false,
      },
      include: {
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { order: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(communities);
  } else if (session.user.role === "CLIENT") {
    // Client sees communities they have access to
    // First get default community from their instructor
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { instructorId: true },
    });

    if (!user?.instructorId) {
      return NextResponse.json([]);
    }

    // Get default community + communities they're member of
    const [defaultCommunity, memberships] = await Promise.all([
      db.community.findFirst({
        where: {
          creatorId: user.instructorId,
          isDefault: true,
          isArchived: false,
        },
      }),
      db.communityMember.findMany({
        where: { userId: session.user.id },
        include: {
          community: {
            include: {
              _count: {
                select: { posts: true },
              },
            },
          },
        },
      }),
    ]);

    const communities = [];

    // Add default community (everyone has access)
    if (defaultCommunity) {
      const postCount = await db.communityPost.count({
        where: {
          OR: [
            { communityId: defaultCommunity.id },
            { communityId: null, authorId: user.instructorId }, // Legacy posts
          ],
        },
      });
      communities.push({
        ...defaultCommunity,
        _count: { posts: postCount, members: 0 },
      });
    }

    // Add communities they're member of (excluding default if somehow member of it)
    memberships.forEach((m) => {
      if (!m.community.isDefault && !m.community.isArchived) {
        communities.push({
          ...m.community,
        });
      }
    });

    // Sort by order
    communities.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.order - b.order;
    });

    return NextResponse.json(communities);
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}

// POST - Create a new community (instructor only)
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, color, icon } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Check if instructor already has a default community
  const existingDefault = await db.community.findFirst({
    where: {
      creatorId: session.user.id,
      isDefault: true,
    },
  });

  // Get max order for new community
  const maxOrder = await db.community.aggregate({
    where: { creatorId: session.user.id },
    _max: { order: true },
  });

  const community = await db.community.create({
    data: {
      name,
      description,
      color: color || "#3B82F6",
      icon,
      isDefault: !existingDefault, // First community becomes default
      order: (maxOrder._max.order ?? -1) + 1,
      creatorId: session.user.id,
    },
  });

  return NextResponse.json(community);
}
