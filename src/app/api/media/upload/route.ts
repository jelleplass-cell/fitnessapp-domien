import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const ALLOWED_DOC_TYPES = [
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

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

function getImageDimensions(buffer: ArrayBuffer, mimeType: string): { width: number; height: number } | null {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) return null;

  const view = new DataView(buffer);

  try {
    if (mimeType === "image/png") {
      if (view.byteLength > 24) {
        return { width: view.getUint32(16), height: view.getUint32(20) };
      }
    }

    if (mimeType === "image/jpeg") {
      let offset = 2;
      while (offset < view.byteLength - 10) {
        if (view.getUint8(offset) === 0xff) {
          const marker = view.getUint8(offset + 1);
          if (marker >= 0xc0 && marker <= 0xc3) {
            const height = view.getUint16(offset + 5);
            const width = view.getUint16(offset + 7);
            return { width, height };
          }
          const segmentLength = view.getUint16(offset + 2);
          offset += 2 + segmentLength;
        } else {
          offset++;
        }
      }
    }

    if (mimeType === "image/gif") {
      if (view.byteLength > 10) {
        return {
          width: view.getUint16(6, true),
          height: view.getUint16(8, true),
        };
      }
    }

    if (mimeType === "image/webp") {
      if (view.byteLength > 30) {
        const vp8 = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15));
        if (vp8 === "VP8 ") {
          const width = view.getUint16(26, true) & 0x3fff;
          const height = view.getUint16(28, true) & 0x3fff;
          return { width, height };
        }
        if (vp8 === "VP8L") {
          const bits = view.getUint32(21, true);
          const width = (bits & 0x3fff) + 1;
          const height = ((bits >> 14) & 0x3fff) + 1;
          return { width, height };
        }
      }
    }
  } catch {
    // Failed to parse dimensions
  }

  return null;
}

const useVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

async function uploadFile(file: File, filename: string): Promise<{ url: string; pathname: string }> {
  if (useVercelBlob) {
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
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
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Geen bestanden ontvangen" }, { status: 400 });
    }

    if (files.length > 100) {
      return NextResponse.json({ error: "Maximaal 100 bestanden tegelijk" }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push({ name: file.name, error: "Bestandstype niet toegestaan" });
        continue;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        errors.push({ name: file.name, error: "Bestand te groot (max 10MB)" });
        continue;
      }

      // Generate safe filename
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}-${random}.${ext}`;

      // Upload file (Vercel Blob or local)
      const uploaded = await uploadFile(file, filename);

      // Get image dimensions from original file
      const arrayBuffer = await file.arrayBuffer();
      const dimensions = getImageDimensions(arrayBuffer, file.type);

      // Create Media record
      const media = await db.media.create({
        data: {
          url: uploaded.url,
          pathname: uploaded.pathname,
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          width: dimensions?.width ?? null,
          height: dimensions?.height ?? null,
          creatorId: session.user.id,
        },
      });

      results.push(media);
    }

    return NextResponse.json({ media: results, errors });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het uploaden" },
      { status: 500 }
    );
  }
}
