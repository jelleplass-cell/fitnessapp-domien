"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dumbbell, MessageSquare, Calendar, Loader2 } from "lucide-react";

interface ModuleTogglesProps {
  instructorId: string;
  initialModules: {
    fitnessEnabled: boolean;
    communityEnabled: boolean;
    eventsEnabled: boolean;
  };
}

export function ModuleToggles({
  instructorId,
  initialModules,
}: ModuleTogglesProps) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [saving, setSaving] = useState<string | null>(null);

  const handleToggle = async (
    module: "fitnessEnabled" | "communityEnabled" | "eventsEnabled",
    value: boolean
  ) => {
    setSaving(module);
    const newModules = { ...modules, [module]: value };
    setModules(newModules);

    try {
      const response = await fetch(`/api/admin/instructors/${instructorId}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newModules),
      });

      if (!response.ok) {
        // Revert on error
        setModules(modules);
        const data = await response.json();
        alert(data.error || "Er ging iets mis");
      } else {
        router.refresh();
      }
    } catch {
      setModules(modules);
      alert("Er ging iets mis");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fitness Module */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <Label className="text-base font-medium cursor-pointer">
              Fitness
            </Label>
            <p className="text-sm text-gray-500">
              Programma&apos;s, oefeningen en trainingen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving === "fitnessEnabled" && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
          <Switch
            checked={modules.fitnessEnabled}
            onCheckedChange={(checked) => handleToggle("fitnessEnabled", checked)}
            disabled={saving !== null}
          />
        </div>
      </div>

      {/* Community Module */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <Label className="text-base font-medium cursor-pointer">
              Community
            </Label>
            <p className="text-sm text-gray-500">
              Posts, berichten en interactie
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving === "communityEnabled" && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
          <Switch
            checked={modules.communityEnabled}
            onCheckedChange={(checked) => handleToggle("communityEnabled", checked)}
            disabled={saving !== null}
          />
        </div>
      </div>

      {/* Events Module */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <Label className="text-base font-medium cursor-pointer">
              Events
            </Label>
            <p className="text-sm text-gray-500">
              Evenementen aanmaken en beheren
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving === "eventsEnabled" && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
          <Switch
            checked={modules.eventsEnabled}
            onCheckedChange={(checked) => handleToggle("eventsEnabled", checked)}
            disabled={saving !== null}
          />
        </div>
      </div>
    </div>
  );
}
