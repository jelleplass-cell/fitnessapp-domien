import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { EventsList } from "./events-list";

export default async function EventsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const now = new Date();

  const events = await db.event.findMany({
    where: {
      startDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      registrations: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Events</h1>
        <p className="text-sm text-gray-500">Bekijk en meld je aan voor komende events</p>
      </div>

      <EventsList
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: e.startDate.toISOString(),
          location: e.location,
          maxParticipants: e.maxAttendees,
          organizer: e.creator,
          isRegistered: e.registrations.length > 0,
          _count: e._count,
        }))}
      />
    </div>
  );
}
