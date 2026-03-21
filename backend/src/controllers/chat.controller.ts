import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { io } from '../index';

export const getChannels = async (req: Request, res: Response) => {
  try {
    const wId = (req as any).user?.workspaceId;
    const uId = (req as any).user?.id;
    if (!wId || !uId) return res.status(401).json({ error: "Unauthorized" });

    // Fetch channels the user is a member of
    const channels = await prisma.channel.findMany({
      where: {
        workspaceId: wId,
        members: { some: { userId: uId } }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true, username: true } } } },
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
        _count: { select: { messages: true } }
      }
    });

    // Also auto-seed a "general" channel if none exist
    if (channels.length === 0) {
      const general = await prisma.channel.create({
        data: {
          workspaceId: wId,
          name: 'general',
          description: 'General discussion',
          members: {
            create: { userId: uId }
          }
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, avatar: true, username: true } } } },
          messages: { orderBy: { timestamp: 'desc' }, take: 1 },
          _count: { select: { messages: true } }
        }
      });
      return res.json([general]);
    }

    return res.json(channels);
  } catch (error) {
    return res.status(500).json({ error: "Error fetching channels" });
  }
};

export const openDm = async (req: Request, res: Response) => {
  try {
    const wId = (req as any).user?.workspaceId;
    const uId = (req as any).user?.id;
    const { targetUserId } = req.body;

    const sortedIds = [uId, targetUserId].sort();
    const dmName = `dm_${sortedIds[0]}_${sortedIds[1]}`;

    let channel = await prisma.channel.findUnique({
      where: { workspaceId_name: { workspaceId: wId, name: dmName } }
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          workspaceId: wId,
          name: dmName,
          members: {
            create: [
              { userId: uId },
              { userId: targetUserId }
            ]
          }
        }
      });
    }

    return res.json({ channelId: channel.id });
  } catch (error) {
    return res.status(500).json({ error: "Failed to open DM" });
  }
};

export const uploadAttachment = async (req: Request, res: Response) => {
  // Dummy endpoint for file uploads
  return res.json({ fileUrl: 'https://via.placeholder.com/150', fileName: 'mock-file.png', fileType: 'image/png', fileSize: 1024 });
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { channelId: id },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        reactions: { include: { user: { select: { id: true, name: true } } } },
        parent: { include: { sender: { select: { name: true } } } },
        _count: { select: { replies: true } }
      },
      orderBy: { timestamp: 'asc' }
    });
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: "Error fetching messages" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const uId = (req as any).user?.id;
    const { content, parentId, fileUrl, fileName, fileType, fileSize } = req.body;

    const msg = await prisma.chatMessage.create({
      data: {
        channelId: id,
        senderId: uId,
        content: content || "",
        parentId,
        fileUrl,
        fileName,
        fileType,
        fileSize
      }
    });

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: { members: true, workspace: true },
    });

    // Emit real-time event to channel room
    const fullMsg = await prisma.chatMessage.findUnique({
      where: { id: msg.id },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        parent: { include: { sender: { select: { name: true } } } },
        _count: { select: { replies: true } }
      }
    });
    io.to(`channel:${id}`).emit('new_message', fullMsg);

    if (channel && channel.name.startsWith("dm_")) {
      const otherMember = channel.members.find(m => m.userId !== uId);
      const sender = await prisma.user.findUnique({ where: { id: uId } });
      if (otherMember && sender) {
        const notification = await prisma.notification.create({
          data: {
            workspaceId: channel.workspaceId,
            userId: otherMember.userId,
            title: `New DM from ${sender.name}`,
            message: content || "Sent an attachment",
            link: `/chat`
          }
        });
        // Emit real-time notification to the target user
        io.to(`user:${otherMember.userId}`).emit('new_notification', notification);
      }
    }

    return res.json(fullMsg);
  } catch (error) {
    return res.status(500).json({ error: "Failed to send message" });
  }
};

export const reactToMessage = async (req: Request, res: Response) => {
  try {
    const uId = (req as any).user?.id;
    const { messageId, emoji } = req.body;

    const existing = await prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId: uId, emoji } }
    });

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.messageReaction.create({
        data: { messageId, userId: uId, emoji }
      });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to react" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const uId = (req as any).user?.id;

    await prisma.channelMember.update({
      where: { channelId_userId: { channelId: id, userId: uId } },
      data: { lastRead: new Date() }
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to mark as read" });
  }
};
