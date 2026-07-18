import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const onlineFilter = searchParams.get("online") === "true";
    const searchQuery = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const hub = await prisma.hub.findUnique({
      where: { slug },
    });

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    if (hub.isPrivate) {
      if (!session?.userId) {
        return NextResponse.json({ error: "This is a private hub." }, { status: 403 });
      }
      const membership = await prisma.hubMember.findUnique({
        where: {
          hubId_userId: {
            hubId: hub.id,
            userId: session.userId as string,
          },
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "This is a private hub." }, { status: 403 });
      }
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Build the query where object
    const userWhereClause: Prisma.UserWhereInput = {};
    
    if (onlineFilter) {
      userWhereClause.lastSeen = {
        gte: fiveMinutesAgo,
      };
    }

    if (searchQuery) {
      userWhereClause.OR = [
        { firstName: { contains: searchQuery, mode: "insensitive" } },
        { lastName: { contains: searchQuery, mode: "insensitive" } },
        { username: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    const whereClause: Prisma.HubMemberWhereInput = {
      hubId: hub.id,
      user: Object.keys(userWhereClause).length > 0 ? userWhereClause : undefined,
    };

    const totalCount = await prisma.hubMember.count({
      where: whereClause,
    });

    const members = await prisma.hubMember.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            isVerified: true,
            lastSeen: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        joinedAt: "asc",
      },
    });

    const formattedMembers = members.map((m) => {
      const isOnline = m.user.lastSeen && new Date(m.user.lastSeen).getTime() >= fiveMinutesAgo.getTime();
      return {
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: {
          ...m.user,
          isOnline,
        },
      };
    });

    return NextResponse.json({
      members: formattedMembers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/hubs/[slug]/members error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
