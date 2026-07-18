import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate size and format again on backend
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please use JPG, PNG or WEBP" }, { status: 400 });
    }

    // Get current user details for the filename
    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: { username: true },
    });

    const username = user?.username || session.userId;
    // Derive extension from the already-validated MIME type, never the
    // client-controlled filename (prevents path injection).
    const extByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = extByType[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Invalid file type. Please use JPG, PNG or WEBP" }, { status: 400 });
    }
    const filename = `${username}_cover.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "covers");
    
    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Clean up any old cover files for that user under public/uploads/covers/
    try {
      const files = await fs.readdir(uploadDir);
      for (const f of files) {
        if (f.startsWith(`${username}_cover.`)) {
          await fs.unlink(path.join(uploadDir, f));
        }
      }
    } catch {
      // Ignore if folder doesn't exist yet
    }

    // Save file to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/covers/${filename}`;

    // Update in database
    const updatedUser = await prisma.user.update({
      where: { id: session.userId as string },
      data: { cover: publicUrl },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        avatar: true,
        cover: true,
        isVerified: true,
        isOnboarded: true,
        bio: true,
        role: true,
        location: true,
        skills: true,
        socialLinks: true,
      },
    });

    return NextResponse.json({ success: true, cover: publicUrl, user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Cover Upload API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
