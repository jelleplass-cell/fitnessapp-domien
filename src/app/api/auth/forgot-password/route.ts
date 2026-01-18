import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "E-mailadres is verplicht" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to user
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires,
      },
    });

    // In a real app, you would send an email here
    // For now, we'll just log the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    console.log("Password reset link:", resetUrl);

    // TODO: Send email with reset link
    // await sendEmail({
    //   to: user.email,
    //   subject: "Wachtwoord resetten - FitTrack Pro",
    //   html: `<p>Klik <a href="${resetUrl}">hier</a> om je wachtwoord te resetten. Deze link is 1 uur geldig.</p>`,
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
