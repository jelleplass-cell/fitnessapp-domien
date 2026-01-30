import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
];

const useVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

async function uploadFile(file: File, filename: string): Promise<{ url: string; pathname: string }> {
  if (useVercelBlob) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`media/${filename}`, file, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url, pathname: blob.pathname };
  }

  // Local fallback: write to public/uploads
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filePath = path.join(uploadsDir, filename);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${filename}`,
    pathname: `uploads/${filename}`,
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand geüpload" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Bestand is te groot. Maximum is 10MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Bestandstype niet toegestaan." },
        { status: 400 }
      );
    }

    // Generate safe filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.includes(".") ? "." + file.name.split(".").pop() : "";
    const safeFileName = `${timestamp}-${randomStr}${ext}`;

    // Upload file (Vercel Blob or local fallback)
    const uploaded = await uploadFile(file, safeFileName);

    // Create Media record in DB
    await db.media.create({
      data: {
        url: uploaded.url,
        pathname: uploaded.pathname,
        filename: safeFileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        width: null,
        height: null,
        creatorId: session.user.id,
      },
    });

    // Return backwards-compatible response
    return NextResponse.json({
      url: uploaded.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
  }
}
