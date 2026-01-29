import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Calendar, MapPin, Users } from "lucide-react";
import { CreateEventForm } from "./create-event-form";
import { DeleteEventButton } from "./delete-event-button";

export default async function InstructorEventsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const events = await db.event.findMany({
    where: { creatorId: session.user.id },
    orderBy: { startDate: "desc" },
    include: {
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPast = (date: Date) => date < new Date();

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500">Beheer je events en bekijk aanmeldingen</p>
        </div>
        <CreateEventForm />
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p>Je hebt nog geen events aangemaakt.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className={`bg-white rounded-3xl shadow-sm p-6 ${isPast(event.startDate) ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                    {event.title}
                    {isPast(event.startDate) && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        Afgelopen
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.startDate)} om {formatTime(event.startDate)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event._count.registrations}
                      {event.maxAttendees && ` / ${event.maxAttendees}`} aanmeldingen
                    </span>
                  </div>
                </div>
                <DeleteEventButton eventId={event.id} eventTitle={event.title} />
              </div>
              {event.description && (
                <p className="text-gray-700 text-sm mb-4">{event.description}</p>
              )}

              {event.registrations.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Aanmeldingen:</p>
                  <div className="space-y-2">
                    {event.registrations.map((reg) => (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <span>{reg.user.name}</span>
                        <span className="text-gray-500">{reg.user.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
