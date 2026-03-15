import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all conversations for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: { id: true, name: true, avatar: true } },
      userB: { select: { id: true, name: true, avatar: true } },
      messages: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { content: true, timestamp: true, senderId: true, read: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Count unread messages per conversation
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          conversationId: conv.id,
          receiverId: userId,
          read: false,
        },
      });
      return { ...conv, unreadCount };
    })
  );

  return NextResponse.json(withUnread);
}

// POST start a new conversation
export async function POST(req: NextRequest) {
  try {
    const { userAId, userBId } = await req.json();

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId, userBId },
          { userAId: userBId, userBId: userAId },
        ],
      },
    });

    if (existing) return NextResponse.json(existing);

    const conv = await prisma.conversation.create({
      data: { userAId, userBId },
      include: {
        userA: { select: { id: true, name: true, avatar: true } },
        userB: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(conv, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
