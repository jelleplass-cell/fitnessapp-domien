import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      language: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const body = await req.json();
    const { name, firstName, lastName, phone, email, language } = body;

    // Check if email is being changed and if it's already taken
    if (email && email !== session.user.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Dit e-mailadres is al in gebruik" },
          { status: 400 }
        );
      }
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        email: email || undefined,
        language: language || undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        language: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
