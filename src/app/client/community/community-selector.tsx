"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Select value={currentCommunityId} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Selecteer community" />
      </SelectTrigger>
      <SelectContent>
        {communities.map((community) => (
          <SelectItem key={community.id} value={community.id}>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: community.color }}
              />
              {community.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
