"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { User, KeyRound, Trash2, Copy, Check, Users } from "lucide-react";

interface ClientData {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  dateOfBirth: string | null;
  notes: string | null;
}

interface Community {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

interface CommunityMembership {
  communityId: string;
}

interface ClientProfileModalProps {
  client: ClientData;
  communities?: Community[];
  clientMemberships?: CommunityMembership[];
}

export function ClientProfileModal({ client, communities = [], clientMemberships = [] }: ClientProfileModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Track community memberships (only non-default communities)
  const exclusiveCommunities = communities.filter((c) => !c.isDefault);
  const initialMembershipIds = clientMemberships.map((m) => m.communityId);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>(initialMembershipIds);

  const [formData, setFormData] = useState({
    name: client.name || "",
    firstName: client.firstName || "",
    lastName: client.lastName || "",
    email: client.email || "",
    phone: client.phone || "",
    street: client.street || "",
    houseNumber: client.houseNumber || "",
    postalCode: client.postalCode || "",
    city: client.city || "",
    country: client.country || "Nederland",
    dateOfBirth: client.dateOfBirth
      ? new Date(client.dateOfBirth).toISOString().split("T")[0]
      : "",
    notes: client.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update client profile
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Er is iets misgegaan");
        return;
      }

      // Update community memberships
      if (exclusiveCommunities.length > 0) {
        // Determine which communities to add and remove
        const toAdd = selectedCommunities.filter((id) => !initialMembershipIds.includes(id));
        const toRemove = initialMembershipIds.filter((id) => !selectedCommunities.includes(id));

        // Add new memberships
        for (const communityId of toAdd) {
          await fetch(`/api/communities/${communityId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: [client.id] }),
          });
        }

        // Remove memberships
        for (const communityId of toRemove) {
          await fetch(`/api/communities/${communityId}/members?userId=${client.id}`, {
            method: "DELETE",
          });
        }
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating client:", error);
      alert("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityToggle = (communityId: string, checked: boolean) => {
    if (checked) {
      setSelectedCommunities((prev) => [...prev, communityId]);
    } else {
      setSelectedCommunities((prev) => prev.filter((id) => id !== communityId));
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password" }),
      });

      if (!response.ok) {
        alert("Er is iets misgegaan bij het resetten van het wachtwoord");
        return;
      }

      const data = await response.json();
      setNewPassword(data.newPassword);
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Er is iets misgegaan bij het verwijderen");
        return;
      }

      router.push("/instructor/clients");
      router.refresh();
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <User className="w-4 h-4 mr-2" />
          Profiel beheren
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Klant profiel</DialogTitle>
          <DialogDescription>
            Beheer de gegevens van {client.name}
          </DialogDescription>
        </DialogHeader>

        {newPassword ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-2">
                Nieuw wachtwoord gegenereerd
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white rounded border font-mono text-sm">
                  {newPassword}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPassword}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Kopieer dit wachtwoord en deel het met de klant. Het wordt niet
                meer getoond.
              </p>
            </div>
            <Button onClick={() => setNewPassword(null)} className="w-full">
              Terug naar profiel
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                Persoonlijke gegevens
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Voornaam</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Voornaam"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Achternaam</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Achternaam"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Weergavenaam *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Naam zoals weergegeven in de app"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Geboortedatum</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                Contactgegevens
              </h3>
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@voorbeeld.nl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefoonnummer</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+31 6 12345678"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Adres</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="street">Straat</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) =>
                      setFormData({ ...formData, street: e.target.value })
                    }
                    placeholder="Straatnaam"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="houseNumber">Huisnr.</Label>
                  <Input
                    id="houseNumber"
                    value={formData.houseNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, houseNumber: e.target.value })
                    }
                    placeholder="12a"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postcode</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    placeholder="1234 AB"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="city">Plaats</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Amsterdam"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Land</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  placeholder="Nederland"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Interne notities over deze klant (alleen zichtbaar voor jou)"
                rows={3}
              />
            </div>

            {/* Community Access */}
            {exclusiveCommunities.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">
                    Community toegang
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Selecteer welke exclusieve communities deze klant toegang toe heeft.
                  De standaard community is altijd toegankelijk.
                </p>
                <div className="space-y-3">
                  {exclusiveCommunities.map((community) => (
                    <div
                      key={community.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`community-${community.id}`}
                        checked={selectedCommunities.includes(community.id)}
                        onCheckedChange={(checked) =>
                          handleCommunityToggle(community.id, checked === true)
                        }
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: community.color }}
                        />
                        <Label
                          htmlFor={`community-${community.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {community.name}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2 w-full sm:w-auto">
                {/* Reset Password */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <KeyRound className="w-4 h-4 mr-2" />
                      Reset wachtwoord
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Wachtwoord resetten?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Er wordt een nieuw wachtwoord gegenereerd voor{" "}
                        {client.name}. Het huidige wachtwoord werkt daarna niet
                        meer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetPassword}
                        disabled={loading}
                      >
                        Reset wachtwoord
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Delete Client */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Verwijderen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Klant verwijderen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Weet je zeker dat je {client.name} wilt verwijderen? Dit
                        verwijdert ook alle trainingsgeschiedenis,
                        programma&apos;s en andere gegevens van deze klant. Dit
                        kan niet ongedaan worden gemaakt.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Verwijderen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Opslaan..." : "Opslaan"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
