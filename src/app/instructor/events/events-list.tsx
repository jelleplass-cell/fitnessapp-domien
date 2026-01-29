"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Dumbbell,
  Laptop,
  BookOpen,
  Video,
  Mail,
  Pencil,
} from "lucide-react";
import { DeleteEventButton } from "./delete-event-button";

interface EventRegistration {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface EventData {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  locationDetails: string | null;
  meetingUrl: string | null;
  meetingPlatform: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  equipment: string | null;
  difficulty: string | null;
  maxAttendees: number | null;
  registrationCount: number;
  registrations: EventRegistration[];
}

const eventTypeConfig: Record<string, { label: string; icon: typeof Dumbbell; color: string }> = {
  TRAINING: { label: "Training", icon: Dumbbell, color: "bg-blue-50 text-blue-700 border-blue-200" },
  ONLINE: { label: "Online", icon: Laptop, color: "bg-purple-50 text-purple-700 border-purple-200" },
  WORKSHOP: { label: "Workshop", icon: BookOpen, color: "bg-amber-50 text-amber-700 border-amber-200" },
  OTHER: { label: "Overig", icon: Calendar, color: "bg-gray-50 text-gray-700 border-gray-200" },
};

const eventTypeOptions = [
  { value: "TRAINING", label: "Training", icon: Dumbbell },
  { value: "ONLINE", label: "Online sessie", icon: Laptop },
  { value: "WORKSHOP", label: "Workshop", icon: BookOpen },
  { value: "OTHER", label: "Overig", icon: Calendar },
];

const difficultyOptions = [
  { value: "", label: "Geen" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Gemiddeld" },
  { value: "ADVANCED", label: "Gevorderd" },
];

const difficultyLabels: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Gemiddeld",
  ADVANCED: "Gevorderd",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateInputValue(dateStr: string) {
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

function toTimeInputValue(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function EventsList({
  upcomingEvents,
  pastEvents,
}: {
  upcomingEvents: EventData[];
  pastEvents: EventData[];
}) {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleClose = () => {
    setSelectedEvent(null);
    setIsEditing(false);
  };

  return (
    <>
      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Aankomende events ({upcomingEvents.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {upcomingEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isPast={false}
                  onClick={() => { setSelectedEvent(event); setIsEditing(false); }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Past events */}
      {pastEvents.length > 0 && (
        <section className={upcomingEvents.length > 0 ? "mt-8" : ""}>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Afgelopen events ({pastEvents.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pastEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isPast={true}
                  onClick={() => { setSelectedEvent(event); setIsEditing(false); }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Detail / Edit popup */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) handleClose(); }}>
        {selectedEvent && !isEditing && (
          <EventDetailView
            event={selectedEvent}
            onEdit={() => setIsEditing(true)}
            onClose={handleClose}
          />
        )}
        {selectedEvent && isEditing && (
          <EventEditView
            event={selectedEvent}
            onCancel={() => setIsEditing(false)}
            onSaved={handleClose}
          />
        )}
      </Dialog>
    </>
  );
}

/* ─── Detail View ─────────────────────────────────────── */

function EventDetailView({
  event,
  onEdit,
  onClose,
}: {
  event: EventData;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle className="text-xl">{event.title}</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <EventTypeBadge type={event.eventType} />
              {new Date(event.startDate) < new Date() && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                  Afgelopen
                </Badge>
              )}
              {event.difficulty && (
                <Badge variant="outline" className="text-xs">
                  {difficultyLabels[event.difficulty] || event.difficulty}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-5 mt-2">
        {/* Date & Time */}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{formatDate(event.startDate)}</p>
            <p className="text-sm text-gray-500">
              {formatTime(event.startDate)}
              {event.endDate && ` – ${formatTime(event.endDate)}`}
            </p>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{event.location}</p>
              {event.locationDetails && (
                <p className="text-sm text-gray-500">{event.locationDetails}</p>
              )}
            </div>
          </div>
        )}

        {/* Meeting URL */}
        {event.meetingUrl && (
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {event.meetingPlatform
                  ? event.meetingPlatform.charAt(0).toUpperCase() + event.meetingPlatform.slice(1)
                  : "Online meeting"}
              </p>
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {event.meetingUrl}
              </a>
            </div>
          </div>
        )}

        {/* Equipment */}
        {event.equipment && (
          <div className="flex items-start gap-3">
            <Dumbbell className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">{event.equipment}</p>
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="bg-[#F8FAFC] rounded-xl p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Registrations */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            Aanmeldingen ({event.registrationCount}
            {event.maxAttendees ? ` / ${event.maxAttendees}` : ""})
          </h3>
          {event.registrations.length > 0 ? (
            <div className="space-y-2">
              {event.registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                      {reg.user.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{reg.user.name}</span>
                  </div>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {reg.user.email}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nog geen aanmeldingen</p>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="rounded-xl gap-2"
          >
            <Pencil className="w-4 h-4" />
            Bewerken
          </Button>
          <DeleteEventButton eventId={event.id} eventTitle={event.title} />
        </div>
      </div>
    </DialogContent>
  );
}

/* ─── Edit View ───────────────────────────────────────── */

function EventEditView({
  event,
  onCancel,
  onSaved,
}: {
  event: EventData;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || "",
    eventType: event.eventType,
    date: toDateInputValue(event.startDate),
    time: toTimeInputValue(event.startDate),
    endTime: event.endDate ? toTimeInputValue(event.endDate) : "",
    location: event.location || "",
    locationDetails: event.locationDetails || "",
    meetingUrl: event.meetingUrl || "",
    meetingPlatform: event.meetingPlatform || "",
    imageUrl: event.imageUrl || "",
    videoUrl: event.videoUrl || "",
    equipment: event.equipment || "",
    difficulty: event.difficulty || "",
    maxAttendees: event.maxAttendees?.toString() || "",
  });

  const isOnlineEvent = formData.eventType === "ONLINE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time) {
      alert("Titel, datum en tijd zijn verplicht");
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = formData.endTime
        ? new Date(`${formData.date}T${formData.endTime}`)
        : null;

      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
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
          maxAttendees: formData.maxAttendees || undefined,
        }),
      });

      if (res.ok) {
        router.refresh();
        onSaved();
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
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader className="pb-2">
        <DialogTitle className="text-xl">Event bewerken</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Type */}
        <div className="space-y-2">
          <Label className="block">Type event</Label>
          <div className="grid grid-cols-2 gap-3">
            {eventTypeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.eventType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, eventType: option.value })}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                  <p className={`font-medium text-sm ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                    {option.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="edit-title">Titel *</Label>
          <Input
            id="edit-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="edit-description">Beschrijving</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-date">Datum *</Label>
            <Input
              id="edit-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-time">Starttijd *</Label>
            <Input
              id="edit-time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-endTime">Eindtijd</Label>
            <Input
              id="edit-endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>

        {/* Location (non-online) */}
        {!isOnlineEvent && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Locatie
              </Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-locationDetails">Locatie details</Label>
              <Textarea
                id="edit-locationDetails"
                value={formData.locationDetails}
                onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Online meeting details */}
        {isOnlineEvent && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <Video className="w-4 h-4" />
              Online meeting instellingen
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-meetingPlatform">Platform</Label>
              <Select
                value={formData.meetingPlatform}
                onValueChange={(value) => setFormData({ ...formData, meetingPlatform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="meet">Google Meet</SelectItem>
                  <SelectItem value="other">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-meetingUrl">Meeting URL *</Label>
              <Input
                id="edit-meetingUrl"
                value={formData.meetingUrl}
                onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Difficulty & Equipment */}
        {(formData.eventType === "TRAINING" || formData.eventType === "WORKSHOP") && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-difficulty">Niveau</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer niveau" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map((option) => (
                    <SelectItem key={option.value || "none"} value={option.value || "none"}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-equipment">Benodigdheden</Label>
              <Input
                id="edit-equipment"
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Meeting URL for OTHER type */}
        {formData.eventType === "OTHER" && (
          <div className="space-y-2">
            <Label htmlFor="edit-meetingUrlOther" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Meeting link (optioneel)
            </Label>
            <Input
              id="edit-meetingUrlOther"
              value={formData.meetingUrl}
              onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
              placeholder="https://zoom.us/j/... of andere link"
            />
          </div>
        )}

        {/* Image URL */}
        <div className="space-y-2">
          <Label htmlFor="edit-imageUrl">Afbeelding URL</Label>
          <Input
            id="edit-imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Video URL */}
        <div className="space-y-2">
          <Label htmlFor="edit-videoUrl">Promo video URL</Label>
          <Input
            id="edit-videoUrl"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          />
        </div>

        {/* Max attendees */}
        <div className="space-y-2">
          <Label htmlFor="edit-maxAttendees">Max. deelnemers</Label>
          <Input
            id="edit-maxAttendees"
            type="number"
            min="1"
            value={formData.maxAttendees}
            onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
            placeholder="Onbeperkt"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 pb-2">
          <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
            {loading ? "Opslaan..." : "Wijzigingen opslaan"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
            Annuleren
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

/* ─── Shared Components ───────────────────────────────── */

function EventTypeBadge({ type }: { type: string }) {
  const config = eventTypeConfig[type] || eventTypeConfig.OTHER;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} text-xs gap-1`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function EventRow({
  event,
  isPast,
  onClick,
}: {
  event: EventData;
  isPast: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 hover:bg-[#F8FAFC] active:bg-gray-50 transition-colors cursor-pointer ${
        isPast ? "opacity-50" : ""
      }`}
    >
      {/* Mobile layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <DateBadge dateStr={event.startDate} isPast={isPast} />
            <div className="min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(event.startDate)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.registrationCount}
            </span>
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex md:items-center md:gap-4">
        <DateBadge dateStr={event.startDate} isPast={isPast} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
            <EventTypeBadge type={event.eventType} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(event.startDate)}
              {event.endDate && ` – ${formatTime(event.endDate)}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            {event.registrationCount}
            {event.maxAttendees ? ` / ${event.maxAttendees}` : ""}
          </span>
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function DateBadge({ dateStr, isPast }: { dateStr: string; isPast: boolean }) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleDateString("nl-NL", { month: "short" }).toUpperCase();

  return (
    <div
      className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center ${
        isPast
          ? "bg-gray-100 text-gray-400"
          : "bg-blue-50 text-blue-600 border border-blue-100"
      }`}
    >
      <span className="text-lg font-bold leading-none">{day}</span>
      <span className="text-[10px] font-medium leading-none mt-0.5">{month}</span>
    </div>
  );
}
