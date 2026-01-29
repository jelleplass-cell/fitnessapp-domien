"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface NewCommunityFormProps {
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

export function NewCommunityForm({ clients }: NewCommunityFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: PRESET_COLORS[0],
    clientsCanPost: false,
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      // Create the community
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Er ging iets mis");
        return;
      }

      const community = await res.json();

      // Add selected members if any
      if (selectedClients.length > 0) {
        await fetch(`/api/communities/${community.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: selectedClients }),
        });
      }

      router.push(`/instructor/community/${community.id}`);
    } catch {
      alert("Er ging iets mis");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/instructor/community/beheer"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Terug naar overzicht
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Naam *</label>
            <Input
              placeholder="Bijv. Mastermind, VIP, Premium"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Beschrijving</label>
            <Textarea
              placeholder="Optionele beschrijving van deze community..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-medium mb-2 block">Kleur</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? "border-gray-900 scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          {/* Clients Can Post */}
          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
            <div>
              <label className="text-sm font-medium">Klanten kunnen posten</label>
              <p className="text-xs text-gray-500 mt-0.5">
                Als dit aan staat, kunnen klanten ook berichten plaatsen in deze community
              </p>
            </div>
            <Switch
              checked={formData.clientsCanPost}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, clientsCanPost: checked })
              }
            />
          </div>

          {/* Select Members */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Klanten toevoegen ({selectedClients.length} geselecteerd)
            </label>
            {clients.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 bg-[#F8FAFC] rounded-xl">
                Je hebt nog geen klanten. Voeg eerst klanten toe via Klanten beheer.
              </p>
            ) : (
              <div className="border border-gray-100 rounded-xl max-h-64 overflow-y-auto">
                {clients.map((client) => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 p-3 hover:bg-[#F8FAFC] cursor-pointer border-b last:border-b-0"
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
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.name.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-xl"
            >
              {submitting ? "Aanmaken..." : "Community aanmaken"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/instructor/community/beheer")}
              className="rounded-xl"
            >
              Annuleren
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
