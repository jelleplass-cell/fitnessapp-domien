import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { EventDetail } from "./event-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const event = await db.event.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          firstName: true,
          avatarUrl: true,
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
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const userRegistration = event.registrations.find(r => r.userId === session.user!.id);
  const registeredCount = event.registrations.filter(r => r.status === "REGISTERED" && !r.isWaitlist).length;
  const waitlistCount = event.registrations.filter(r => r.isWaitlist).length;
  const attendees = event.registrations
    .filter(r => r.status === "REGISTERED" && !r.isWaitlist)
    .map(r => ({
      id: r.user.id,
      name: r.user.firstName || r.user.name,
      avatarUrl: r.user.avatarUrl,
    }));

  // Parse attachments if present
  let attachments: { name: string; url: string; type: string }[] = [];
  if (event.attachments) {
    try {
      attachments = JSON.parse(event.attachments);
    } catch {
      // Invalid JSON, ignore
    }
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <EventDetail
        event={{
          id: event.id,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          location: event.location,
          locationDetails: event.locationDetails,
          meetingUrl: event.meetingUrl,
          meetingPlatform: event.meetingPlatform,
          imageUrl: event.imageUrl,
          videoUrl: event.videoUrl,
          equipment: event.equipment,
          difficulty: event.difficulty,
          attachments,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate?.toISOString() || null,
          maxAttendees: event.maxAttendees,
          requiresRegistration: event.requiresRegistration,
          registrationDeadlineHours: event.registrationDeadlineHours,
          allowWaitlist: event.allowWaitlist,
          organizer: {
            id: event.creator.id,
            name: event.creator.firstName || event.creator.name,
            avatarUrl: event.creator.avatarUrl,
          },
          isRegistered: userRegistration?.status === "REGISTERED" && !userRegistration?.isWaitlist,
          isOnWaitlist: userRegistration?.isWaitlist || false,
          registrationId: userRegistration?.id || null,
          registeredCount,
          waitlistCount,
          attendees,
        }}
        />
      </div>
    </div>
  );
}
