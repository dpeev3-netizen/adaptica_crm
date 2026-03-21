import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ActivitySchema } from '../lib/validations';

export const getActivities = async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    const entityType = req.query.entityType as string;

    const activities = await prisma.activity.findMany({
      where: {
        ...(entityId && { entityId }),
        ...(entityType && { entityType: entityType as any }),
        parentId: null
      },
      orderBy: { timestamp: "desc" },
      include: {
        user: { select: { name: true } },
        attachments: true,
        children: {
          include: { 
            user: { select: { name: true } },
            attachments: true
          },
          orderBy: { timestamp: "asc" }
        }
      }
    });
    return res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return res.status(500).json({ error: "Failed to fetch activities" });
  }
};

export const createActivity = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });

    const validatedData = ActivitySchema.parse(req.body);

    const activityDate = validatedData.dueDate 
      ? new Date(validatedData.dueDate) 
      : undefined;

    const activity = await prisma.activity.create({
      data: { 
        workspaceId,
        ...validatedData,
        dueDate: activityDate,
        parentId: req.body.parentId || null,
        hasAttachments: req.body.attachments && req.body.attachments.length > 0,
        attachments: req.body.attachments ? {
          create: req.body.attachments.map((a: any) => ({
            workspaceId,
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileSize: a.fileSize,
            mimeType: a.mimeType
          }))
        } : undefined
      },
      include: {
        user: { select: { name: true } },
        attachments: true,
        children: true
      }
    });

    return res.status(201).json(activity);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error creating activity:", error);
    return res.status(500).json({ error: "Failed to create activity" });
  }
};
