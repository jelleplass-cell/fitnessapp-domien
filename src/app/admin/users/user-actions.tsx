"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, UserCog } from "lucide-react";

interface UserActionsProps {
  userId: string;
  userName: string;
  userRole: string;
  currentUserId: string;
}

export function UserActions({ userId, userName, userRole, currentUserId }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (userId === currentUserId) {
      alert("Je kunt je eigen account niet verwijderen");
      return;
    }

    if (!confirm(`Weet je zeker dat je ${userName} wilt verwijderen?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Er is een fout opgetreden");
      }
    } catch {
      alert("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (userId === currentUserId) {
      alert("Je kunt je eigen rol niet wijzigen");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Er is een fout opgetreden");
      }
    } catch {
      alert("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleChangeRole("CLIENT")}
          disabled={userRole === "CLIENT" || userId === currentUserId}
        >
          <UserCog className="w-4 h-4 mr-2" />
          Maak klant
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleChangeRole("INSTRUCTOR")}
          disabled={userRole === "INSTRUCTOR" || userId === currentUserId}
        >
          <UserCog className="w-4 h-4 mr-2" />
          Maak instructeur
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleChangeRole("SUPER_ADMIN")}
          disabled={userRole === "SUPER_ADMIN" || userId === currentUserId}
        >
          <UserCog className="w-4 h-4 mr-2" />
          Maak admin
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={userId === currentUserId}
          className="text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Verwijderen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
