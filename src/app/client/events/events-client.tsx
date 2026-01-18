"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  ExternalLink,
  AlertCircle,
  List,
} from "lucide-react";
import Link from "next/link";

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
  attachments: string | null;
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
}

interface EventsClientProps {
  events: EventData[];
  myEvents: EventData[];
}

const eventTypeConfig = {
  TRAINING: {
    label: "Training",
    icon: Dumbbell,
    color: "bg-orange-100 text-orange-800",
  },
  ONLINE: {
    label: "Online",
    icon: Laptop,
    color: "bg-blue-100 text-blue-800",
  },
  WORKSHOP: {
    label: "Workshop",
    icon: BookOpen,
    color: "bg-purple-100 text-purple-800",
  },
  OTHER: {
    label: "Event",
    icon: Calendar,
    color: "bg-gray-100 text-gray-800",
  },
};

const difficultyLabels: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Gemiddeld",
  ADVANCED: "Gevorderd",
};

export function EventsClient({ events, myEvents }: EventsClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}u ${mins}min` : `${hours} uur`;
  };

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
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
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
      setLoadingEvent(null);
    }
  };

  const handleUnregister = async (eventId: string) => {
    if (!confirm("Weet je zeker dat je je wilt afmelden?")) return;

    setLoadingEvent(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
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
      setLoadingEvent(null);
    }
  };

  const generateGoogleCalendarUrl = (event: EventData) => {
    const start = new Date(event.startDate).toISOString().replace(/[-:]/g, "").replace(".000", "");
    const end = event.endDate
      ? new Date(event.endDate).toISOString().replace(/[-:]/g, "").replace(".000", "")
      : start;

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || "",
      location: event.eventType === "ONLINE" && event.meetingUrl ? event.meetingUrl : (event.location || ""),
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateOutlookCalendarUrl = (event: EventData) => {
    const start = new Date(event.startDate).toISOString();
    const end = event.endDate ? new Date(event.endDate).toISOString() : start;

    const params = new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      subject: event.title,
      startdt: start,
      enddt: end,
      body: event.description || "",
      location: event.eventType === "ONLINE" && event.meetingUrl ? event.meetingUrl : (event.location || ""),
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  const EventCard = ({ event, compact = false }: { event: EventData; compact?: boolean }) => {
    const config = eventTypeConfig[event.eventType as keyof typeof eventTypeConfig] || eventTypeConfig.OTHER;
    const Icon = config.icon;
    const spotsLeft = event.maxAttendees ? event.maxAttendees - event.registeredCount : null;
    const full = isFull(event);
    const canReg = canRegister(event);

    return (
      <Card className={`overflow-hidden ${event.isRegistered || event.isOnWaitlist ? "ring-2 ring-blue-500" : ""}`}>
        {event.imageUrl && !compact && (
          <div
            className="h-32 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.imageUrl})` }}
          />
        )}
        <CardHeader className={compact ? "p-3" : "p-4"}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={config.color}>
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
                {event.difficulty && (
                  <Badge variant="outline" className="text-xs">
                    {difficultyLabels[event.difficulty] || event.difficulty}
                  </Badge>
                )}
              </div>
              <Link href={`/client/events/${event.id}`}>
                <CardTitle className={`${compact ? "text-sm" : "text-base"} hover:text-blue-600 transition-colors`}>
                  {event.title}
                </CardTitle>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className={compact ? "p-3 pt-0" : "p-4 pt-0"}>
          <div className={`flex flex-wrap gap-3 ${compact ? "text-xs" : "text-sm"} text-gray-600 mb-3`}>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatTime(event.startDate)}</span>
              {event.endDate && (
                <span className="text-gray-400">({formatDuration(event.startDate, event.endDate)})</span>
              )}
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                {event.eventType === "ONLINE" ? (
                  <Video className="w-4 h-4 text-gray-400" />
                ) : (
                  <MapPin className="w-4 h-4 text-gray-400" />
                )}
                <span className="truncate max-w-[200px]">{event.location}</span>
              </div>
            )}
            {event.maxAttendees && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span>
                  {event.registeredCount}/{event.maxAttendees}
                  {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 3 && (
                    <span className="text-orange-600 ml-1">({spotsLeft} plek{spotsLeft > 1 ? "ken" : ""} over)</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {!compact && event.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{event.description}</p>
          )}

          {/* Registration status */}
          {event.isRegistered && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-green-700 text-sm mb-3">
              <Check className="w-4 h-4" />
              <span>Je bent aangemeld</span>
            </div>
          )}

          {event.isOnWaitlist && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg text-yellow-700 text-sm mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>Je staat op de wachtlijst (#{event.waitlistCount})</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {event.requiresRegistration ? (
              event.isRegistered || event.isOnWaitlist ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnregister(event.id)}
                    disabled={loadingEvent === event.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    {loadingEvent === event.id ? "..." : "Afmelden"}
                  </Button>
                  {event.eventType === "ONLINE" && event.meetingUrl && event.isRegistered && (
                    <Button size="sm" asChild>
                      <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                        <Video className="w-4 h-4 mr-1" />
                        Deelnemen
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleRegister(event.id)}
                  disabled={loadingEvent === event.id || (!canReg && full && !event.allowWaitlist)}
                >
                  {loadingEvent === event.id ? (
                    "..."
                  ) : !canReg ? (
                    "Registratie gesloten"
                  ) : full ? (
                    event.allowWaitlist ? (
                      "Op wachtlijst zetten"
                    ) : (
                      "Vol"
                    )
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Aanmelden
                    </>
                  )}
                </Button>
              )
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={generateGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                    <CalendarPlus className="w-4 h-4 mr-1" />
                    Google
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={generateOutlookCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                    <CalendarPlus className="w-4 h-4 mr-1" />
                    Outlook
                  </a>
                </Button>
              </div>
            )}

            <Button variant="ghost" size="sm" asChild>
              <Link href={`/client/events/${event.id}`}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calendar view helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add padding days from previous month
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startPadding; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push(d);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add padding days for next month
    const endPadding = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((e) => {
      const eventDate = new Date(e.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const calendarDays = getDaysInMonth(calendarMonth);
  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  return (
    <div className="space-y-6">
      {/* My Events Section */}
      {myEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            Mijn aanmeldingen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEvents.map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alle events</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4 mr-1" />
            Lijst
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Kalender
          </Button>
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Geen komende events gepland.</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const prev = new Date(calendarMonth);
                  prev.setMonth(prev.getMonth() - 1);
                  setCalendarMonth(prev);
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold">
                {calendarMonth.toLocaleDateString("nl-NL", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = new Date(calendarMonth);
                  next.setMonth(next.getMonth() + 1);
                  setCalendarMonth(next);
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-7 gap-1">
              {/* Week day headers */}
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, i) => {
                const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const dayEvents = getEventsForDay(date);

                return (
                  <div
                    key={i}
                    className={`min-h-[80px] p-1 border rounded ${
                      isCurrentMonth ? "bg-white" : "bg-gray-50"
                    } ${isToday ? "border-blue-500" : "border-gray-200"}`}
                  >
                    <div
                      className={`text-xs font-medium mb-1 ${
                        isCurrentMonth ? "text-gray-900" : "text-gray-400"
                      } ${isToday ? "text-blue-600" : ""}`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => {
                        const config =
                          eventTypeConfig[
                            event.eventType as keyof typeof eventTypeConfig
                          ] || eventTypeConfig.OTHER;
                        return (
                          <Link
                            key={event.id}
                            href={`/client/events/${event.id}`}
                            className={`block text-xs p-1 rounded truncate ${config.color} hover:opacity-80`}
                          >
                            {formatTime(event.startDate)} {event.title}
                          </Link>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayEvents.length - 2} meer
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
