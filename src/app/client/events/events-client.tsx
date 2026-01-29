"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Check,
  Clock,
  Video,
  Dumbbell,
  Laptop,
  BookOpen,
  AlertCircle,
  ExternalLink,
  Link2,
} from "lucide-react";

interface Attendee {
  id: string;
  name: string;
}

interface EventData {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  location: string | null;
  locationDetails: string | null;
  meetingUrl: string | null;
  meetingPlatform: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  equipment: string | null;
  difficulty: string | null;
  startDate: string;
  endDate: string | null;
  maxAttendees: number | null;
  requiresRegistration: boolean;
  registrationDeadlineHours: number;
  allowWaitlist: boolean;
  organizer: {
    id: string;
    name: string;
  };
  isRegistered: boolean;
  isOnWaitlist: boolean;
  registrationId: string | null;
  registeredCount: number;
  waitlistCount: number;
  waitlistPosition: number | null;
  attendees: Attendee[];
}

interface EventsClientProps {
  events: EventData[];
}

const eventTypeConfig = {
  TRAINING: { label: "Training", icon: Dumbbell, color: "bg-orange-100 text-orange-800" },
  ONLINE: { label: "Online", icon: Laptop, color: "bg-blue-100 text-blue-800" },
  WORKSHOP: { label: "Workshop", icon: BookOpen, color: "bg-purple-100 text-purple-800" },
  OTHER: { label: "Event", icon: Calendar, color: "bg-gray-100 text-gray-800" },
};

const difficultyLabels: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Gemiddeld",
  ADVANCED: "Gevorderd",
};

function EventTypeBadge({ eventType }: { eventType: string }) {
  const config = eventTypeConfig[eventType as keyof typeof eventTypeConfig] || eventTypeConfig.OTHER;
  const Icon = config.icon;
  return (
    <Badge className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

function DateBadge({ dateStr, registered }: { dateStr: string; registered?: boolean }) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleDateString("nl-NL", { month: "short" }).replace(".", "");
  return (
    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center shrink-0 ${
      registered ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 border border-blue-200"
    }`}>
      <span className="text-xs font-medium leading-none">{month}</span>
      <span className="text-lg font-bold leading-none">{day}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end: string | null) {
  if (!end) return "";
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}u ${mins}min` : `${hours} uur`;
}

function googleMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function EventsClient({ events }: EventsClientProps) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);

  const myEvents = events.filter((e) => e.isRegistered || e.isOnWaitlist);
  const otherEvents = events.filter((e) => !e.isRegistered && !e.isOnWaitlist);

  const canRegister = (event: EventData) => {
    if (!event.requiresRegistration) return false;
    const deadline = new Date(event.startDate);
    deadline.setHours(deadline.getHours() - event.registrationDeadlineHours);
    return new Date() < deadline;
  };

  const isFull = (event: EventData) => {
    if (!event.maxAttendees) return false;
    return event.registeredCount >= event.maxAttendees;
  };

  const handleRegister = async (eventId: string) => {
    setLoadingEvent(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, { method: "POST" });
      if (res.ok) {
        router.refresh();
        setSelectedEvent(null);
      } else {
        const data = await res.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setLoadingEvent(null);
    }
  };

  const handleUnregister = async (eventId: string) => {
    if (!confirm("Weet je zeker dat je je wilt afmelden?")) return;
    setLoadingEvent(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        setSelectedEvent(null);
      } else {
        const data = await res.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setLoadingEvent(null);
    }
  };

  const EventRow = ({ event }: { event: EventData }) => {
    const spotsLeft = event.maxAttendees ? event.maxAttendees - event.registeredCount : null;
    const full = isFull(event);

    return (
      <div
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
        onClick={() => setSelectedEvent(event)}
      >
        <DateBadge dateStr={event.startDate} registered={event.isRegistered} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <EventTypeBadge eventType={event.eventType} />
            {event.difficulty && (
              <Badge variant="outline" className="text-xs">
                {difficultyLabels[event.difficulty] || event.difficulty}
              </Badge>
            )}
          </div>
          <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(event.startDate)}
              {event.endDate && (
                <span className="text-gray-400">({formatDuration(event.startDate, event.endDate)})</span>
              )}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                {event.eventType === "ONLINE" ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {event.maxAttendees && (
            <div className="text-right text-sm">
              <div className={`font-medium ${full ? "text-red-600" : spotsLeft !== null && spotsLeft <= 3 ? "text-orange-600" : "text-gray-600"}`}>
                {event.registeredCount}/{event.maxAttendees}
              </div>
              <div className="text-xs text-gray-400">plekken</div>
            </div>
          )}
          {event.isRegistered && (
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
          )}
          {event.isOnWaitlist && (
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const EventDetail = ({ event }: { event: EventData }) => {
    const spotsLeft = event.maxAttendees ? event.maxAttendees - event.registeredCount : null;
    const full = isFull(event);
    const canReg = canRegister(event);
    const isOnline = event.eventType === "ONLINE";

    return (
      <div className="space-y-6">
        {/* Image */}
        {event.imageUrl && (
          <div className="relative h-48 -mx-6 -mt-2 overflow-hidden rounded-t-lg">
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Registration status banner */}
        {event.isRegistered && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700 text-sm border border-green-100">
            <Check className="w-4 h-4 shrink-0" />
            <span className="font-medium">Je bent aangemeld voor dit event</span>
          </div>
        )}
        {event.isOnWaitlist && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl text-yellow-700 text-sm border border-yellow-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              Je staat op de wachtlijst (positie #{event.waitlistPosition || "?"})
            </span>
          </div>
        )}

        {/* Type & difficulty */}
        <div className="flex items-center gap-2 flex-wrap">
          <EventTypeBadge eventType={event.eventType} />
          {event.difficulty && (
            <Badge variant="outline">{difficultyLabels[event.difficulty] || event.difficulty}</Badge>
          )}
        </div>

        {/* Date & time */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <div className="font-medium text-gray-900">{formatDate(event.startDate)}</div>
              <div className="text-gray-500">
                {formatTime(event.startDate)}
                {event.endDate && ` - ${formatTime(event.endDate)} (${formatDuration(event.startDate, event.endDate)})`}
              </div>
            </div>
          </div>

          {/* Location with Google Maps link */}
          {event.location && (
            <div className="flex items-start gap-3 text-sm">
              {isOnline ? (
                <Video className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              ) : (
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              )}
              <div>
                {isOnline ? (
                  <div className="text-gray-900">Online sessie</div>
                ) : (
                  <a
                    href={googleMapsUrl(event.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {event.location}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {event.locationDetails && (
                  <div className="text-gray-500">{event.locationDetails}</div>
                )}
              </div>
            </div>
          )}

          {/* Meeting link - show for ONLINE and OTHER types when registered */}
          {event.meetingUrl && (isOnline || event.eventType === "OTHER") && (event.isRegistered || !event.requiresRegistration) && (
            <div className="flex items-center gap-3 text-sm">
              <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {event.meetingPlatform || "Meeting link"}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          {event.meetingUrl && (isOnline || event.eventType === "OTHER") && event.requiresRegistration && !event.isRegistered && !event.isOnWaitlist && (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Link2 className="w-4 h-4 shrink-0" />
              <span>Meeting link zichtbaar na aanmelding</span>
            </div>
          )}

          {/* Equipment */}
          {event.equipment && (
            <div className="flex items-center gap-3 text-sm">
              <Dumbbell className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-700">{event.equipment}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Beschrijving</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{event.description}</p>
          </div>
        )}

        {/* Spots info */}
        {event.maxAttendees && (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Aanmeldingen
              </span>
              <span className={`font-medium ${full ? "text-red-600" : "text-gray-900"}`}>
                {event.registeredCount} / {event.maxAttendees}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  full ? "bg-red-500" : spotsLeft !== null && spotsLeft <= 3 ? "bg-orange-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, (event.registeredCount / event.maxAttendees) * 100)}%` }}
              />
            </div>
            {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 3 && (
              <p className="text-xs text-orange-600 mt-1">
                Nog {spotsLeft} plek{spotsLeft > 1 ? "ken" : ""} beschikbaar
              </p>
            )}
            {full && event.allowWaitlist && (
              <p className="text-xs text-gray-500 mt-1">
                Vol - wachtlijst beschikbaar ({event.waitlistCount} wachtend)
              </p>
            )}
          </div>
        )}

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Deelnemers ({event.attendees.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {event.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-sm border border-gray-100"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                    {attendee.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700">{attendee.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          {event.requiresRegistration ? (
            event.isRegistered || event.isOnWaitlist ? (
              <Button
                variant="outline"
                onClick={() => handleUnregister(event.id)}
                disabled={loadingEvent === event.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                {loadingEvent === event.id ? "Bezig..." : "Afmelden"}
              </Button>
            ) : (
              <Button
                onClick={() => handleRegister(event.id)}
                disabled={loadingEvent === event.id || (!canReg && full && !event.allowWaitlist)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {loadingEvent === event.id ? (
                  "Bezig..."
                ) : !canReg ? (
                  "Registratie gesloten"
                ) : full ? (
                  event.allowWaitlist ? "Op wachtlijst zetten" : "Vol"
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Aanmelden
                  </>
                )}
              </Button>
            )
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* My registrations */}
        {myEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Mijn aanmeldingen
            </h2>
            <div className="space-y-2">
              {myEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Other events */}
        <div>
          {myEvents.length > 0 && (
            <h2 className="text-lg font-semibold mb-3">Andere events</h2>
          )}
          {otherEvents.length === 0 && myEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Geen komende events gepland</p>
            </div>
          ) : otherEvents.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500 text-sm">Je bent al aangemeld voor alle komende events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {otherEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event detail popup */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && <EventDetail event={selectedEvent} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
