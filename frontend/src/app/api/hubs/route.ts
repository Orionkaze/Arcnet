import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;

    const hubs = await prisma.hub.findMany({
      orderBy: { createdAt: "asc" },
    });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const hubsWithStats = await Promise.all(
      hubs.map(async (hub) => {
        const onlineCount = await prisma.hubMember.count({
          where: {
            hubId: hub.id,
            user: {
              lastSeen: {
                gte: fiveMinutesAgo,
              },
            },
          },
        });

        let joined = false;
        if (userId) {
          const membership = await prisma.hubMember.findUnique({
            where: {
              hubId_userId: {
                hubId: hub.id,
                userId,
              },
            },
          });
          joined = !!membership;
        }

        return {
          ...hub,
          onlineCount,
          joined,
        };
      })
    );

    return NextResponse.json({ hubs: hubsWithStats });
  } catch (error) {
    console.error("GET /api/hubs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
