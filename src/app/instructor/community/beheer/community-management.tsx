"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Users,
  FileText,
  Pencil,
  Trash2,
  UserPlus,
  X,
  Crown,
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  isDefault: boolean;
  order: number;
  _count: {
    members: number;
    posts: number;
  };
}

interface Client {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface Member {
  id: string;
  userId: string;
  joinedAt: string;
  user: Client;
}

interface CommunityManagementProps {
  initialCommunities: Community[];
  clients: Client[];
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

export function CommunityManagement({
  initialCommunities,
  clients,
}: CommunityManagementProps) {
  const router = useRouter();
  const [communities, setCommunities] = useState(initialCommunities);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [managingMembers, setManagingMembers] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: PRESET_COLORS[0],
  });

  // Member management state
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: PRESET_COLORS[0],
    });
  };

  const handleCreateCommunity = async () => {
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowCreateDialog(false);
        resetForm();
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

  const handleUpdateCommunity = async () => {
    if (!editingCommunity || !formData.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/communities/${editingCommunity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setEditingCommunity(null);
        resetForm();
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

  const handleDeleteCommunity = async (communityId: string) => {
    setDeleting(communityId);
    try {
      const res = await fetch(`/api/communities/${communityId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (community: Community) => {
    setFormData({
      name: community.name,
      description: community.description || "",
      color: community.color,
    });
    setEditingCommunity(community);
  };

  const openMembersDialog = async (community: Community) => {
    setManagingMembers(community);
    setLoadingMembers(true);
    setSelectedClients([]);

    try {
      const res = await fetch(`/api/communities/${community.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      console.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMembers = async () => {
    if (!managingMembers || selectedClients.length === 0) return;

    setAddingMembers(true);
    try {
      const res = await fetch(`/api/communities/${managingMembers.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedClients }),
      });

      if (res.ok) {
        // Refresh members list
        const membersRes = await fetch(`/api/communities/${managingMembers.id}/members`);
        if (membersRes.ok) {
          setMembers(await membersRes.json());
        }
        setSelectedClients([]);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!managingMembers) return;

    try {
      const res = await fetch(
        `/api/communities/${managingMembers.id}/members?userId=${userId}`,
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

  // Get clients not already in the community
  const availableClients = managingMembers
    ? clients.filter((c) => !members.some((m) => m.userId === c.id))
    : clients;

  return (
    <div className="space-y-6">
      {/* Create Community Button */}
      <div className="flex justify-end">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe community
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe community aanmaken</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Naam *</label>
                <Input
                  placeholder="Bijv. Premium Members"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Beschrijving</label>
                <Textarea
                  placeholder="Optionele beschrijving..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
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
                        formData.color === color
                          ? "border-gray-900 scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateCommunity}
                  disabled={submitting || !formData.name.trim()}
                >
                  {submitting ? "Aanmaken..." : "Aanmaken"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Annuleren
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Communities List */}
      {communities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              Je hebt nog geen communities. Maak je eerste community aan om te beginnen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {communities.map((community) => (
            <Card key={community.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: community.color }}
                    >
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{community.name}</h3>
                        {community.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Standaard
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
                  <div className="flex items-center gap-2">
                    {!community.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMembersDialog(community)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Leden
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(community)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {!community.isDefault && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            disabled={deleting === community.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Community verwijderen?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {community._count.posts > 0
                                ? `Deze community heeft ${community._count.posts} posts. De community wordt gearchiveerd en is niet meer zichtbaar.`
                                : "Deze community wordt permanent verwijderd."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCommunity(community.id)}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingCommunity}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCommunity(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Community bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Naam *</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Beschrijving</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
                      formData.color === color
                        ? "border-gray-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUpdateCommunity}
                disabled={submitting || !formData.name.trim()}
              >
                {submitting ? "Opslaan..." : "Opslaan"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCommunity(null);
                  resetForm();
                }}
              >
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members Management Dialog */}
      <Dialog
        open={!!managingMembers}
        onOpenChange={(open) => {
          if (!open) {
            setManagingMembers(null);
            setMembers([]);
            setSelectedClients([]);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Leden van {managingMembers?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingMembers ? (
              <p className="text-center text-gray-500">Laden...</p>
            ) : (
              <>
                {/* Current Members */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Huidige leden ({members.length})
                  </h4>
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Nog geen leden toegevoegd
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                              {member.user.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {member.user.name || "Onbekend"}
                              </p>
                              <p className="text-xs text-gray-500">
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
                </div>

                {/* Add Members */}
                {availableClients.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Leden toevoegen
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                      {availableClients.map((client) => (
                        <label
                          key={client.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
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
                        className="mt-2 w-full"
                        onClick={handleAddMembers}
                        disabled={addingMembers}
                      >
                        {addingMembers
                          ? "Toevoegen..."
                          : `${selectedClients.length} klant(en) toevoegen`}
                      </Button>
                    )}
                  </div>
                )}

                {availableClients.length === 0 && members.length > 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Alle klanten zijn al lid van deze community
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
