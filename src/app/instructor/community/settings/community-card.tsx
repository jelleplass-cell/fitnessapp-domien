"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Users,
  MessageSquare,
  Trash2,
  UserPlus,
  X,
  Crown,
  Search,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
}

interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    isDefault: boolean;
    _count: {
      posts: number;
      members: number;
    };
    members: Member[];
  };
  allClients: {
    id: string;
    name: string;
    email: string;
  }[];
}

export function CommunityCard({ community, allClients }: CommunityCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter clients not already members
  const memberIds = community.members.map((m) => m.userId);
  const availableClients = allClients.filter((c) => !memberIds.includes(c.id));
  const filteredClients = availableClients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/communities/${community.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [userId] }),
      });

      if (response.ok) {
        router.refresh();
        setAddMemberOpen(false);
        setSearchQuery("");
      }
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/communities/${community.id}/members?userId=${userId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error removing member:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/communities/${community.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Kon community niet verwijderen");
      }
    } catch (error) {
      console.error("Error deleting community:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: community.color }}
            />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {community.name}
                {community.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Standaard
                  </Badge>
                )}
              </CardTitle>
              {community.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {community.description}
                </p>
              )}
            </div>
          </div>

          {!community.isDefault && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Community verwijderen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Weet je zeker dat je &quot;{community.name}&quot; wilt
                    verwijderen? {community._count.posts > 0 && (
                      <>De {community._count.posts} posts worden ook verwijderd.</>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteCommunity}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Verwijderen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {community._count.posts} posts
          </span>
          {!community.isDefault && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {community.members.length} leden
            </span>
          )}
        </div>
      </CardHeader>

      {!community.isDefault && (
        <CardContent className="pt-0">
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Leden</h4>

              <Popover open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Lid toevoegen
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="end">
                  <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        placeholder="Zoek klant..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <CommandList>
                      <CommandEmpty>Geen klanten gevonden.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {filteredClients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.id}
                            onSelect={() => handleAddMember(client.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span>{client.name}</span>
                              <span className="text-xs text-gray-500">
                                {client.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {community.members.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nog geen leden. Voeg klanten toe om ze toegang te geven.
              </p>
            ) : (
              <div className="space-y-2">
                {community.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{member.userName}</p>
                      <p className="text-xs text-gray-500">{member.userEmail}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={loading}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}

      {community.isDefault && (
        <CardContent className="pt-0">
          <p className="text-sm text-gray-500 border-t pt-4">
            Alle klanten hebben automatisch toegang tot deze community.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
