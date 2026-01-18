"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function startSession(clientProgramId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if clientProgram belongs to user
  const clientProgram = await db.clientProgram.findFirst({
    where: { id: clientProgramId, clientId: session.user.id },
  });

  if (!clientProgram) {
    throw new Error("Programma niet gevonden");
  }

  // Check if there's already an active session
  const existingSession = await db.session.findFirst({
    where: {
      clientProgramId,
      userId: session.user.id,
      status: "IN_PROGRESS",
    },
  });

  if (existingSession) {
    redirect(`/client/programs/${clientProgramId}/session`);
  }

  // Create new session
  await db.session.create({
    data: {
      clientProgramId,
      userId: session.user.id,
      status: "IN_PROGRESS",
    },
  });

  redirect(`/client/programs/${clientProgramId}/session`);
}
