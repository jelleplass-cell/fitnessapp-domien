"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  MessageSquare,
  Dumbbell,
  Laptop,
  BookOpen,
  Calendar,
  Video,
  MapPin,
} from "lucide-react";

const eventTypeOptions = [
  { value: "TRAINING", label: "Training", icon: Dumbbell, description: "Fysieke training (sportschool, buiten, etc.)" },
  { value: "ONLINE", label: "Online sessie", icon: Laptop, description: "Online coaching call, webinar, etc." },
  { value: "WORKSHOP", label: "Workshop", icon: BookOpen, description: "Hands-on workshop of cursus" },
  { value: "OTHER", label: "Overig", icon: Calendar, description: "Ander type event" },
];

const meetingPlatformOptions = [
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "meet", label: "Google Meet" },
  { value: "other", label: "Anders" },
];

const difficultyOptions = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Gemiddeld" },
  { value: "ADVANCED", label: "Gevorderd" },
];

export function CreateEventForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "TRAINING",
    date: "",
    time: "",
    endTime: "",
    location: "",
    locationDetails: "",
    meetingUrl: "",
    meetingPlatform: "",
    imageUrl: "",
    videoUrl: "",
    equipment: "",
    difficulty: "",
    maxAttendees: "",
    requiresRegistration: true,
    registrationDeadlineHours: "6",
    allowWaitlist: true,
  });
  const [createCommunityPost, setCreateCommunityPost] = useState(true);

  const isOnlineEvent = formData.eventType === "ONLINE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time) {
      alert("Titel, datum en tijd zijn verplicht");
      return;
    }

    if (isOnlineEvent && !formData.meetingUrl) {
      alert("Meeting URL is verplicht voor online events");
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = formData.endTime
        ? new Date(`${formData.date}T${formData.endTime}`)
        : null;

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          eventType: formData.eventType,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime?.toISOString() || undefined,
          location: isOnlineEvent ? "Online" : formData.location || undefined,
          locationDetails: !isOnlineEvent ? formData.locationDetails || undefined : undefined,
          meetingUrl: formData.meetingUrl || undefined,
          meetingPlatform: isOnlineEvent ? formData.meetingPlatform || undefined : undefined,
          imageUrl: formData.imageUrl || undefined,
          videoUrl: formData.videoUrl || undefined,
          equipment: formData.equipment || undefined,
          difficulty: formData.difficulty || undefined,
          maxAttendees: formData.maxAttendees
            ? parseInt(formData.maxAttendees)
            : undefined,
          requiresRegistration: formData.requiresRegistration,
          registrationDeadlineHours: parseInt(formData.registrationDeadlineHours) || 6,
          allowWaitlist: formData.allowWaitlist,
          createCommunityPost,
        }),
      });

      if (res.ok) {
        setFormData({
          title: "",
          description: "",
          eventType: "TRAINING",
          date: "",
          time: "",
          endTime: "",
          location: "",
          locationDetails: "",
          meetingUrl: "",
          meetingPlatform: "",
          imageUrl: "",
          videoUrl: "",
          equipment: "",
          difficulty: "",
          maxAttendees: "",
          requiresRegistration: true,
          registrationDeadlineHours: "6",
          allowWaitlist: true,
        });
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nieuw event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl">Nieuw event aanmaken</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type Selection */}
          <div className="space-y-2">
            <Label className="block">Type event *</Label>
            <div className="grid grid-cols-2 gap-3">
              {eventTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.eventType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, eventType: option.value })}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                    <div>
                      <p className={`font-medium text-sm ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={isOnlineEvent ? "bijv. Live Q&A: Voeding & Herstel" : "bijv. Groepstraining in het park"}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Wat kunnen deelnemers verwachten?"
              rows={4}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Starttijd *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Eindtijd</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          {/* Location (for non-online events) */}
          {!isOnlineEvent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Locatie
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="bijv. Sportcentrum Amsterdam"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationDetails">Locatie details (optioneel)</Label>
                <Textarea
                  id="locationDetails"
                  value={formData.locationDetails}
                  onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                  placeholder="bijv. Verzamelen bij de hoofdingang, parkeren gratis"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Online Meeting Details */}
          {isOnlineEvent && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2 text-blue-700 font-medium">
                <Video className="w-4 h-4" />
                Online meeting instellingen
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingPlatform">Platform</Label>
                <Select
                  value={formData.meetingPlatform}
                  onValueChange={(value) => setFormData({ ...formData, meetingPlatform: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingPlatformOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Meeting URL *</Label>
                <Input
                  id="meetingUrl"
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deelnemers zien deze link na aanmelding
                </p>
              </div>
            </div>
          )}

          {/* Training specific options */}
          {(formData.eventType === "TRAINING" || formData.eventType === "WORKSHOP") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Niveau</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment">Benodigdheden</Label>
                <Input
                  id="equipment"
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  placeholder="bijv. Yogamat, handdoek"
                />
              </div>
            </div>
          )}

          {/* Meeting URL for OTHER type */}
          {formData.eventType === "OTHER" && (
            <div className="space-y-2">
              <Label htmlFor="meetingUrlOther" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Meeting link (optioneel)
              </Label>
              <Input
                id="meetingUrlOther"
                value={formData.meetingUrl}
                onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                placeholder="https://zoom.us/j/... of andere link"
              />
            </div>
          )}

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Afbeelding URL (optioneel)</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500">
              Wordt getoond als header afbeelding bij het event
            </p>
          </div>

          {/* Video URL (for promo) */}
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Promo video URL (optioneel)</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Registration Settings */}
          <div className="space-y-4 p-4 bg-[#F8FAFC] rounded-xl">
            <h3 className="font-medium text-sm">Aanmeldinstellingen</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requiresRegistration" className="cursor-pointer">
                  Aanmelding vereist
                </Label>
                <p className="text-xs text-gray-500">
                  Uit = deelnemers kunnen alleen toevoegen aan agenda
                </p>
              </div>
              <Switch
                id="requiresRegistration"
                checked={formData.requiresRegistration}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresRegistration: checked })
                }
              />
            </div>

            {formData.requiresRegistration && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxAttendees">Max. deelnemers</Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      min="1"
                      value={formData.maxAttendees}
                      onChange={(e) =>
                        setFormData({ ...formData, maxAttendees: e.target.value })
                      }
                      placeholder="Onbeperkt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadlineHours">Aanmelddeadline</Label>
                    <Select
                      value={formData.registrationDeadlineHours}
                      onValueChange={(value) =>
                        setFormData({ ...formData, registrationDeadlineHours: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 uur voor start</SelectItem>
                        <SelectItem value="2">2 uur voor start</SelectItem>
                        <SelectItem value="6">6 uur voor start</SelectItem>
                        <SelectItem value="12">12 uur voor start</SelectItem>
                        <SelectItem value="24">1 dag voor start</SelectItem>
                        <SelectItem value="48">2 dagen voor start</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowWaitlist" className="cursor-pointer">
                      Wachtlijst toestaan
                    </Label>
                    <p className="text-xs text-gray-500">
                      Nieuwe aanmeldingen op wachtlijst als event vol is
                    </p>
                  </div>
                  <Switch
                    id="allowWaitlist"
                    checked={formData.allowWaitlist}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowWaitlist: checked })
                    }
                  />
                </div>
              </>
            )}
          </div>

          {/* Community Post Option */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Checkbox
              id="createCommunityPost"
              checked={createCommunityPost}
              onCheckedChange={(checked) => setCreateCommunityPost(checked === true)}
            />
            <div className="flex-1">
              <Label
                htmlFor="createCommunityPost"
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Aankondigen in community
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Maak automatisch een community post aan om dit event aan te kondigen
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-2">
            <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
              {loading ? "Aanmaken..." : "Event aanmaken"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Annuleren
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
