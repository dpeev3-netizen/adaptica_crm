import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

export const patchNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { ids } = req.body;
    
    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId },
        data: { read: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
