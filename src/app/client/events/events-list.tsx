"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Check, X } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  maxParticipants: number | null;
  organizer: {
    id: string;
    name: string;
  };
  isRegistered: boolean;
  _count: {
    registrations: number;
  };
}

interface EventsListProps {
  events: Event[];
}

export function EventsList({ events }: EventsListProps) {
  const router = useRouter();
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);

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

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Geen komende events gepland.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const isFull = event.maxParticipants
          ? event._count.registrations >= event.maxParticipants
          : false;
        const spotsLeft = event.maxParticipants
          ? event.maxParticipants - event._count.registrations
          : null;

        return (
          <Card key={event.id}>
            <CardHeader className="p-4 md:p-6 pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base md:text-lg">{event.title}</CardTitle>
                  <p className="text-sm text-gray-500">Door {event.organizer.name}</p>
                </div>
                {event.isRegistered ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnregister(event.id)}
                    disabled={loadingEvent === event.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {loadingEvent === event.id ? "..." : "Afmelden"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleRegister(event.id)}
                    disabled={loadingEvent === event.id || isFull}
                  >
                    {isFull ? (
                      "Vol"
                    ) : loadingEvent === event.id ? (
                      "..."
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Aanmelden
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              {event.description && (
                <p className="text-gray-700 text-sm mb-4">{event.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(event.date)}</span>
                  <span className="text-gray-400">om</span>
                  <span>{formatTime(event.date)}</span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{event.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>
                    {event._count.registrations} aangemeld
                    {event.maxParticipants && (
                      <span className="text-gray-400">
                        {" "}
                        ({spotsLeft} plekken over)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {event.isRegistered && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                  <Check className="w-4 h-4" />
                  Je bent aangemeld voor dit event
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
