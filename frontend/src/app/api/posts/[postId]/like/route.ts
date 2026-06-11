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

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });
    }

    const likesCount = await prisma.like.count({
      where: { postId },
    });

    return NextResponse.json({ 
      isLiked: !existingLike, 
      likesCount 
    }, { status: 200 });

  } catch (error) {
    console.error("Toggle Like Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
