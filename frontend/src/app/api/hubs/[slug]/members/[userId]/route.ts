import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const { slug, userId: targetUserId } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.userId as string;

    const { action } = await request.json(); // "promote", "demote", "kick"
    if (!["promote", "demote", "kick"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const hub = await prisma.hub.findUnique({
      where: { slug },
    });

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    // Get current user's role
    const currentUserMembership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: hub.id,
          userId: currentUserId,
        },
      },
    });

    if (!currentUserMembership || !["admin", "owner"].includes(currentUserMembership.role)) {
      return NextResponse.json({ error: "Forbidden: Not an admin or owner" }, { status: 403 });
    }

    // Get target user's role
    const targetUserMembership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: hub.id,
          userId: targetUserId,
        },
      },
    });

    if (!targetUserMembership) {
      return NextResponse.json({ error: "User is not a member of this hub" }, { status: 404 });
    }

    const currentUserRole = currentUserMembership.role;
    const targetUserRole = targetUserMembership.role;

    if (targetUserRole === "owner") {
      return NextResponse.json({ error: "Cannot modify the hub owner" }, { status: 403 });
    }

    if (action === "promote") {
      if (targetUserRole === "admin") {
        return NextResponse.json({ error: "User is already an admin" }, { status: 400 });
      }
      await prisma.hubMember.update({
        where: { id: targetUserMembership.id },
        data: { role: "admin" },
      });
      return NextResponse.json({ message: "Promoted to admin" }, { status: 200 });
    }

    if (action === "demote") {
      if (targetUserRole === "member") {
        return NextResponse.json({ error: "User is already a member" }, { status: 400 });
      }
      if (currentUserRole !== "owner") {
        return NextResponse.json({ error: "Only the owner can demote admins" }, { status: 403 });
      }
      await prisma.hubMember.update({
        where: { id: targetUserMembership.id },
        data: { role: "member" },
      });
      return NextResponse.json({ message: "Demoted to member" }, { status: 200 });
    }

    if (action === "kick") {
      if (targetUserRole === "admin" && currentUserRole !== "owner") {
        return NextResponse.json({ error: "Only the owner can kick admins" }, { status: 403 });
      }
      await prisma.hubMember.delete({
        where: { id: targetUserMembership.id },
      });
      // Also decrement member count
      await prisma.hub.update({
        where: { id: hub.id },
        data: { memberCount: { decrement: 1 } },
      });
      return NextResponse.json({ message: "User kicked from hub" }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/hubs/[slug]/members/[userId] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
