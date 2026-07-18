import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const userId = session.userId as string;

    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingRepost) {
      await prisma.repost.delete({
        where: { id: existingRepost.id },
      });
    } else {
      await prisma.repost.create({
        data: {
          userId,
          postId,
        },
      });

      // Best-effort notification; must never break the repost action.
      try {
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { authorId: true },
        });
        if (post && post.authorId !== userId) {
          await prisma.notification.create({
            data: {
              type: "repost",
              userId: post.authorId,
              fromUserId: userId,
              postId,
            },
          });
        }
      } catch (notifyError) {
        console.error("Repost Notification Error:", notifyError);
      }
    }

    const repostsCount = await prisma.repost.count({
      where: { postId },
    });

    return NextResponse.json({ 
      isReposted: !existingRepost, 
      repostsCount 
    }, { status: 200 });

  } catch (error) {
    console.error("Toggle Repost Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
