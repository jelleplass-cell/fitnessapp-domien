import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { EventsClient } from "./events-client";

export default async function EventsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const now = new Date();
  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

  // Get all upcoming events (next 2 months)
  const events = await db.event.findMany({
    where: {
      startDate: {
        gte: now,
        lte: twoMonthsFromNow,
      },
    },
    orderBy: { startDate: "asc" },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          firstName: true,
        },
      },
      registrations: {
        select: {
          id: true,
          userId: true,
          status: true,
          isWaitlist: true,
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const userId = session.user.id;

  // Transform events for the client component
  const transformedEvents = events.map((e) => {
    const userRegistration = e.registrations.find(r => r.userId === userId);
    const registeredUsers = e.registrations.filter(r => r.status === "REGISTERED" && !r.isWaitlist);
    const waitlistUsers = e.registrations.filter(r => r.isWaitlist);

    // Find user's waitlist position
    let waitlistPosition: number | null = null;
    if (userRegistration?.isWaitlist) {
      waitlistPosition = waitlistUsers.findIndex(r => r.userId === userId) + 1;
    }

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      location: e.location,
      locationDetails: e.locationDetails,
      meetingUrl: e.meetingUrl,
      meetingPlatform: e.meetingPlatform,
      imageUrl: e.imageUrl,
      videoUrl: e.videoUrl,
      equipment: e.equipment,
      difficulty: e.difficulty,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() || null,
      maxAttendees: e.maxAttendees,
      requiresRegistration: e.requiresRegistration,
      registrationDeadlineHours: e.registrationDeadlineHours,
      allowWaitlist: e.allowWaitlist,
      organizer: {
        id: e.creator.id,
        name: e.creator.firstName || e.creator.name || "Instructeur",
      },
      isRegistered: userRegistration?.status === "REGISTERED" && !userRegistration?.isWaitlist,
      isOnWaitlist: userRegistration?.isWaitlist || false,
      registrationId: userRegistration?.id || null,
      registeredCount: registeredUsers.length,
      waitlistCount: waitlistUsers.length,
      waitlistPosition,
      attendees: registeredUsers.map(r => ({
        id: r.user.id,
        name: r.user.firstName || r.user.name || "Onbekend",
      })),
    };
  });

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500">
          Bekijk en meld je aan voor komende trainingen, workshops en online sessies
        </p>
      </div>

      <EventsClient events={transformedEvents} />
    </div>
  );
}
