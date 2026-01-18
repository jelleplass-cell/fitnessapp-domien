"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  ChevronLeft,
  CalendarPlus,
  AlertCircle,
  ExternalLink,
  FileText,
  Package,
  Info,
} from "lucide-react";

interface Attachment {
  name: string;
  url: string;
  type: string;
}

interface Attendee {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface EventDetailProps {
  event: {
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
    attachments: Attachment[];
    startDate: string;
    endDate: string | null;
    maxAttendees: number | null;
    requiresRegistration: boolean;
    registrationDeadlineHours: number;
    allowWaitlist: boolean;
    organizer: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    isRegistered: boolean;
    isOnWaitlist: boolean;
    registrationId: string | null;
    registeredCount: number;
    waitlistCount: number;
    attendees: Attendee[];
  };
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

const platformLabels: Record<string, string> = {
  zoom: "Zoom",
  teams: "Microsoft Teams",
  meet: "Google Meet",
  other: "Videoconferentie",
};

export function EventDetail({ event }: EventDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const config = eventTypeConfig[event.eventType as keyof typeof eventTypeConfig] || eventTypeConfig.OTHER;
  const Icon = config.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
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
    if (diffMins < 60) return `${diffMins} minuten`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours} uur en ${mins} minuten` : `${hours} uur`;
  };

  const canRegister = () => {
    if (!event.requiresRegistration) return false;
    const deadline = new Date(event.startDate);
    deadline.setHours(deadline.getHours() - event.registrationDeadlineHours);
    return new Date() < deadline;
  };

  const getDeadlineText = () => {
    const deadline = new Date(event.startDate);
    deadline.setHours(deadline.getHours() - event.registrationDeadlineHours);
    return deadline.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFull = () => {
    if (!event.maxAttendees) return false;
    return event.registeredCount >= event.maxAttendees;
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
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
      setLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!confirm("Weet je zeker dat je je wilt afmelden?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
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
      setLoading(false);
    }
  };

  const generateGoogleCalendarUrl = () => {
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

  const generateOutlookCalendarUrl = () => {
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

  const spotsLeft = event.maxAttendees ? event.maxAttendees - event.registeredCount : null;
  const full = isFull();
  const canReg = canRegister();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/client/events"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Terug naar events
      </Link>

      {/* Header Image */}
      {event.imageUrl && (
        <div
          className="h-48 md:h-64 bg-cover bg-center rounded-lg"
          style={{ backgroundImage: `url(${event.imageUrl})` }}
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Event Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className={config.color}>
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
                {event.difficulty && (
                  <Badge variant="outline">
                    {difficultyLabels[event.difficulty] || event.difficulty}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl md:text-2xl">{event.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Door {event.organizer.name}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{formatDate(event.startDate)}</p>
                  <p className="text-gray-600">
                    {formatTime(event.startDate)}
                    {event.endDate && ` - ${formatTime(event.endDate)}`}
                    {event.endDate && (
                      <span className="text-gray-400 ml-2">
                        ({formatDuration(event.startDate, event.endDate)})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  {event.eventType === "ONLINE" ? (
                    <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                  ) : (
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{event.location}</p>
                    {event.locationDetails && (
                      <p className="text-gray-600 text-sm">{event.locationDetails}</p>
                    )}
                    {event.eventType === "ONLINE" && event.meetingPlatform && (
                      <p className="text-gray-600 text-sm">
                        Via {platformLabels[event.meetingPlatform] || event.meetingPlatform}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Equipment */}
              {event.equipment && (
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Benodigdheden</p>
                    <p className="text-gray-600 text-sm">{event.equipment}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div>
                  <h3 className="font-semibold mb-2">Beschrijving</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Promo Video */}
              {event.videoUrl && (
                <div>
                  <h3 className="font-semibold mb-2">Video</h3>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {event.videoUrl.includes("youtube") || event.videoUrl.includes("youtu.be") ? (
                      <iframe
                        src={event.videoUrl.replace("watch?v=", "embed/")}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <video src={event.videoUrl} controls className="w-full h-full" />
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {event.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Bijlagen</h3>
                  <div className="space-y-2">
                    {event.attachments.map((attachment, i) => (
                      <a
                        key={i}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="flex-1 text-sm">{attachment.name}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Registration & Attendees */}
        <div className="space-y-6">
          {/* Registration Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Registration status */}
              {event.isRegistered && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Je bent aangemeld</span>
                </div>
              )}

              {event.isOnWaitlist && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-700">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <span className="font-medium">Je staat op de wachtlijst</span>
                    <p className="text-sm">Positie #{event.waitlistCount}</p>
                  </div>
                </div>
              )}

              {/* Spots info */}
              {event.maxAttendees && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>
                    {event.registeredCount} / {event.maxAttendees} deelnemers
                  </span>
                </div>
              )}

              {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
                <p className="text-orange-600 text-sm">
                  Nog {spotsLeft} plek{spotsLeft > 1 ? "ken" : ""} beschikbaar!
                </p>
              )}

              {/* Registration deadline */}
              {event.requiresRegistration && canReg && (
                <div className="flex items-start gap-2 text-sm text-gray-500">
                  <Info className="w-4 h-4 mt-0.5" />
                  <span>Aanmelden mogelijk tot {getDeadlineText()}</span>
                </div>
              )}

              {/* Action buttons */}
              {event.requiresRegistration ? (
                event.isRegistered || event.isOnWaitlist ? (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={handleUnregister}
                      disabled={loading}
                    >
                      {loading ? "Bezig..." : "Afmelden"}
                    </Button>
                    {event.eventType === "ONLINE" && event.meetingUrl && event.isRegistered && (
                      <Button className="w-full" asChild>
                        <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="w-4 h-4 mr-2" />
                          Deelnemen aan sessie
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleRegister}
                    disabled={loading || (!canReg && full && !event.allowWaitlist)}
                  >
                    {loading ? (
                      "Bezig..."
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
                        <Check className="w-4 h-4 mr-2" />
                        Aanmelden
                      </>
                    )}
                  </Button>
                )
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Voor dit event hoef je je niet aan te melden. Voeg het toe aan je agenda:
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={generateGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        Google
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={generateOutlookCalendarUrl()} target="_blank" rel="noopener noreferrer">
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        Outlook
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Add to calendar for registered users */}
              {event.isRegistered && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Toevoegen aan agenda:</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={generateGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        Google
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={generateOutlookCalendarUrl()} target="_blank" rel="noopener noreferrer">
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        Outlook
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendees Card */}
          {event.attendees.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">
                  Deelnemers ({event.registeredCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {event.attendees.slice(0, 10).map((attendee) => (
                    <div
                      key={attendee.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                    >
                      <Avatar className="w-6 h-6">
                        {attendee.avatarUrl ? (
                          <AvatarImage src={attendee.avatarUrl} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {attendee.name.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm">{attendee.name}</span>
                    </div>
                  ))}
                  {event.attendees.length > 10 && (
                    <div className="flex items-center p-2 text-sm text-gray-500">
                      +{event.attendees.length - 10} anderen
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
