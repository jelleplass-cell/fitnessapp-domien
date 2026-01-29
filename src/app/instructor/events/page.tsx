import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { CreateEventForm } from "./create-event-form";
import { EventsList } from "./events-list";

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

  const now = new Date();

  const serializeEvent = (event: (typeof events)[number]) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() || null,
    location: event.location,
    locationDetails: event.locationDetails,
    meetingUrl: event.meetingUrl,
    meetingPlatform: event.meetingPlatform,
    imageUrl: event.imageUrl,
    videoUrl: event.videoUrl,
    equipment: event.equipment,
    difficulty: event.difficulty,
    maxAttendees: event.maxAttendees,
    registrationCount: event._count.registrations,
    registrations: event.registrations.map((reg) => ({
      id: reg.id,
      user: {
        id: reg.user.id,
        name: reg.user.name,
        email: reg.user.email,
      },
    })),
  });

  const upcomingEvents = events
    .filter((e) => e.startDate >= now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map(serializeEvent);

  const pastEvents = events
    .filter((e) => e.startDate < now)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    .map(serializeEvent);

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
        <EventsList upcomingEvents={upcomingEvents} pastEvents={pastEvents} />
      )}
    </div>
  );
}
