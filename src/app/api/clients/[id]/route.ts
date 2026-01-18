import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

function generatePassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// GET - Get single client
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await db.user.findUnique({
    where: { id, role: "CLIENT" },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      street: true,
      houseNumber: true,
      postalCode: true,
      city: true,
      country: true,
      dateOfBirth: true,
      notes: true,
      createdAt: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

// PUT - Update client profile
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Check if client exists
  const existing = await db.user.findUnique({
    where: { id, role: "CLIENT" },
  });

  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // If email is being changed, check if it's already taken
  if (body.email && body.email !== existing.email) {
    const emailTaken = await db.user.findUnique({
      where: { email: body.email },
    });

    if (emailTaken) {
      return NextResponse.json(
        { error: "Email is al in gebruik" },
        { status: 400 }
      );
    }
  }

  const updatedClient = await db.user.update({
    where: { id },
    data: {
      name: body.name,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      street: body.street,
      houseNumber: body.houseNumber,
      postalCode: body.postalCode,
      city: body.city,
      country: body.country,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      notes: body.notes,
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      street: true,
      houseNumber: true,
      postalCode: true,
      city: true,
      country: true,
      dateOfBirth: true,
      notes: true,
    },
  });

  return NextResponse.json(updatedClient);
}

// DELETE - Delete client
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if client exists
  const existing = await db.user.findUnique({
    where: { id, role: "CLIENT" },
  });

  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Delete the client (cascades will handle related data)
  await db.user.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

// PATCH - Reset password
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Check if client exists
  const existing = await db.user.findUnique({
    where: { id, role: "CLIENT" },
  });

  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (body.action === "reset-password") {
    // Generate new password
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      newPassword: plainPassword, // Only shown once!
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
