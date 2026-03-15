import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET messages for a conversation
export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { timestamp: "asc" },
  });

  // Mark unread messages as read for this user
  if (userId) {
    await prisma.chatMessage.updateMany({
      where: { conversationId, receiverId: userId, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json(messages);
}

// POST send a new message
export async function POST(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const { senderId, receiverId, content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
