import { NextResponse } from "next/server";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete all related data in the correct order
    // 1. Delete session items
    await db.sessionItem.deleteMany({
      where: {
        session: {
          userId: session.user.id,
        },
      },
    });

    // 2. Delete sessions
    await db.session.deleteMany({
      where: { userId: session.user.id },
    });

    // 3. Delete scheduled programs
    await db.scheduledProgram.deleteMany({
      where: { clientId: session.user.id },
    });

    // 4. Delete exercise notes
    await db.clientExerciseNote.deleteMany({
      where: {
        clientProgram: {
          clientId: session.user.id,
        },
      },
    });

    // 5. Delete client programs
    await db.clientProgram.deleteMany({
      where: { clientId: session.user.id },
    });

    // 6. Delete notifications
    await db.notification.deleteMany({
      where: { userId: session.user.id },
    });

    // 7. Delete community post comments by user
    await db.postComment.deleteMany({
      where: { authorId: session.user.id },
    });

    // 8. Delete community posts by user
    await db.communityPost.deleteMany({
      where: { authorId: session.user.id },
    });

    // 9. Delete event registrations
    await db.eventRegistration.deleteMany({
      where: { userId: session.user.id },
    });

    // 10. Finally delete the user
    await db.user.delete({
      where: { id: session.user.id },
    });

    // Sign out the user
    await signOut({ redirect: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwijderen" },
      { status: 500 }
    );
  }
}
