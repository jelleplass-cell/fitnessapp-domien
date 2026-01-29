"use client";

import { useRouter } from "next/navigation";

interface Community {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

interface CommunitySelectorProps {
  communities: Community[];
  currentCommunityId?: string;
}

export function CommunitySelector({
  communities,
  currentCommunityId,
}: CommunitySelectorProps) {
  const router = useRouter();

  const handleChange = (communityId: string) => {
    const community = communities.find((c) => c.id === communityId);
    if (community?.isDefault) {
      router.push("/client/community");
    } else {
      router.push(`/client/community?community=${communityId}`);
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {communities.map((community) => (
        <button
          key={community.id}
          onClick={() => handleChange(community.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            currentCommunityId === community.id
              ? "bg-blue-500 text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              currentCommunityId === community.id ? "bg-white/60" : ""
            }`}
            style={currentCommunityId !== community.id ? { backgroundColor: community.color } : undefined}
          />
          {community.name}
        </button>
      ))}
    </div>
  );
}
