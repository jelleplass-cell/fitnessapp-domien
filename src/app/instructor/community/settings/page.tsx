import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Star } from "lucide-react";
import { CreateCommunityModal } from "./create-community-modal";
import { CommunityCard } from "./community-card";

export default async function CommunitySettingsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  // Get all communities
  const communities = await db.community.findMany({
    where: {
      creatorId: session.user.id,
      isArchived: false,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          posts: true,
          members: true,
        },
      },
    },
    orderBy: [{ isDefault: "desc" }, { order: "asc" }],
  });

  // Get all clients for adding to communities
  const clients = await db.user.findMany({
    where: {
      role: "CLIENT",
      instructorId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  // If no default community exists, create one
  if (!communities.find((c) => c.isDefault)) {
    await db.community.create({
      data: {
        name: "Algemeen",
        description: "De algemene community voor alle klanten",
        isDefault: true,
        creatorId: session.user.id,
      },
    });
    redirect("/instructor/community/settings");
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Community Beheer</h1>
          <p className="text-sm text-gray-500">
            Beheer je communities en bepaal welke klanten toegang hebben
          </p>
        </div>
        <CreateCommunityModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{communities.length}</p>
                <p className="text-xs text-gray-500">Communities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-xs text-gray-500">Klanten</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {communities.filter((c) => !c.isDefault).length}
                </p>
                <p className="text-xs text-gray-500">Exclusieve</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communities list */}
      <div className="space-y-4">
        {communities.map((community) => (
          <CommunityCard
            key={community.id}
            community={{
              id: community.id,
              name: community.name,
              description: community.description,
              color: community.color,
              isDefault: community.isDefault,
              _count: community._count,
              members: community.members.map((m) => ({
                id: m.id,
                userId: m.user.id,
                userName: m.user.name,
                userEmail: m.user.email,
              })),
            }}
            allClients={clients}
          />
        ))}
      </div>

      {communities.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-700 mb-2">Geen communities</h3>
            <p className="text-sm text-gray-500">
              Maak je eerste community om te beginnen
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
