import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hubMemberships = await prisma.hubMember.findMany({
      where: {
        userId: session.userId as string,
        hub: {
          isPrivate: true,
        },
      },
      include: {
        hub: {
          select: {
            id: true,
            slug: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const privateHubs = hubMemberships.map((m) => m.hub);

    return NextResponse.json({ hubs: privateHubs }, { status: 200 });
  } catch (error) {
    console.error("Fetch Private Hubs Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
