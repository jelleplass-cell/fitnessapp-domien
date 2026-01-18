"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Crown, ChevronRight, Plus } from "lucide-react";

interface Community {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  isDefault: boolean;
  clientsCanPost: boolean;
  order: number;
  _count: {
    members: number;
    posts: number;
  };
}

interface CommunityManagementProps {
  initialCommunities: Community[];
}

export function CommunityManagement({
  initialCommunities,
}: CommunityManagementProps) {
  return (
    <div className="space-y-6">
      {/* Create Community Button */}
      <div className="flex justify-end">
        <Link href="/instructor/community/nieuw">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe community
          </Button>
        </Link>
      </div>

      {/* Communities List */}
      {initialCommunities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">
              Je hebt nog geen communities. Maak je eerste community aan om te beginnen.
            </p>
            <Link href="/instructor/community/nieuw">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Eerste community aanmaken
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {initialCommunities.map((community) => (
            <Link
              key={community.id}
              href={`/instructor/community/${community.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: community.color }}
                      >
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{community.name}</h3>
                          {community.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Standaard
                            </Badge>
                          )}
                          {community.clientsCanPost && (
                            <Badge variant="outline" className="text-xs">
                              Klanten kunnen posten
                            </Badge>
                          )}
                        </div>
                        {community.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {community.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {community.isDefault
                              ? "Alle klanten"
                              : `${community._count.members} leden`}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {community._count.posts} posts
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
