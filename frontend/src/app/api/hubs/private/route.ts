import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

function generateJoinCode(length: number = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generous per-user limit to curb automated hub-spam.
    const rateLimit = checkRateLimit(
      `private_hub_create:${session.userId as string}`,
      10,
      60 * 1000
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "You're creating hubs too fast. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.hub.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate unique join code
    let joinCode = generateJoinCode();
    while (await prisma.hub.findUnique({ where: { joinCode } })) {
      joinCode = generateJoinCode();
    }

    // Create the Hub, default channel, and owner membership in a transaction
    const newHub = await prisma.$transaction(async (tx) => {
      const hub = await tx.hub.create({
        data: {
          slug: uniqueSlug,
          name,
          description,
          icon: "🔒",
          isPrivate: true,
          joinCode,
          memberCount: 1,
        },
      });

      await tx.hubMember.create({
        data: {
          hubId: hub.id,
          userId: session.userId as string,
          role: "owner",
        },
      });

      await tx.channel.create({
        data: {
          name: "general",
          hubId: hub.id,
        },
      });

      return hub;
    });

    return NextResponse.json({ hub: newHub, joinCode }, { status: 201 });
  } catch (error) {
    console.error("Create Private Hub Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
