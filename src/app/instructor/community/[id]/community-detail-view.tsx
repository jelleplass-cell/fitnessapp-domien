"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ArrowLeft,
  Users,
  FileText,
  Settings,
  Crown,
  Pencil,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { CommunityFeed } from "@/app/client/community/community-feed";

interface Author {
  id: string;
  name: string | null;
  role: string;
}

interface PostLike {
  id: string;
  userId: string;
}

interface CommentLike {
  id: string;
  userId: string;
}

interface Comment {
  id: string;
  content: string;
  gifUrl: string | null;
  createdAt: string;
  author: Author;
  likes: CommentLike[];
  _count: { likes: number };
  parentId: string | null;
  replies?: Comment[];
}

interface LinkedEvent {
  id: string;
  title: string;
  startDate: string;
  location: string | null;
  maxAttendees: number | null;
  _count: { registrations: number };
}

interface Post {
  id: string;
  title: string | null;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  isPinned: boolean;
  createdAt: string;
  author: Author;
  likes: PostLike[];
  comments: Comment[];
  _count: { comments: number; likes: number };
  event: LinkedEvent | null;
}

interface Member {
  id: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  isDefault: boolean;
  clientsCanPost: boolean;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  _count: {
    posts: number;
    members: number;
  };
}

interface Client {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface CommunityDetailViewProps {
  community: Community;
  posts: Post[];
  clients: Client[];
  currentUserId: string;
}

const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

export function CommunityDetailView({
  community,
  posts,
  clients,
  currentUserId,
}: CommunityDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("posts");
  const [members, setMembers] = useState(community.members);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: community.name,
    description: community.description || "",
    color: community.color,
    clientsCanPost: community.clientsCanPost,
  });

  const availableClients = clients.filter(
    (c) => !members.some((m) => m.userId === c.id)
  );

  const handleUpdateCommunity = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/communities/${community.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setShowEditDialog(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCommunity = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/communities/${community.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/instructor/community/beheer");
      } else {
        const data = await res.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedClients.length === 0) return;

    setAddingMembers(true);
    try {
      const res = await fetch(`/api/communities/${community.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedClients }),
      });

      if (res.ok) {
        // Refresh to get updated members
        const membersRes = await fetch(`/api/communities/${community.id}`);
        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data.members);
        }
        setSelectedClients([]);
        setShowAddMembersDialog(false);
        router.refresh();
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const res = await fetch(
        `/api/communities/${community.id}/members?userId=${userId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
        router.refresh();
      }
    } catch {
      alert("Er ging iets mis");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/instructor/community/beheer"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Terug naar overzicht
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: community.color }}
            >
              {community.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold">
                  {community.name}
                </h1>
                {community.isDefault && (
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Standaard
                  </Badge>
                )}
              </div>
              {community.description && (
                <p className="text-sm text-gray-500">{community.description}</p>
              )}
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {community.isDefault
                    ? "Alle klanten"
                    : `${members.length} leden`}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {posts.length} posts
                </span>
                {community.clientsCanPost && (
                  <Badge variant="outline" className="text-xs">
                    Klanten kunnen posten
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Bewerken
            </Button>
            {!community.isDefault && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Community verwijderen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {posts.length > 0
                        ? `Deze community heeft ${posts.length} posts. De community wordt gearchiveerd.`
                        : "Deze community wordt permanent verwijderd."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCommunity}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Verwijderen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="posts">
            <FileText className="w-4 h-4 mr-1" />
            Berichten
          </TabsTrigger>
          {!community.isDefault && (
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-1" />
              Leden ({members.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts">
          <CommunityFeed
            initialPosts={posts}
            currentUserId={currentUserId}
            canCreatePosts={true}
            communities={[
              {
                id: community.id,
                name: community.name,
                color: community.color,
                isDefault: community.isDefault,
              },
            ]}
          />
        </TabsContent>

        {!community.isDefault && (
          <TabsContent value="members">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Leden</CardTitle>
                <Button onClick={() => setShowAddMembersDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-1" />
                  Leden toevoegen
                </Button>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nog geen leden toegevoegd aan deze community
                  </p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                            {member.user.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.user.name || "Onbekend"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Community bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Naam *</label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Beschrijving</label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Kleur</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      editForm.color === color
                        ? "border-gray-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditForm({ ...editForm, color })}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium">
                  Klanten kunnen posten
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Klanten kunnen ook berichten plaatsen
                </p>
              </div>
              <Switch
                checked={editForm.clientsCanPost}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, clientsCanPost: checked })
                }
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUpdateCommunity}
                disabled={submitting || !editForm.name.trim()}
              >
                {submitting ? "Opslaan..." : "Opslaan"}
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog open={showAddMembersDialog} onOpenChange={setShowAddMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leden toevoegen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {availableClients.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Alle klanten zijn al lid van deze community
              </p>
            ) : (
              <>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {availableClients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <Checkbox
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedClients([...selectedClients, client.id]);
                          } else {
                            setSelectedClients(
                              selectedClients.filter((id) => id !== client.id)
                            );
                          }
                        }}
                      />
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                        {client.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {client.name || "Onbekend"}
                        </p>
                        <p className="text-xs text-gray-500">{client.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedClients.length > 0 && (
                  <Button
                    className="mt-4 w-full"
                    onClick={handleAddMembers}
                    disabled={addingMembers}
                  >
                    {addingMembers
                      ? "Toevoegen..."
                      : `${selectedClients.length} klant(en) toevoegen`}
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
