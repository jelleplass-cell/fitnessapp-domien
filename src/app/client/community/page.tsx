import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CommunityFeed } from "./community-feed";
import { CommunitySelector } from "./community-selector";

interface PageProps {
  searchParams: Promise<{ community?: string }>;
}

export default async function CommunityPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const { community: selectedCommunityId } = await searchParams;

  // Get the user's instructor
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { instructorId: true },
  });

  if (!user?.instructorId) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <p className="text-gray-500">Je bent niet gekoppeld aan een instructeur.</p>
      </div>
    );
  }

  // Get communities this client has access to
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
        community: true,
      },
    }),
  ]);

  // Build list of accessible communities
  const accessibleCommunities: Array<{
    id: string;
    name: string;
    color: string;
    isDefault: boolean;
  }> = [];

  if (defaultCommunity) {
    accessibleCommunities.push({
      id: defaultCommunity.id,
      name: defaultCommunity.name,
      color: defaultCommunity.color,
      isDefault: true,
    });
  }

  memberships.forEach((m) => {
    if (!m.community.isDefault && !m.community.isArchived) {
      accessibleCommunities.push({
        id: m.community.id,
        name: m.community.name,
        color: m.community.color,
        isDefault: false,
      });
    }
  });

  // Determine which community to show
  let currentCommunity = accessibleCommunities.find((c) => c.id === selectedCommunityId);
  if (!currentCommunity) {
    // Default to the first community (usually the default one)
    currentCommunity = accessibleCommunities[0];
  }

  const now = new Date();

  // Build the where clause for posts based on selected community
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let postsWhereClause: any = {
    isPublished: true,
    OR: [
      { publishAt: null },
      { publishAt: { lte: now } },
    ],
  };

  // Filter by community if selected
  if (currentCommunity) {
    if (currentCommunity.isDefault) {
      // For default community, show posts with this communityId OR null (legacy posts from instructor)
      postsWhereClause = {
        isPublished: true,
        AND: [
          {
            OR: [
              { publishAt: null },
              { publishAt: { lte: now } },
            ],
          },
          {
            OR: [
              { communityId: currentCommunity.id },
              { communityId: null, authorId: user.instructorId },
            ],
          },
        ],
      };
    } else {
      // For non-default community, only show posts for this community
      postsWhereClause = {
        isPublished: true,
        communityId: currentCommunity.id,
        OR: [
          { publishAt: null },
          { publishAt: { lte: now } },
        ],
      };
    }
  }

  const posts = await db.communityPost.findMany({
    where: postsWhereClause,
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
    take: 50,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      likes: {
        select: {
          id: true,
          userId: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          likes: {
            select: {
              id: true,
              userId: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
              likes: {
                select: {
                  id: true,
                  userId: true,
                },
              },
              _count: {
                select: { likes: true },
              },
            },
          },
          _count: {
            select: { likes: true },
          },
        },
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { comments: true, likes: true },
      },
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
          maxAttendees: true,
          _count: {
            select: { registrations: true },
          },
        },
      },
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold">
                {currentCommunity?.name || "Community"}
              </h1>
              {currentCommunity && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentCommunity.color }}
                />
              )}
            </div>
            <p className="text-sm text-gray-500">
              {currentCommunity?.isDefault
                ? "Blijf op de hoogte van updates van je instructeur"
                : "Exclusieve content voor deze community"}
            </p>
          </div>
          {accessibleCommunities.length > 1 && (
            <CommunitySelector
              communities={accessibleCommunities}
              currentCommunityId={currentCommunity?.id}
            />
          )}
        </div>
      </div>

      <CommunityFeed
        initialPosts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          imageUrl: p.imageUrl,
          videoUrl: p.videoUrl,
          isPinned: p.isPinned,
          createdAt: p.createdAt.toISOString(),
          author: p.author,
          likes: p.likes,
          comments: p.comments.map((c) => ({
            id: c.id,
            content: c.content,
            gifUrl: c.gifUrl,
            attachmentUrl: c.attachmentUrl,
            attachmentName: c.attachmentName,
            attachmentType: c.attachmentType,
            videoUrl: c.videoUrl,
            linkUrl: c.linkUrl,
            createdAt: c.createdAt.toISOString(),
            author: c.author,
            likes: c.likes,
            _count: c._count,
            parentId: c.parentId,
            replies: c.replies?.map((r) => ({
              id: r.id,
              content: r.content,
              gifUrl: r.gifUrl,
              attachmentUrl: r.attachmentUrl,
              attachmentName: r.attachmentName,
              attachmentType: r.attachmentType,
              videoUrl: r.videoUrl,
              linkUrl: r.linkUrl,
              createdAt: r.createdAt.toISOString(),
              author: r.author,
              likes: r.likes,
              _count: r._count,
              parentId: r.parentId,
            })),
          })),
          _count: p._count,
          event: p.event ? {
            id: p.event.id,
            title: p.event.title,
            startDate: p.event.startDate.toISOString(),
            location: p.event.location,
            maxAttendees: p.event.maxAttendees,
            _count: p.event._count,
          } : null,
        }))}
        currentUserId={session.user.id}
        canCreatePosts={false}
      />
    </div>
  );
}
