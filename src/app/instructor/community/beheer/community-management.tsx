"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, FileText, Crown, ChevronRight, Plus, MessageSquare } from "lucide-react";

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
          <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe community
          </Button>
        </Link>
      </div>

      {/* Communities List */}
      {initialCommunities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 mb-4">
            Je hebt nog geen communities. Maak je eerste community aan om te beginnen.
          </p>
          <Link href="/instructor/community/nieuw">
            <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Eerste community aanmaken
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {initialCommunities.map((community) => (
            <Link
              key={community.id}
              href={`/instructor/community/${community.id}`}
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: community.color }}
                    >
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{community.name}</h3>
                        {community.isDefault && (
                          <span className="text-[11px] font-medium bg-[#FFF8E8] text-[#9B7A3F] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Standaard
                          </span>
                        )}
                        {community.clientsCanPost && (
                          <span className="text-[11px] font-medium bg-[#E8F5F0] text-[#2D7A5F] px-2 py-0.5 rounded-full">
                            Klanten kunnen posten
                          </span>
                        )}
                      </div>
                      {community.description && (
                        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                          {community.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {community.isDefault
                            ? "Alle klanten"
                            : `${community._count.members} leden`}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {community._count.posts} posts
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
